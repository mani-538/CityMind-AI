from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class ComplaintImageSchema(BaseModel):
    id: str
    image_url: str
    caption: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ComplaintTimelineSchema(BaseModel):
    id: str
    stage: str
    title: str
    description: Optional[str] = None
    actor_role: Optional[str] = None
    actor_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    category: str = Field(..., description="Category of complaint (e.g. Fire Hazard, Traffic Congestion, Road Damage)")
    description: str = Field(..., min_length=10)
    address: str
    latitude: float
    longitude: float
    image_urls: Optional[List[str]] = []


class ComplaintVerifyRequest(BaseModel):
    verification_method: str = Field(..., description="Phone Call, Email, Manual Site Verification, Internal Confirmation")
    notes: Optional[str] = None


class ComplaintRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5, description="Reason for rejecting complaint")


class ComplaintUpdateStatus(BaseModel):
    status: str = Field(..., description="Submitted, AI Verified, Verified, Assigned, Work Started, Completed, Closed, Rejected")
    notes: Optional[str] = None
    assigned_officer_id: Optional[str] = None


class CitizenFeedback(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    status: str
    verification_status: str = "Pending_Verification"
    priority: str
    address: str
    latitude: float
    longitude: float

    # Verification Metadata
    verified_by: Optional[str] = None
    verification_method: Optional[str] = None
    verification_time: Optional[datetime] = None
    verification_notes: Optional[str] = None

    # AI Fields
    ai_verified: bool
    ai_confidence_score: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_recommended_action: Optional[str] = None
    is_duplicate: bool
    duplicate_of_id: Optional[str] = None

    # Citizen & Dept info
    citizen_id: str
    department_id: Optional[str] = None
    citizen_rating: Optional[int] = None
    citizen_feedback_text: Optional[str] = None

    images: Optional[List[ComplaintImageSchema]] = []
    timeline_events: Optional[List[ComplaintTimelineSchema]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
