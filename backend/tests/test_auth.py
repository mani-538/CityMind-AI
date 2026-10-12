import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.main import app
from app.models.user import User


async def update_account(email: str, **updates):
    session_generator = app.dependency_overrides[get_db]()
    try:
        session = await anext(session_generator)
        user = await session.scalar(select(User).where(User.email == email))
        assert user is not None
        for field, value in updates.items():
            setattr(user, field, value)
        await session.commit()
        return user.id
    finally:
        await session_generator.aclose()


async def read_account(email: str):
    session_generator = app.dependency_overrides[get_db]()
    try:
        session = await anext(session_generator)
        return await session.scalar(select(User).where(User.email == email))
    finally:
        await session_generator.aclose()


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "online"


@pytest.mark.asyncio
async def test_user_registration_and_otp_verification(client: AsyncClient, captured_otp_emails):
    # 1. Register User & Receive OTP
    reg_payload = {
        "email": "otp_citizen@ashmora.gov",
        "password": "SecurePassword123!",
        "full_name": "John Ashmora Citizen",
        "role_name": "Citizen"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert "demo_otp_code" not in reg_data["data"]
    assert reg_data["data"]["otp_sent"] is True

    otp_code = captured_otp_emails[reg_payload["email"]]

    # 2. Verify OTP
    verify_res = await client.post("/api/v1/auth/verify-otp", json={
        "email": "otp_citizen@ashmora.gov",
        "otp_code": otp_code
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["success"] is True
    assert "access_token" in verify_data["data"]

    token = verify_data["data"]["access_token"]

    # 3. Get Current User Profile
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["data"]["full_name"] == "John Ashmora Citizen"
    assert me_data["data"]["is_verified"] is True


@pytest.mark.asyncio
@pytest.mark.parametrize("role_name", ["Super Admin", " Super Admin ", "Unknown Role", "citizen"])
async def test_registration_rejects_disallowed_roles(client: AsyncClient, role_name):
    from sqlalchemy import select
    from app.main import app
    from app.db.session import get_db
    from app.models.user import User, Role

    payload = {
        "email": "blocked-role@example.com",
        "password": "SecurePassword123!",
        "full_name": "Role Security Test",
        "role_name": role_name,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "This role is not available for public registration."

    # A failed registration must not persist an account or invent a role.
    async for session in app.dependency_overrides[get_db]():
        user = await session.scalar(select(User).where(User.email == payload["email"]))
        assert user is None
        if role_name.strip() in {"Unknown Role", "citizen"}:
            role = await session.scalar(select(Role).where(Role.name == role_name.strip()))
            assert role is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        ("Citizen", "Approved"),
        (" Citizen ", "Approved"),
        ("Government Officer", "Pending"),
        ("Department Admin", "Pending"),
        ("Organization Member", "Pending"),
    ],
)
async def test_registration_preserves_allowed_role_policy(
    client: AsyncClient, role_name, expected_status
):
    response = await client.post("/api/v1/auth/register", json={
        "email": "allowed-role@example.com",
        "password": "SecurePassword123!",
        "full_name": "Allowed Role Test",
        "role_name": role_name,
    })
    assert response.status_code == 201
    assert response.json()["data"]["approval_status"] == expected_status

    if expected_status == "Pending":
        login = await client.post("/api/v1/auth/login", json={
            "email": "allowed-role@example.com",
            "password": "SecurePassword123!",
        })
        assert login.status_code == 403


@pytest.mark.asyncio
async def test_registration_defaults_to_citizen(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "default-role@example.com",
        "password": "SecurePassword123!",
        "full_name": "Default Role Test",
    })
    assert response.status_code == 201
    assert response.json()["data"]["approval_status"] == "Approved"


@pytest.mark.asyncio
async def test_resend_does_not_expose_otp(client: AsyncClient, captured_otp_emails):
    email = "resend-security@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": email, "password": "SecurePassword123!", "full_name": "Resend Test",
    })
    response = await client.post("/api/v1/auth/request-otp", json={"email": email})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["otp_sent"] is True
    assert "demo_otp_code" not in data["data"]
    assert captured_otp_emails[email] not in response.text
    verified = await client.post("/api/v1/auth/verify-otp", json={
        "email": email, "otp_code": captured_otp_emails[email],
    })
    assert verified.status_code == 200


