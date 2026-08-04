from typing import Optional, List, Dict, Any
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
    approval_status: str = "Approved"
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


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = None
    designation: Optional[str] = None
    department_address: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class DetailedProfileResponse(BaseModel):
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
    designation: Optional[str] = None
    department_address: Optional[str] = None

    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    aadhaar_masked: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = None

    roles: List[RoleSchema] = []
    department_id: Optional[str] = None
    created_at: datetime

    # Role-specific live statistics
    statistics: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)
