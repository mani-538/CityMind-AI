from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.complaint_repository import ComplaintRepository
from app.schemas.complaint import ComplaintCreate, ComplaintUpdateStatus, CitizenFeedback, ComplaintVerifyRequest, ComplaintRejectRequest
from app.models.complaint import Complaint, ComplaintStatus, ComplaintPriority, VerificationStatus


class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ComplaintRepository(db)

    async def create_complaint(self, citizen_id: str, citizen_name: str, complaint_in: ComplaintCreate) -> Complaint:
        category_lower = complaint_in.category.lower()
        if "fire" in category_lower or "hazard" in category_lower or "safety" in category_lower:
            initial_priority = ComplaintPriority.HIGH.value
        elif "water" in category_lower or "road" in category_lower or "traffic" in category_lower:
            initial_priority = ComplaintPriority.MEDIUM.value
        else:
            initial_priority = ComplaintPriority.LOW.value

        complaint_dict = {
            "title": complaint_in.title,
            "category": complaint_in.category,
            "description": complaint_in.description,
            "address": complaint_in.address,
            "latitude": complaint_in.latitude,
            "longitude": complaint_in.longitude,
            "citizen_id": citizen_id,
            "status": ComplaintStatus.SUBMITTED.value,
            "verification_status": VerificationStatus.PENDING_VERIFICATION.value,
            "priority": initial_priority,
            "ai_verified": False,
        }

        complaint = await self.repository.create(complaint_dict)

        # Add initial timeline event
        await self.repository.add_timeline_event(
            complaint_id=complaint.id,
            stage="Submitted",
            title="Complaint Registered",
            description=f"Complaint '{complaint_in.title}' submitted by citizen.",
            actor_role="Citizen",
            actor_name=citizen_name,
        )

        if complaint_in.image_urls:
            for url in complaint_in.image_urls:
                await self.repository.add_image(complaint.id, url)

        await self.db.commit()
        return await self.repository.get_with_details(complaint.id)

    async def verify_complaint(self, complaint_id: str, verify_in: ComplaintVerifyRequest, officer_name: str, officer_role: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint:
            return None

        update_dict = {
            "verification_status": VerificationStatus.VERIFIED.value,
            "status": ComplaintStatus.VERIFIED.value,
            "verified_by": officer_name,
            "verification_method": verify_in.verification_method,
            "verification_time": datetime.now(timezone.utc),
            "verification_notes": verify_in.notes or f"Verified via {verify_in.verification_method}",
        }
        await self.repository.update(complaint_id, update_dict)

        # Timeline event
        await self.repository.add_timeline_event(
            complaint_id=complaint_id,
            stage="Department Verified",
            title="Department Complaint Verification",
            description=f"Complaint verified by department officer via {verify_in.verification_method}. Notes: {verify_in.notes or 'None'}",
            actor_role=officer_role,
            actor_name=officer_name,
        )

        await self.db.commit()
        return await self.repository.get_with_details(complaint_id)

    async def reject_complaint(self, complaint_id: str, reject_in: ComplaintRejectRequest, officer_name: str, officer_role: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint:
            return None

        update_dict = {
            "verification_status": VerificationStatus.REJECTED.value,
            "status": ComplaintStatus.REJECTED.value,
            "verified_by": officer_name,
            "verification_time": datetime.now(timezone.utc),
            "verification_notes": f"REJECTED: {reject_in.reason}",
        }
        await self.repository.update(complaint_id, update_dict)

        # Timeline event
        await self.repository.add_timeline_event(
            complaint_id=complaint_id,
            stage="Rejected",
            title="Complaint Rejected",
            description=f"Complaint rejected by department. Reason: {reject_in.reason}",
            actor_role=officer_role,
            actor_name=officer_name,
        )

        await self.db.commit()
        return await self.repository.get_with_details(complaint_id)

    async def update_status(self, complaint_id: str, update_in: ComplaintUpdateStatus, officer_id: str, officer_name: str, officer_role: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint:
            return None

        update_dict = {"status": update_in.status}
        await self.repository.update(complaint_id, update_dict)

        await self.repository.add_timeline_event(
            complaint_id=complaint_id,
            stage=update_in.status,
            title=f"Status Changed to '{update_in.status}'",
            description=update_in.notes or f"Complaint status updated by {officer_name}",
            actor_role=officer_role,
            actor_name=officer_name,
        )

        if update_in.assigned_officer_id:
            from app.models.complaint import ComplaintAssignment
            assignment = ComplaintAssignment(
                complaint_id=complaint_id,
                assigned_officer_id=update_in.assigned_officer_id,
                assigned_by_id=officer_id,
                notes=update_in.notes,
            )
            self.db.add(assignment)

        await self.db.commit()
        return await self.repository.get_with_details(complaint_id)

    async def add_feedback(self, complaint_id: str, feedback_in: CitizenFeedback, citizen_id: str, citizen_name: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint or complaint.citizen_id != citizen_id:
            return None

        update_dict = {
            "citizen_rating": feedback_in.rating,
            "citizen_feedback_text": feedback_in.feedback_text,
        }
        await self.repository.update(complaint_id, update_dict)

        await self.repository.add_timeline_event(
            complaint_id=complaint_id,
            stage="Citizen Feedback",
            title=f"Citizen Feedback Submitted ({feedback_in.rating}/5 Stars)",
            description=feedback_in.feedback_text or "No text comments provided.",
            actor_role="Citizen",
            actor_name=citizen_name,
        )

        await self.db.commit()
        return await self.repository.get_with_details(complaint_id)
