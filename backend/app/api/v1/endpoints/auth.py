import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse, RefreshTokenRequest, OTPRequest, OTPVerify
from app.schemas.common import ResponseEnvelope
from app.api.deps import get_current_user
from app.models.user import User, Role
from app.services.email_service import EmailService

router = APIRouter()


def generate_6digit_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


@router.post("/register", response_model=ResponseEnvelope[dict], status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    
    # Check if user email already exists
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Get requested role or default to 'Citizen'
    role_name = user_in.role_name or "Citizen"
    role = await user_repo.get_role_by_name(role_name)
    if not role:
        role = Role(name=role_name, description=f"{role_name} User Role")
        db.add(role)
        await db.flush()

    # Generate OTP Code
    otp_code = generate_6digit_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Create new user
    hashed_pwd = get_password_hash(user_in.password)
    user_dict = {
        "email": user_in.email,
        "hashed_password": hashed_pwd,
        "full_name": user_in.full_name,
        "phone_number": user_in.phone_number,
        "is_active": True,
        "is_verified": False,
        "otp_code": otp_code,
        "otp_expires_at": otp_expires,
    }
    
    new_user = await user_repo.create(user_dict)
    await user_repo.assign_role_to_user(new_user, role)
    await db.commit()

    # Send OTP Email
    EmailService.send_otp_email(new_user.email, otp_code, new_user.full_name)

    return ResponseEnvelope(
        success=True,
        message="Registration successful. A 6-digit verification OTP has been sent to your email.",
        data={
            "user_id": new_user.id,
            "email": new_user.email,
            "otp_sent": True,
            "demo_otp_code": otp_code,  # Provided for easy local/demo verification
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

    # Check expiration
    if user.otp_expires_at:
        expires_at = user.otp_expires_at.replace(tzinfo=timezone.utc) if user.otp_expires_at.tzinfo is None else user.otp_expires_at
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP verification code has expired. Please request a new code.")

    # Mark user as verified & clear OTP
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
