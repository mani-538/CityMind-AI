import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "online"


@pytest.mark.asyncio
async def test_user_registration_and_otp_verification(client: AsyncClient):
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
    assert "demo_otp_code" in reg_data["data"]

    otp_code = reg_data["data"]["demo_otp_code"]

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
