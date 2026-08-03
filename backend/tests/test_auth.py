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
async def test_user_registration_and_login(client: AsyncClient):
    # 1. Register User
    reg_payload = {
        "email": "citizen@ashmora.gov",
        "password": "SecurePassword123!",
        "full_name": "John Ashmora Citizen",
        "role_name": "Citizen"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert reg_data["data"]["email"] == "citizen@ashmora.gov"

    # 2. Login User
    login_payload = {
        "email": "citizen@ashmora.gov",
        "password": "SecurePassword123!"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]

    token = login_data["data"]["access_token"]

    # 3. Get Current User Profile
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["data"]["full_name"] == "John Ashmora Citizen"
