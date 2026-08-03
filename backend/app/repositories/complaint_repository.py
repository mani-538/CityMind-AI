from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.complaint import Complaint, ComplaintImage


class ComplaintRepository(BaseRepository[Complaint]):
    def __init__(self, db: AsyncSession):
        super().__init__(Complaint, db)

    async def get_with_details(self, complaint_id: str) -> Optional[Complaint]:
        stmt = (
            select(Complaint)
            .options(selectinload(Complaint.images), selectinload(Complaint.assignments))
            .where(Complaint.id == complaint_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_citizen(self, citizen_id: str, skip: int = 0, limit: int = 50) -> List[Complaint]:
        stmt = (
            select(Complaint)
            .options(selectinload(Complaint.images))
            .where(Complaint.citizen_id == citizen_id)
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_department(self, department_id: str, skip: int = 0, limit: int = 50) -> List[Complaint]:
        stmt = (
            select(Complaint)
            .options(selectinload(Complaint.images))
            .where(Complaint.department_id == department_id)
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_map_markers(self) -> List[Complaint]:
        stmt = select(Complaint).options(selectinload(Complaint.images)).where(Complaint.status != "Closed")
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def add_image(self, complaint_id: str, image_url: str, caption: Optional[str] = None) -> ComplaintImage:
        image = ComplaintImage(complaint_id=complaint_id, image_url=image_url, caption=caption)
        self.db.add(image)
        await self.db.flush()
        return image
