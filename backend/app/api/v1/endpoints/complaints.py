from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user, get_optional_user, require_roles
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdateStatus,
    CitizenFeedback,
    ComplaintVerifyRequest,
    ComplaintRejectRequest,
    ComplaintTimelineSchema,
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
    complaint = await service.create_complaint(current_user.id, current_user.full_name, complaint_in)

    # Optional: Trigger AI Agent pre-assessment
    try:
        from app.agents.head_agent import process_complaint_with_agents
        await process_complaint_with_agents(db, complaint.id)
    except Exception as e:
        print(f"AI Agent Background trigger warning: {e}")

    return ResponseEnvelope(
        success=True,
        message="Complaint submitted successfully. Queued for department verification.",
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


@router.get("/queue/verification", response_model=ResponseEnvelope[List[ComplaintResponse]])
async def get_verification_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    repo = ComplaintRepository(db)
    user_dept = current_user.department_id
    complaints = await repo.get_pending_verification(department_id=user_dept, skip=skip, limit=limit)
    
    return ResponseEnvelope(
        success=True,
        message="Department pending verification queue retrieved",
        data=[ComplaintResponse.model_validate(c) for c in complaints],
    )


@router.get("/map/markers", response_model=ResponseEnvelope[List[ComplaintResponse]])
async def get_map_markers(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    repo = ComplaintRepository(db)
    user_roles = [r.name for r in current_user.roles] if current_user else []

    # Super Admin and Gov Officers can see all markers; Citizens only see Verified markers
    if any(r in user_roles for r in ["Super Admin", "Department Admin", "Government Officer"]):
        complaints = await repo.get_all_map_markers_superadmin()
    else:
        complaints = await repo.get_verified_map_markers()

    return ResponseEnvelope(
        success=True,
        message="GIS map markers retrieved successfully",
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


@router.post("/{complaint_id}/verify", response_model=ResponseEnvelope[ComplaintResponse])
async def verify_complaint(
    complaint_id: str,
    verify_in: ComplaintVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    service = ComplaintService(db)
    user_role = current_user.roles[0].name if current_user.roles else "Government Officer"
    complaint = await service.verify_complaint(complaint_id, verify_in, current_user.full_name, user_role)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ResponseEnvelope(
        success=True,
        message="Complaint successfully VERIFIED and published to live GIS maps & dashboards",
        data=ComplaintResponse.model_validate(complaint),
    )


@router.post("/{complaint_id}/reject", response_model=ResponseEnvelope[ComplaintResponse])
async def reject_complaint(
    complaint_id: str,
    reject_in: ComplaintRejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    service = ComplaintService(db)
    user_role = current_user.roles[0].name if current_user.roles else "Government Officer"
    complaint = await service.reject_complaint(complaint_id, reject_in, current_user.full_name, user_role)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ResponseEnvelope(
        success=True,
        message="Complaint marked as REJECTED",
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
    user_role = current_user.roles[0].name if current_user.roles else "Government Officer"
    complaint = await service.update_status(complaint_id, update_in, current_user.id, current_user.full_name, user_role)
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
    complaint = await service.add_feedback(complaint_id, feedback_in, current_user.id, current_user.full_name)
    if not complaint:
        raise HTTPException(status_code=400, detail="Unable to submit feedback for this complaint")

    return ResponseEnvelope(
        success=True,
        message="Citizen feedback submitted successfully",
        data=ComplaintResponse.model_validate(complaint),
    )
