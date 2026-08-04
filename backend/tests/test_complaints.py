import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complaint_submission_and_map_markers(client: AsyncClient):
    # 1. Register & Login Citizen
    reg_payload = {
        "email": "citizen2@ashmora.gov",
        "password": "Password123!",
        "full_name": "Jane Citizen",
        "role_name": "Citizen"
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    
    login_res = await client.post("/api/v1/auth/login", json={"email": "citizen2@ashmora.gov", "password": "Password123!"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit Complaint
    complaint_payload = {
        "title": "Severe Water Main Burst on 5th Avenue",
        "category": "Water Leakage",
        "description": "Clean water flooding street disrupting morning commute and traffic.",
        "address": "742 5th Avenue, Ashmora",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "image_urls": ["https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3"]
    }
    res = await client.post("/api/v1/complaints/", json=complaint_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["title"] == "Severe Water Main Burst on 5th Avenue"
    assert data["status"] in ["Submitted", "AI Verified"]

    # 3. Fetch Map Markers (Public/Authenticated spatial view)
    map_res = await client.get("/api/v1/complaints/map/markers")
    assert map_res.status_code == 200
    markers = map_res.json()["data"]
    assert len(markers) >= 1
    assert any(m["title"] == "Severe Water Main Burst on 5th Avenue" for m in markers)
