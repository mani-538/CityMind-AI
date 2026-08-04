from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, Table, Column, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

# Association Table for User-Role Many-to-Many
user_roles_table = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    users: Mapped[List["User"]] = relationship(
        "User", secondary=user_roles_table, back_populates="roles"
    )


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Organization Member Approval Status
    approval_status: Mapped[str] = mapped_column(String(30), default="Approved", nullable=False, index=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    official_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    organization_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verification_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Citizen & Officer Profile Extensions
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="Ashmora")
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="Metropolis")
    pincode: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    aadhaar_masked: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, default="English")
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # OTP Verification Fields
    otp_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    otp_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    roles: Mapped[List[Role]] = relationship(
        "Role", secondary=user_roles_table, back_populates="users", lazy="joined"
    )
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="officers")
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id"
    )
    assigned_complaints: Mapped[List["ComplaintAssignment"]] = relationship(
        "ComplaintAssignment", back_populates="assigned_officer", foreign_keys="ComplaintAssignment.assigned_officer_id"
    )
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
