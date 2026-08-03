from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdateStatus,
    CitizenFeedback,
)
from app.schemas.common import ResponseEnvelope
from app.services.complaint_service import ComplaintService
from app.repositories.complaint_repository import ComplaintRepository

router = APIRouter()


@router.post("/", response_model=ResponseEnvelope[ComplaintResponse], status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_in: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ComplaintService(db)
    complaint = await service.create_complaint(current_user.id, complaint_in)

    # Optional: Automatically trigger background AI Agent verification
    try:
        from app.agents.head_agent import process_complaint_with_agents
        await process_complaint_with_agents(db, complaint.id)
    except Exception as e:
        print(f"AI Agent Background trigger warning: {e}")

    return ResponseEnvelope(
        success=True,
        message="Complaint submitted successfully and queued for AI verification",
        data=ComplaintResponse.model_validate(complaint),
    )


@router.get("/", response_model=ResponseEnvelope[List[ComplaintResponse]])
async def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ComplaintRepository(db)
    user_roles = [r.name for r in current_user.roles]

    # Citizens only see their own complaints; Officers see department complaints or all
    if "Citizen" in user_roles and not any(r in user_roles for r in ["Government Officer", "Department Admin", "Super Admin"]):
        complaints = await repo.get_by_citizen(current_user.id, skip=skip, limit=limit)
    elif department_id:
        complaints = await repo.get_by_department(department_id, skip=skip, limit=limit)
    else:
        complaints = await repo.get_all(skip=skip, limit=limit)

    return ResponseEnvelope(
        success=True,
        message="Complaints retrieved successfully",
        data=[ComplaintResponse.model_validate(c) for c in complaints],
    )


@router.get("/map/markers", response_model=ResponseEnvelope[List[ComplaintResponse]])
async def get_map_markers(db: AsyncSession = Depends(get_db)):
    repo = ComplaintRepository(db)
    complaints = await repo.get_active_map_markers()
    return ResponseEnvelope(
        success=True,
        message="Active GIS map markers retrieved successfully",
        data=[ComplaintResponse.model_validate(c) for c in complaints],
    )


@router.get("/{complaint_id}", response_model=ResponseEnvelope[ComplaintResponse])
async def get_complaint_details(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ComplaintRepository(db)
    complaint = await repo.get_with_details(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ResponseEnvelope(
        success=True,
        message="Complaint details retrieved successfully",
        data=ComplaintResponse.model_validate(complaint),
    )


@router.patch("/{complaint_id}/status", response_model=ResponseEnvelope[ComplaintResponse])
async def update_complaint_status(
    complaint_id: str,
    update_in: ComplaintUpdateStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    service = ComplaintService(db)
    complaint = await service.update_status(complaint_id, update_in, current_user.id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ResponseEnvelope(
        success=True,
        message=f"Complaint status updated to '{update_in.status}'",
        data=ComplaintResponse.model_validate(complaint),
    )


@router.post("/{complaint_id}/feedback", response_model=ResponseEnvelope[ComplaintResponse])
async def add_complaint_feedback(
    complaint_id: str,
    feedback_in: CitizenFeedback,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ComplaintService(db)
    complaint = await service.add_feedback(complaint_id, feedback_in, current_user.id)
    if not complaint:
        raise HTTPException(status_code=400, detail="Unable to submit feedback for this complaint")

    return ResponseEnvelope(
        success=True,
        message="Citizen feedback submitted successfully",
        data=ComplaintResponse.model_validate(complaint),
    )
