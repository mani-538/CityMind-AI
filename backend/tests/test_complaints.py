import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complaint_submission_and_verification_workflow(client: AsyncClient):
    # 1. Register Citizen & Submit Complaint
    reg_payload = {
        "email": "citizen_workflow@ashmora.gov",
        "password": "Password123!",
        "full_name": "Jane Citizen",
        "role_name": "Citizen"
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    
    login_res = await client.post("/api/v1/auth/login", json={"email": "citizen_workflow@ashmora.gov", "password": "Password123!"})
    citizen_token = login_res.json()["data"]["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    complaint_payload = {
        "title": "Severe Water Main Burst on 5th Avenue",
        "category": "Water Leakage",
        "description": "Clean water flooding street disrupting morning commute and traffic.",
        "address": "742 5th Avenue, Ashmora",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "image_urls": ["https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3"]
    }
    res = await client.post("/api/v1/complaints/", json=complaint_payload, headers=citizen_headers)
    assert res.status_code == 201
    data = res.json()["data"]
    complaint_id = data["id"]
    assert data["title"] == "Severe Water Main Burst on 5th Avenue"
    assert data["verification_status"] == "Pending_Verification"

    # 2. Login with Pre-Seeded Approved Super Admin
    admin_login = await client.post("/api/v1/auth/login", json={"email": "superadmin@ashmora.gov", "password": "DemoPassword123!"})
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Department Officer Verifies Complaint
    verify_res = await client.post(
        f"/api/v1/complaints/{complaint_id}/verify",
        json={"verification_method": "Phone Call Verification", "notes": "Confirmed with water utility precinct"},
        headers=admin_headers
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()["data"]
    assert v_data["verification_status"] == "Verified"

    # 4. Fetch Public Map Markers (Now verified complaint appears)
    map_res = await client.get("/api/v1/complaints/map/markers", headers=admin_headers)
    assert map_res.status_code == 200
    markers = map_res.json()["data"]
    assert len(markers) >= 1
    assert any(m["title"] == "Severe Water Main Burst on 5th Avenue" for m in markers)
