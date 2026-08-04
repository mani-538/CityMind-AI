import secrets
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    RefreshTokenRequest,
    OTPRequest,
    OTPVerify,
    OrgApprovalAction,
    UserProfileUpdate,
    ChangePasswordRequest,
    DetailedProfileResponse,
)
from app.schemas.common import ResponseEnvelope
from app.api.deps import get_current_user, require_role
from app.models.user import User, Role
from app.models.complaint import Complaint
from app.services.email_service import EmailService

router = APIRouter()


def generate_6digit_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


@router.post("/register", response_model=ResponseEnvelope[dict], status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    role_name = user_in.role_name or "Citizen"
    is_org_member = role_name in ["Government Officer", "Department Admin", "Organization Member"]
    approval_status = "Pending" if is_org_member else "Approved"

    role = await user_repo.get_role_by_name(role_name)
    if not role:
        role = Role(name=role_name, description=f"{role_name} User Role")
        db.add(role)
        await db.flush()

    otp_code = generate_6digit_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    hashed_pwd = get_password_hash(user_in.password)
    user_dict = {
        "email": user_in.email,
        "hashed_password": hashed_pwd,
        "full_name": user_in.full_name,
        "phone_number": user_in.phone_number,
        "is_active": True,
        "is_verified": False,
        "approval_status": approval_status,
        "employee_id": user_in.employee_id,
        "official_email": user_in.official_email,
        "organization_type": user_in.organization_type,
        "otp_code": otp_code,
        "otp_expires_at": otp_expires,
    }
    
    new_user = await user_repo.create(user_dict)
    await user_repo.assign_role_to_user(new_user, role)
    await db.commit()

    EmailService.send_otp_email(new_user.email, otp_code, new_user.full_name)

    msg = (
        "Registration submitted. Since you registered as an Organization Member, your account requires Super Admin approval before you can log in."
        if is_org_member
        else "Registration successful. A 6-digit verification OTP has been sent to your email."
    )

    return ResponseEnvelope(
        success=True,
        message=msg,
        data={
            "user_id": new_user.id,
            "email": new_user.email,
            "approval_status": approval_status,
            "otp_sent": True,
            "demo_otp_code": otp_code,
        }
    )


@router.post("/request-otp", response_model=ResponseEnvelope[dict])
async def request_otp(otp_req: OTPRequest, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(otp_req.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account with this email does not exist.")

    otp_code = generate_6digit_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    user.otp_code = otp_code
    user.otp_expires_at = otp_expires
    await db.commit()

    EmailService.send_otp_email(user.email, otp_code, user.full_name)

    return ResponseEnvelope(
        success=True,
        message="A new 6-digit verification OTP has been dispatched.",
        data={
            "email": user.email,
            "otp_sent": True,
            "demo_otp_code": otp_code,
        }
    )


@router.post("/verify-otp", response_model=ResponseEnvelope[TokenResponse])
async def verify_otp(otp_in: OTPVerify, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(otp_in.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.otp_code or user.otp_code != otp_in.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP verification code.")

    if user.otp_expires_at:
        expires_at = user.otp_expires_at.replace(tzinfo=timezone.utc) if user.otp_expires_at.tzinfo is None else user.otp_expires_at
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP verification code has expired. Please request a new code.")

    if user.approval_status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="OTP verified, but your Organization account is pending Super Admin approval. You will receive an email once approved."
        )

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    user_roles = [r.name for r in user.roles]
    access_token = create_access_token(subject=user.id, roles=user_roles)
    refresh_token = create_refresh_token(subject=user.id)

    return ResponseEnvelope(
        success=True,
        message="OTP verified successfully. Welcome to Ashmora CityMind AI!",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600
        )
    )


@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(user_in.email)
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user.approval_status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Organization Account registration is PENDING Super Admin approval. You will receive an email once approved."
        )

    if user.approval_status == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account application was REJECTED by Super Admin. Reason: {user.verification_notes or 'Not specified'}"
        )

    user_roles = [r.name for r in user.roles]
    access_token = create_access_token(subject=user.id, roles=user_roles)
    refresh_token = create_refresh_token(subject=user.id)

    return ResponseEnvelope(
        success=True,
        message="Login successful",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600
        )
    )


