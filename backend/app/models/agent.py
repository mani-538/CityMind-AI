from typing import Optional
from sqlalchemy import String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin


class AgentLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "agent_logs"

    agent_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # Head, Complaint, Fire, Traffic, Citizen, Analytics
    target_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)  # complaint_id or event_id
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    input_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    execution_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="SUCCESS")  # SUCCESS, FAILED, IN_PROGRESS
