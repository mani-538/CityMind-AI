from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.complaint_repository import ComplaintRepository
from app.schemas.complaint import ComplaintCreate, ComplaintUpdateStatus, CitizenFeedback
from app.models.complaint import Complaint, ComplaintStatus, ComplaintPriority


class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ComplaintRepository(db)

    async def create_complaint(self, citizen_id: str, complaint_in: ComplaintCreate) -> Complaint:
        # Determine baseline priority based on category
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
            "priority": initial_priority,
            "ai_verified": False,
        }

        complaint = await self.repository.create(complaint_dict)

        # Attach images if provided
        if complaint_in.image_urls:
            for url in complaint_in.image_urls:
                await self.repository.add_image(complaint.id, url)

        await self.db.commit()
        return await self.repository.get_with_details(complaint.id)

    async def update_status(self, complaint_id: str, update_in: ComplaintUpdateStatus, officer_id: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint:
            return None

        update_dict = {"status": update_in.status}
        await self.repository.update(complaint_id, update_dict)

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

    async def add_feedback(self, complaint_id: str, feedback_in: CitizenFeedback, citizen_id: str) -> Optional[Complaint]:
        complaint = await self.repository.get_by_id(complaint_id)
        if not complaint or complaint.citizen_id != citizen_id:
            return None

        update_dict = {
            "citizen_rating": feedback_in.rating,
            "citizen_feedback_text": feedback_in.feedback_text,
        }
        await self.repository.update(complaint_id, update_dict)
        await self.db.commit()
        return await self.repository.get_with_details(complaint_id)
