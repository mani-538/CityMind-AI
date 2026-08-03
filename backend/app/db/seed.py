import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.user import User, Role
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory, ComplaintImage
from app.models.agent import AgentLog
from app.core.security import get_password_hash


async def seed_database():
    print("[+] Seeding Ashmora CityMind AI Database with Sample Demo Data...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Create Roles
        roles_data = [
            ("Citizen", "Public citizen account for reporting municipal incidents"),
            ("Government Officer", "Municipal officer for dispatch and resolution"),
            ("Department Admin", "Departmental head administrator"),
            ("Super Admin", "Central Smart City Operating System Super Administrator"),
        ]
        
        role_objs = {}
        for name, desc in roles_data:
            role = Role(name=name, description=desc)
            db.add(role)
            await db.flush()
            role_objs[name] = role

        # 2. Create Departments
        depts_data = [
            ("Fire & Emergency Rescue", "FIRE", "fire@ashmora.gov", "+1 (555) 911-01"),
            ("Traffic Management Bureau", "TRAFFIC", "traffic@ashmora.gov", "+1 (555) 911-02"),
            ("Public Works & Water", "WATER", "water@ashmora.gov", "+1 (555) 911-03"),
            ("Sanitation & Environment", "SANITATION", "sanitation@ashmora.gov", "+1 (555) 911-04"),
        ]

        dept_objs = {}
        for name, code, email, phone in depts_data:
            dept = Department(name=name, code=code, contact_email=email, contact_phone=phone)
            db.add(dept)
            await db.flush()
            dept_objs[code] = dept

        # 3. Create Sample Users
        hashed_pwd = get_password_hash("DemoPassword123!")

        citizen = User(
            email="citizen@ashmora.gov",
            hashed_password=hashed_pwd,
            full_name="Sarah Jenkins (Demo Citizen)",
            phone_number="+1 (555) 019-2834",
            is_active=True,
            is_verified=True,
        )
        citizen.roles.append(role_objs["Citizen"])
        db.add(citizen)

        officer = User(
            email="officer@ashmora.gov",
            hashed_password=hashed_pwd,
            full_name="Captain Alex Vance (Gov Command Officer)",
            phone_number="+1 (555) 019-8822",
            is_active=True,
            is_verified=True,
            department_id=dept_objs["FIRE"].id,
        )
        officer.roles.append(role_objs["Government Officer"])
        db.add(officer)

        dept_admin = User(
            email="admin@ashmora.gov",
            hashed_password=hashed_pwd,
            full_name="Director Elena Rostova (Dept Admin)",
            phone_number="+1 (555) 019-9944",
            is_active=True,
            is_verified=True,
            department_id=dept_objs["TRAFFIC"].id,
        )
        dept_admin.roles.append(role_objs["Department Admin"])
        db.add(dept_admin)

        super_admin = User(
            email="superadmin@ashmora.gov",
            hashed_password=hashed_pwd,
            full_name="CTO Marcus Ashmora (Super Admin)",
            phone_number="+1 (555) 019-0000",
            is_active=True,
            is_verified=True,
        )
        super_admin.roles.append(role_objs["Super Admin"])
        db.add(super_admin)

        await db.flush()

        # 4. Create Sample Incidents
        complaints_data = [
            {
                "title": "Industrial Warehouse Chemical Fire Hazard",
                "category": ComplaintCategory.FIRE_HAZARD.value,
                "description": "Heavy black toxic smoke rising from chemical storage tank B. Fire escalating quickly near residential zone.",
                "address": "100 Industrial Parkway, Ashmora",
                "latitude": 40.7306,
                "longitude": -73.9352,
                "priority": ComplaintPriority.CRITICAL.value,
                "status": ComplaintStatus.AI_VERIFIED.value,
                "ai_verified": True,
                "ai_confidence_score": 0.98,
                "ai_summary": "CRITICAL HAZARD DETECTED: Chemical storage tank fire. Immediate evacuation of 150m perimeter recommended.",
                "ai_recommended_action": "DISPATCH PROTOCOL ALPHA: Deploy Pumper Units 04 & 08. Initiate emergency traffic green corridor.",
                "citizen_id": citizen.id,
                "department_id": dept_objs["FIRE"].id,
                "image": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3",
            },
            {
                "title": "Severe Water Main Burst on 5th Avenue",
                "category": ComplaintCategory.WATER_LEAKAGE.value,
                "description": "Clean water flooding main street disrupting morning commute and traffic.",
                "address": "742 5th Avenue, Ashmora",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "priority": ComplaintPriority.HIGH.value,
                "status": ComplaintStatus.ASSIGNED.value,
                "ai_verified": True,
                "ai_confidence_score": 0.92,
                "ai_summary": "High volume main pressure loss. Traffic lane obstruction detected.",
                "ai_recommended_action": "Isolate section valve #402 and dispatch municipal repair crew.",
                "citizen_id": citizen.id,
                "department_id": dept_objs["WATER"].id,
                "image": "https://images.unsplash.com/photo-1584467735871-8e85353a8413",
            },
            {
                "title": "Multi-Vehicle Traffic Gridlock on Grand Expressway",
                "category": ComplaintCategory.TRAFFIC_CONGESTION.value,
                "description": "Stalled delivery truck causing 3-mile tailback across east lane.",
                "address": "Grand Expressway Exit 12",
                "latitude": 40.7215,
                "longitude": -73.9912,
                "priority": ComplaintPriority.MEDIUM.value,
                "status": ComplaintStatus.WORK_STARTED.value,
                "ai_verified": True,
                "ai_confidence_score": 0.89,
                "ai_summary": "Traffic velocity dropped to 4 mph. Secondary congestion building.",
                "ai_recommended_action": "Activate signal override plan B-12 and dispatch heavy towing unit.",
                "citizen_id": citizen.id,
                "department_id": dept_objs["TRAFFIC"].id,
                "image": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a",
            },
        ]

        for cdata in complaints_data:
            img_url = cdata.pop("image")
            complaint = Complaint(**cdata)
            db.add(complaint)
            await db.flush()

            img = ComplaintImage(complaint_id=complaint.id, image_url=img_url)
            db.add(img)

        # 5. Create Sample Agent Logs
        logs_data = [
            ("Head Agent (Orchestrator)", "ORCHESTRATE_WORKFLOW", "Evaluated priority for Incident #100. Triggered Fire & Traffic emergency protocols."),
            ("Complaint Agent", "ANALYZE_COMPLAINT", "Classification: Fire Hazard. Priority: Critical. Confidence: 0.98."),
            ("Fire Agent", "EVALUATE_FIRE_HAZARD", "DISPATCH PROTOCOL ALPHA: Deploy 2 Pumper Units. Establish 150m perimeter."),
            ("Traffic Agent", "OPTIMIZE_CORRIDOR", "GREEN CORRIDOR ACTIVATED: Override traffic light signals along Grand Arterial."),
            ("Citizen Agent", "GENERATE_NOTIFICATION", "Sent push update to citizen Sarah Jenkins."),
        ]

        for name, action, output in logs_data:
            log = AgentLog(
                agent_name=name,
                action=action,
                output_data=output,
                execution_time_ms=14.2,
                status="SUCCESS",
            )
            db.add(log)

        await db.commit()
        print("[SUCCESS] Ashmora CityMind AI Database Seeded Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
