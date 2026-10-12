import pytest
from httpx import AsyncClient


@pytest.fixture(autouse=True)
def captured_otp_emails(monkeypatch):
    sent = {}

    def capture(to_email, otp_code, recipient_name):
        sent[to_email] = otp_code
        return True

    monkeypatch.setattr("app.api.v1.endpoints.auth.EmailService.send_otp_email", capture)
    return sent


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
