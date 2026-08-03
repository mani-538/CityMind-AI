from typing import Optional
from sqlalchemy import String, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin


class EmergencyEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "emergency_events"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # FIRE, FLOOD, ACCIDENT, HAZMAT, INFRASTRUCTURE_FAILURE
    severity: Mapped[str] = mapped_column(String(20), default="HIGH")  # MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")  # ACTIVE, CONTAINED, RESOLVED

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)

    description: Mapped[Text] = mapped_column(Text, nullable=False)
    recommended_corridor: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    affected_units: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    complaint_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
