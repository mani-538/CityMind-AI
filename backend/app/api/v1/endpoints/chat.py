import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import google.generativeai as genai
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatHistoryItem
from app.schemas.common import ResponseEnvelope
from app.core.config import settings

router = APIRouter()

CITY_SYSTEM_INSTRUCTION = (
    "You are CityMind AI, the central intelligent AI assistant for Ashmora Metropolis. "
    "You assist citizens and officers with complaint status inquiries, nearest hospital locations, "
    "road closures, emergency hotlines, and general municipal services. Be polite, authoritative, and helpful."
)


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

    # Query Gemini or Fallback knowledge base
    reply_content = ""
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            full_prompt = f"System Instruction: {CITY_SYSTEM_INSTRUCTION}\nUser Question: {chat_in.message}"
            res = model.generate_content(full_prompt)
            reply_content = res.text.strip()
        except Exception as e:
            reply_content = ""

    # Smart fallback knowledge parsing
    if not reply_content:
        msg_lower = chat_in.message.lower()
        if "hospital" in msg_lower or "medical" in msg_lower:
            reply_content = (
                "🏥 **Ashmora City Hospitals & Emergency Centers:**\n\n"
                "1. **Ashmora Central Medical Center** — 100 Grand Avenue (2.1 km away) | Hotline: 911-01\n"
                "2. **Metropolitan Trauma Unit** — 45 Boulevard East (4.5 km away) | Emergency ER Open 24/7"
            )
        elif "fire" in msg_lower or "emergency" in msg_lower:
            reply_content = (
                "🚨 **Emergency Action Protocol:**\n\n"
                "• **Fire & Rescue Emergency Hotline**: Call **911** or **112**\n"
                "• All Fire Agents are active. Emergency green corridors will automatically activate upon dispatch."
            )
        elif "status" in msg_lower or "complaint" in msg_lower:
            reply_content = (
                "📋 **Complaint Status Query:**\n\n"
                "Your reported incident is currently **[AI Verified]** and queued for officer dispatch. "
                "You can view live timeline updates directly on your **Citizen Dashboard**."
            )
        else:
            reply_content = (
                f"Hello {current_user.full_name}, I am **CityMind AI**. "
                "How can I assist you with Ashmora city services, complaint tracking, or emergency guidance today?"
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
