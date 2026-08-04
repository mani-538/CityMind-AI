import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_multi_agent_workflow(client: AsyncClient):
    # 1. Login Super Admin
    login_res = await client.post("/api/v1/auth/login", json={"email": "superadmin@ashmora.gov", "password": "DemoPassword123!"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit Critical Fire Emergency Complaint
    complaint_payload = {
        "title": "Industrial Warehouse Chemical Fire Hazard",
        "category": "Fire Hazard",
        "description": "Heavy black toxic smoke rising from chemical storage tank B. Fire escalating quickly.",
        "address": "100 Industrial Parkway, Ashmora",
        "latitude": 40.7306,
        "longitude": -73.9352
    }
    comp_res = await client.post("/api/v1/complaints/", json=complaint_payload, headers=headers)
    assert comp_res.status_code == 201
    complaint_id = comp_res.json()["data"]["id"]

    # 3. Trigger Agent Workflow manually
    agent_res = await client.post(f"/api/v1/agents/trigger/{complaint_id}", headers=headers)
    assert agent_res.status_code == 200
    data = agent_res.json()["data"]
    assert data["status"] in ["AI Verified", "Verified", "Submitted"]
    assert data["priority"] == "Critical"
    assert data["emergency_details"] is not None

    # 4. Verify Agent Logs
    logs_res = await client.get("/api/v1/agents/logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()["data"]
    assert len(logs) >= 1
