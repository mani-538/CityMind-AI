from typing import List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db

from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def ensure_account_eligible(user: User) -> None:
    """Reject accounts that are not allowed to receive or use credentials."""
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email address is not verified")
    if user.approval_status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Organization Account registration is PENDING Super Admin approval.",
        )
    if user.approval_status == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account application was REJECTED by Super Admin.",
        )
    if user.approval_status != "Approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not approved")


async def get_optional_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not user_id or token_type != "access":
            return None
        
    except Exception:
        return None

    stmt = select(User).options(selectinload(User.roles)).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user is None:
        return None
    ensure_account_eligible(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    stmt = select(User).options(selectinload(User.roles)).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user is None:
        raise credentials_exception
    ensure_account_eligible(user)

    return user


def require_roles(allowed_roles: List[str]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [r.name for r in current_user.roles]
        if "Super Admin" in user_role_names:
            return current_user

        has_role = any(role in user_role_names for role in allowed_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have required permissions. Required roles: {allowed_roles}"
            )
        return current_user

    return role_checker


require_role = require_roles