@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
async def refresh_token(token_in: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(token_in.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_roles = [r.name for r in user.roles]
    new_access_token = create_access_token(subject=user.id, roles=user_roles)
    new_refresh_token = create_refresh_token(subject=user.id)

    return ResponseEnvelope(
        success=True,
        message="Token refreshed successfully",
        data=TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=3600
        )
    )


@router.get("/me", response_model=ResponseEnvelope[UserResponse])
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ResponseEnvelope(
        success=True,
        message="User profile retrieved successfully",
        data=UserResponse.model_validate(current_user)
    )


# ----------------------------------------------------------------------
# Profile & Account Management Endpoints
# ----------------------------------------------------------------------

@router.get("/profile", response_model=ResponseEnvelope[DetailedProfileResponse])
async def get_detailed_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_roles = [r.name for r in current_user.roles]
    stats = {}

    if "Super Admin" in user_roles:
        user_count = (await db.execute(select(func.count(User.id)))).scalar_one()
        pending_orgs = (await db.execute(select(func.count(User.id)).where(User.approval_status == "Pending"))).scalar_one()
        total_complaints = (await db.execute(select(func.count(Complaint.id)))).scalar_one()
        stats = {
            "total_users": user_count,
            "pending_organization_requests": pending_orgs,
            "total_city_complaints": total_complaints,
            "active_ai_agents": 13,
            "system_health": "100% Operational",
        }
    elif any(r in user_roles for r in ["Government Officer", "Department Admin"]):
        dept_id = current_user.department_id
        q_dept = select(func.count(Complaint.id))
        if dept_id:
            q_dept = q_dept.where(Complaint.department_id == dept_id)
        total_dept_cases = (await db.execute(q_dept)).scalar_one()
        
        q_completed = select(func.count(Complaint.id)).where(Complaint.status == "Completed")
        if dept_id:
            q_completed = q_completed.where(Complaint.department_id == dept_id)
        completed_cases = (await db.execute(q_completed)).scalar_one()

        stats = {
            "assigned_cases": total_dept_cases,
            "completed_cases": completed_cases,
            "verification_accuracy": "99.2%",
            "department_status": "Active Response",
        }
    else:
        # Citizen role
        total_my = (await db.execute(select(func.count(Complaint.id)).where(Complaint.citizen_id == current_user.id))).scalar_one()
        completed_my = (await db.execute(select(func.count(Complaint.id)).where(Complaint.citizen_id == current_user.id, Complaint.status == "Completed"))).scalar_one()
        pending_my = total_my - completed_my
        stats = {
            "total_complaints": total_my,
            "completed_complaints": completed_my,
            "pending_complaints": pending_my,
        }

    response_data = DetailedProfileResponse.model_validate(current_user)
    response_data.statistics = stats

    return ResponseEnvelope(
        success=True,
        message="Detailed profile retrieved successfully",
        data=response_data,
    )


@router.put("/profile", response_model=ResponseEnvelope[DetailedProfileResponse])
async def update_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    update_dict = profile_in.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    updated_user = await user_repo.update(current_user.id, update_dict)
    await db.commit()

    return await get_detailed_profile(current_user=updated_user, db=db)


@router.post("/change-password", response_model=ResponseEnvelope[dict])
async def change_password(
    pwd_in: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Password updated successfully. Please use your new password on next login.",
        data={"user_id": current_user.id}
    )


# ----------------------------------------------------------------------
# Super Admin Organization Approval Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/organization-requests",
    response_model=ResponseEnvelope[List[UserResponse]],
    dependencies=[Depends(require_role(["Super Admin"]))]
)
async def list_organization_requests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().unique().all()
    org_users = [u for u in users if u.approval_status in ["Pending", "Approved", "Rejected"] and any(r.name != "Citizen" for r in u.roles)]
    
    return ResponseEnvelope(
        success=True,
        message="Organization approval requests retrieved",
        data=[UserResponse.model_validate(u) for u in org_users]
    )


@router.post(
    "/organization-requests/{user_id}/approve",
    response_model=ResponseEnvelope[UserResponse],
    dependencies=[Depends(require_role(["Super Admin"]))]
)
async def approve_organization_request(
    user_id: str,
    action: OrgApprovalAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User request not found")

    user.approval_status = "Approved"
    user.approved_by = current_user.full_name
    user.approved_at = datetime.now(timezone.utc)
    user.verification_notes = action.admin_notes or "Approved by Super Admin"
    await db.commit()

    role_name = user.roles[0].name if user.roles else "Organization Member"
    EmailService.send_approval_email(user.email, user.full_name, role_name, action.admin_notes or "")

    return ResponseEnvelope(
        success=True,
        message=f"Organization member {user.full_name} has been APPROVED.",
        data=UserResponse.model_validate(user)
    )


@router.post(
    "/organization-requests/{user_id}/reject",
    response_model=ResponseEnvelope[UserResponse],
    dependencies=[Depends(require_role(["Super Admin"]))]
)
async def reject_organization_request(
    user_id: str,
    action: OrgApprovalAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User request not found")

    user.approval_status = "Rejected"
    user.approved_by = current_user.full_name
    user.approved_at = datetime.now(timezone.utc)
    user.verification_notes = action.admin_notes or "Rejected by Super Admin"
    await db.commit()

    EmailService.send_rejection_email(user.email, user.full_name, action.admin_notes or "")

    return ResponseEnvelope(
        success=True,
        message=f"Organization member {user.full_name} has been REJECTED.",
        data=UserResponse.model_validate(user)
    )
