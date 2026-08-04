
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import google.generativeai as genai
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatHistory
from app.repositories.complaint_repository import ComplaintRepository
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatHistoryItem
from app.schemas.common import ResponseEnvelope
from app.core.config import settings

router = APIRouter()


@router.post("/message", response_model=ResponseEnvelope[ChatMessageResponse])
async def send_chat_message(
    chat_in: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_id = chat_in.session_id or "default_session"

    # Save User message to DB
    user_msg = ChatHistory(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=chat_in.message,
    )
    db.add(user_msg)
    await db.flush()

    # Load active user complaints for context injection
    repo = ComplaintRepository(db)
    user_roles = [r.name for r in current_user.roles]
    is_citizen = "Citizen" in user_roles

    if is_citizen:
        my_complaints = await repo.get_by_citizen(current_user.id, limit=5)
    else:
        my_complaints = await repo.get_all(limit=5)

    complaint_context_str = ""
    if my_complaints:
        complaint_context_str = "Recent Active Incidents:\n" + "\n".join(
            [f"- ID: {c.id[:8]} | Title: '{c.title}' | Category: {c.category} | Status: {c.status} | Verified: {c.verification_status}" for c in my_complaints]
        )
    else:
        complaint_context_str = "No active incidents currently reported."

    # System instruction with context injection
    system_prompt = (
        f"You are CityMind AI, the central intelligent AI Operating System assistant for Ashmora Metropolis.\n"
        f"User Name: {current_user.full_name}\n"
        f"User Role: {', '.join(user_roles)}\n"
        f"{complaint_context_str}\n\n"
        f"Respond politely, authoritatively, and concisely. Provide specific guidance on complaint tracking, emergency hotlines, hospital/police locations, or municipal protocols."
    )

    reply_content = ""
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            # Retrieve recent conversation history for memory
            history_stmt = (
                select(ChatHistory)
                .where(ChatHistory.user_id == current_user.id, ChatHistory.session_id == session_id)
                .order_by(ChatHistory.created_at.desc())
                .limit(6)
            )
            hist_res = await db.execute(history_stmt)
            past_messages = list(reversed(hist_res.scalars().all()))
            
            memory_prompt = system_prompt + "\n\nConversation Memory:\n"
            for m in past_messages:
                memory_prompt += f"{m.role.upper()}: {m.content}\n"
            memory_prompt += f"USER: {chat_in.message}\nCITYMIND AI:"

            res = model.generate_content(memory_prompt)
            if res and res.text:
                reply_content = res.text.strip()
        except Exception as e:
            print(f"Gemini API invocation error: {e}")
            reply_content = ""

    # Intelligent Context-Aware Municipal Engine (if Gemini API key unconfigured or rate limited)
    if not reply_content:
        msg_lower = chat_in.message.lower()

        if any(w in msg_lower for w in ["status", "pending", "my complaint", "my incident", "my report", "track"]):
            if my_complaints:
                latest = my_complaints[0]
                reply_content = (
                    f"📋 **Incident Status Report for {current_user.full_name}:**\n\n"
                    f"• **Title**: {latest.title}\n"
                    f"• **Category**: {latest.category}\n"
                    f"• **Verification Status**: **{latest.verification_status}**\n"
                    f"• **Lifecycle Stage**: **{latest.status}**\n"
                    f"• **Location**: {latest.address}\n\n"
                    f"You have **{len(my_complaints)} active report(s)**. Open the **Citizen Portal** or click **Timeline** on your dashboard for live dispatch tracking!"
                )
            else:
                reply_content = (
                    f"📋 Hello {current_user.full_name}, you currently have no active complaints on record.\n\n"
                    f"To report a new urban issue (e.g. Water Leakage, Fire Hazard, Road Damage), click **'Report New Incident'** in the Citizen Portal."
                )

        elif any(w in msg_lower for w in ["hospital", "medical", "doctor", "ambulance", "health", "icu"]):
            reply_content = (
                "🏥 **Ashmora City Hospitals & Emergency Trauma Centers:**\n\n"
                "1. **Ashmora Central Medical Center** — 100 Grand Avenue (2.1 km away) | Hotline: **911-01** / **(555) 911-01**\n"
                "2. **Metropolitan Trauma Unit** — 45 Boulevard East (4.5 km away) | 24/7 ICU Standby\n"
                "3. **Ashmora Children & Specialized Care** — 12 University Parkway (6.0 km away)\n\n"
                "⚡ *Hospital & EMS Agent is actively monitoring ambulance dispatch routes.*"
            )

        elif any(w in msg_lower for w in ["police", "crime", "station", "security", "threat", "blockade"]):
            reply_content = (
                "🚓 **Ashmora Police Department & Security Precincts:**\n\n"
                "1. **Central Command Precinct #1** — 10 Municipal Plaza | Emergency Line: **911-02**\n"
                "2. **East District Station #4** — 220 Harbor Drive | Dispatch Unit Active\n\n"
                "🚨 **Emergency Cordon Protocol:** Police Security Agents can deploy automated perimeter blockades for critical threats."
            )

        elif any(w in msg_lower for w in ["fire", "hazard", "burn", "smoke", "rescue"]):
            reply_content = (
                "🚨 **Fire & Rescue Emergency Command:**\n\n"
                "• **Immediate Emergency Hotline**: Dial **911** or **112**\n"
                "• **Bureau Contact**: `fire@ashmora.gov` | Hotline: **+1 (555) 911-01**\n\n"
                "🔥 **Fire Agent Protocol**: Critical fire complaints trigger automatic Pumper Unit dispatch and emergency traffic signal green corridors."
            )

        elif any(w in msg_lower for w in ["traffic", "congestion", "signal", "road", "block"]):
            reply_content = (
                "🚦 **Ashmora Traffic Management Bureau Status:**\n\n"
                "• **Traffic Control Agent**: Signal override corridors active along Grand Expressway.\n"
                "• **Active Detours**: Heavy towing units on standby for Exit 12 obstruction.\n"
                "• View real-time signal overlays on the **Live GIS City Map**."
            )

        elif any(w in msg_lower for w in ["register", "create", "how to report", "file"]):
            reply_content = (
                "📝 **How to Register a Complaint on CityMind AI:**\n\n"
                "1. Open **Citizen Portal** (`/citizen`)\n"
                "2. Click **'Report New Incident'**\n"
                "3. Fill in title, category, address, and drop pin location on the interactive GIS map\n"
                "4. Submit — your report is queued for **Department Verification** and Head AI pre-assessment!"
            )

        elif any(w in msg_lower for w in ["timeline", "workflow", "process", "steps"]):
            reply_content = (
                "🔄 **CityMind Incident Resolution Pipeline (10 Stages):**\n\n"
                "1. `Submitted` → 2. `Department Received` → 3. `Department Verified` → "
                "4. `Head AI Decision` → 5. `Agent Coordination` → 6. `Unit Dispatched` → "
                "7. `Work Started` → 8. `Completed` → 9. `Citizen Feedback` → 10. `Closed`"
            )

        else:
            reply_content = (
                f"Hello {current_user.full_name}! 👋 I am **CityMind AI**, the central intelligent OS assistant for Ashmora.\n\n"
                f"I can assist you with:\n"
                f"• **Complaint Tracking** ('What is my complaint status?')\n"
                f"• **Emergency Services** ('Nearest hospital / police station')\n"
                f"• **Filing Reports** ('How do I register a complaint?')\n"
                f"• **City Operations** ('Traffic conditions and signal status')\n\n"
                f"How can I help you today?"
            )

    # Save AI response to DB
    model_msg = ChatHistory(
        user_id=current_user.id,
        session_id=session_id,
        role="model",
        content=reply_content,
        intent="GENERAL",
    )
    db.add(model_msg)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Message processed successfully",
        data=ChatMessageResponse(
            session_id=session_id,
            role="model",
            content=reply_content,
            intent="GENERAL",
            created_at=model_msg.created_at,
        ),
    )


@router.get("/history/{session_id}", response_model=ResponseEnvelope[List[ChatHistoryItem]])
async def get_chat_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(ChatHistory)
        .where(ChatHistory.user_id == current_user.id, ChatHistory.session_id == session_id)
        .order_by(ChatHistory.created_at.asc())
    )
    result = await db.execute(stmt)
    history = list(result.scalars().all())

    return ResponseEnvelope(
        success=True,
        message="Chat history retrieved successfully",
        data=[ChatHistoryItem.model_validate(h) for h in history],
    )
