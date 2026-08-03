import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_assistant(client: AsyncClient):
    # Register & Login User
    reg_payload = {
        "email": "chat_user@ashmora.gov",
        "password": "Password123!",
        "full_name": "Chat User",
        "role_name": "Citizen"
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    login_res = await client.post("/api/v1/auth/login", json={"email": "chat_user@ashmora.gov", "password": "Password123!"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Send Chat Message
    chat_payload = {
        "message": "Where is the nearest emergency hospital in Ashmora?",
        "session_id": "test_session_001"
    }
    res = await client.post("/api/v1/chat/message", json=chat_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["role"] == "model"
    assert "Hospital" in data["content"] or "Hospital" in data["content"]

    # Retrieve History
    hist_res = await client.get("/api/v1/chat/history/test_session_001", headers=headers)
    assert hist_res.status_code == 200
    items = hist_res.json()["data"]
    assert len(items) == 2  # 1 User msg + 1 AI msg