@pytest.mark.asyncio
async def test_email_failure_is_reported(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(
        "app.api.v1.endpoints.auth.EmailService.send_otp_email",
        lambda *args, **kwargs: False,
    )
    email = "email-failure@example.com"
    response = await client.post("/api/v1/auth/register", json={
        "email": email, "password": "SecurePassword123!", "full_name": "Delivery Test",
    })
    assert response.status_code == 201
    assert response.json()["data"]["otp_sent"] is False
    assert "demo_otp_code" not in response.json()["data"]
    resend = await client.post("/api/v1/auth/request-otp", json={"email": email})
    assert resend.status_code == 200
    assert resend.json()["success"] is False
    assert resend.json()["data"]["otp_sent"] is False
    assert "demo_otp_code" not in resend.json()["data"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "updates",
    [
        {"is_active": False},
        {"is_verified": False},
        {"approval_status": "Pending"},
        {"approval_status": "Rejected"},
    ],
)
async def test_login_rejects_ineligible_accounts(client: AsyncClient, updates):
    email = "citizen@ashmora.gov"
    await update_account(email, **updates)

    response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "DemoPassword123!",
    })

    assert response.status_code == 403
    assert "access_token" not in response.text
    assert "refresh_token" not in response.text


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "updates",
    [
        {"is_active": False},
        {"is_verified": False},
        {"approval_status": "Pending"},
        {"approval_status": "Rejected"},
    ],
)
async def test_existing_tokens_cannot_bypass_account_eligibility(client: AsyncClient, updates):
    email = "citizen@ashmora.gov"
    user = await read_account(email)
    access_token = create_access_token(user.id, ["Citizen"])
    refresh_token = create_refresh_token(user.id)
    await update_account(email, **updates)

    protected = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    optional_auth = await client.get(
        "/api/v1/complaints/map/markers",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    refreshed = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })

    assert protected.status_code == 403
    assert optional_auth.status_code == 403
    assert refreshed.status_code == 403
    assert "access_token" not in refreshed.text
    assert "refresh_token" not in refreshed.text


@pytest.mark.asyncio
async def test_pending_organization_otp_verifies_email_without_tokens(
    client: AsyncClient, captured_otp_emails
):
    email = "pending-verified@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Pending Verified Officer",
        "role_name": "Government Officer",
    })

    response = await client.post("/api/v1/auth/verify-otp", json={
        "email": email,
        "otp_code": captured_otp_emails[email],
    })

    assert response.status_code == 403
    assert "access_token" not in response.text
    assert "refresh_token" not in response.text
    user = await read_account(email)
    assert user.is_verified is True
    assert user.otp_code is None
    assert user.otp_expires_at is None

    pending_login = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "SecurePassword123!",
    })
    assert pending_login.status_code == 403

    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "superadmin@ashmora.gov",
        "password": "DemoPassword123!",
    })
    approval = await client.post(
        f"/api/v1/auth/organization-requests/{user.id}/approve",
        json={"admin_notes": "Identity confirmed"},
        headers={"Authorization": f"Bearer {admin_login.json()['data']['access_token']}"},
    )
    assert approval.status_code == 200

    approved_login = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "SecurePassword123!",
    })
    assert approved_login.status_code == 200
    assert "access_token" in approved_login.json()["data"]


@pytest.mark.asyncio
async def test_approval_before_email_verification_still_requires_otp(
    client: AsyncClient, captured_otp_emails
):
    email = "approved-unverified@example.com"
    registration = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Approved Before OTP",
        "role_name": "Department Admin",
    })
    user_id = registration.json()["data"]["user_id"]
    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "superadmin@ashmora.gov",
        "password": "DemoPassword123!",
    })
    approval = await client.post(
        f"/api/v1/auth/organization-requests/{user_id}/approve",
        json={},
        headers={"Authorization": f"Bearer {admin_login.json()['data']['access_token']}"},
    )
    assert approval.status_code == 200

    login = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "SecurePassword123!",
    })
    assert login.status_code == 403

    verified = await client.post("/api/v1/auth/verify-otp", json={
        "email": email,
        "otp_code": captured_otp_emails[email],
    })
    assert verified.status_code == 200
    assert "access_token" in verified.json()["data"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "updates",
    [
        {"is_active": False},
        {"approval_status": "Rejected"},
    ],
)
async def test_otp_never_issues_tokens_to_inactive_or_rejected_accounts(
    client: AsyncClient, captured_otp_emails, updates
):
    email = "blocked-otp@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Blocked OTP User",
    })
    await update_account(email, **updates)

    response = await client.post("/api/v1/auth/verify-otp", json={
        "email": email,
        "otp_code": captured_otp_emails[email],
    })

    assert response.status_code == 403
    assert "access_token" not in response.text
    assert "refresh_token" not in response.text
    assert (await read_account(email)).is_verified is False
