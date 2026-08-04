from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


class RoleSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = None
    role_name: Optional[str] = "Citizen"  # Citizen, Government Officer, Department Admin, Super Admin
    employee_id: Optional[str] = None
    official_email: Optional[str] = None
    organization_type: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class OrgApprovalAction(BaseModel):
    admin_notes: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool
    is_verified: bool
    approval_status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    employee_id: Optional[str] = None
    official_email: Optional[str] = None
    organization_type: Optional[str] = None
    verification_notes: Optional[str] = None
    roles: List[RoleSchema] = []
    department_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    department_id: Optional[str] = None
