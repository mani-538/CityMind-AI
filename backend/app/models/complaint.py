from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Text, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin


class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    AI_VERIFIED = "AI Verified"
    VERIFIED = "Verified"
    ASSIGNED = "Assigned"
    WORK_STARTED = "Work Started"
    COMPLETED = "Completed"
    CLOSED = "Closed"
    REJECTED = "Rejected"


class VerificationStatus(str, enum.Enum):
    PENDING_VERIFICATION = "Pending_Verification"
    VERIFIED = "Verified"
    REJECTED = "Rejected"


class ComplaintPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class ComplaintCategory(str, enum.Enum):
    FIRE_HAZARD = "Fire Hazard"
    TRAFFIC_CONGESTION = "Traffic Congestion"
    ROAD_DAMAGE = "Road Damage"
    WATER_LEAKAGE = "Water Leakage"
    GARBAGE_ACCUMULATION = "Garbage Accumulation"
    STREET_LIGHTING = "Street Lighting"
    PUBLIC_SAFETY = "Public Safety"
    OTHER = "Other"


class Complaint(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "complaints"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default=ComplaintCategory.OTHER.value)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Lifecycle status & Verification Workflow
    status: Mapped[str] = mapped_column(String(30), default=ComplaintStatus.SUBMITTED.value, nullable=False, index=True)
    verification_status: Mapped[str] = mapped_column(String(30), default=VerificationStatus.PENDING_VERIFICATION.value, nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), default=ComplaintPriority.MEDIUM.value, nullable=False, index=True)

    # Department Verification Audit Fields
    verified_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verification_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Phone Call, Email, Manual Site Verification, Internal Confirmation
    verification_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Location spatial attributes
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # AI Verification Metadata
    ai_verified: Mapped[bool] = mapped_column(default=False)
    ai_confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(default=False)
    duplicate_of_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Citizen Feedback
    citizen_rating: Mapped[Optional[int]] = mapped_column(nullable=True)
    citizen_feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Foreign Keys
    citizen_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    citizen: Mapped["User"] = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="complaints")
    images: Mapped[List["ComplaintImage"]] = relationship("ComplaintImage", back_populates="complaint", cascade="all, delete-orphan")
    assignments: Mapped[List["ComplaintAssignment"]] = relationship("ComplaintAssignment", back_populates="complaint", cascade="all, delete-orphan")
    timeline_events: Mapped[List["ComplaintTimeline"]] = relationship("ComplaintTimeline", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintTimeline.created_at")


class ComplaintImage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_images"

    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    complaint: Mapped[Complaint] = relationship("Complaint", back_populates="images")


class ComplaintAssignment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_assignments"

    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    assigned_officer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")

    complaint: Mapped[Complaint] = relationship("Complaint", back_populates="assignments")
    assigned_officer: Mapped["User"] = relationship(
        "User", back_populates="assigned_complaints", foreign_keys=[assigned_officer_id]
    )


class ComplaintTimeline(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_timelines"

    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    actor_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    complaint: Mapped[Complaint] = relationship("Complaint", back_populates="timeline_events")
