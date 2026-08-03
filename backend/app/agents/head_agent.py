import time
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.base_agent import BaseAgent
from app.agents.complaint_agent import ComplaintAgent
from app.agents.fire_agent import FireAgent
from app.agents.traffic_agent import TrafficAgent
from app.agents.citizen_agent import CitizenAgent
from app.repositories.complaint_repository import ComplaintRepository
from app.models.notification import Notification


class HeadAgent(BaseAgent):
    def __init__(self):
        super().__init__("Head Agent (Orchestrator)")
        self.complaint_agent = ComplaintAgent()
        self.fire_agent = FireAgent()
        self.traffic_agent = TrafficAgent()
        self.citizen_agent = CitizenAgent()

    async def orchestrate_complaint_workflow(self, db: AsyncSession, complaint_id: str) -> Dict[str, Any]:
        start_time = time.time()

        repo = ComplaintRepository(db)
        complaint = await repo.get_with_details(complaint_id)
        if not complaint:
            return {"error": "Complaint not found"}

        # Step 1: Complaint Agent analyzes priority and summary
        analysis = await self.complaint_agent.analyze(
            db, complaint.id, complaint.title, complaint.category, complaint.description
        )

        # Update complaint model with AI results
        complaint.priority = analysis.get("priority", complaint.priority)
        complaint.ai_verified = True
        complaint.ai_confidence_score = analysis.get("confidence_score", 0.9)
        complaint.ai_summary = analysis.get("summary", "Verified by Ashmora AI Engine.")
        complaint.ai_recommended_action = analysis.get("recommended_action", "Proceed with municipal dispatch.")
        complaint.status = "AI Verified"

        # Step 2: Trigger specialized agents if Critical / High Emergency
        emergency_details = None
        if complaint.priority in ["Critical", "High"]:
            if "fire" in complaint.category.lower() or "hazard" in complaint.category.lower():
                emergency_details = await self.fire_agent.evaluate_hazard(
                    db, complaint.id, complaint.address, complaint.description
                )
            
            traffic_details = await self.traffic_agent.optimize_corridor(
                db, complaint.id, complaint.address, complaint.priority
            )
            if emergency_details:
                emergency_details["traffic_corridor"] = traffic_details

        # Step 3: Citizen Agent generates notification
        citizen_name = complaint.citizen.full_name if complaint.citizen else "Valued Citizen"
        notif_data = await self.citizen_agent.generate_notification(
            db, citizen_name, complaint.title, complaint.status, complaint.priority
        )

        # Save notification into DB
        notif = Notification(
            user_id=complaint.citizen_id,
            title=notif_data.get("notification_title", "Complaint Update"),
            message=notif_data.get("message", "Your complaint has been verified."),
            type="ALERT" if complaint.priority in ["Critical", "High"] else "INFO",
        )
        db.add(notif)

        await db.commit()

        execution_time = (time.time() - start_time) * 1000
        await self.log_execution(
            db,
            "ORCHESTRATE_WORKFLOW",
            complaint_id,
            {"priority": complaint.priority},
            {"status": complaint.status, "ai_summary": complaint.ai_summary},
            execution_time,
        )

        return {
            "complaint_id": complaint_id,
            "status": complaint.status,
            "priority": complaint.priority,
            "ai_summary": complaint.ai_summary,
            "emergency_details": emergency_details,
        }


async def process_complaint_with_agents(db: AsyncSession, complaint_id: str) -> Dict[str, Any]:
    orchestrator = HeadAgent()
    return await orchestrator.orchestrate_complaint_workflow(db, complaint_id)
