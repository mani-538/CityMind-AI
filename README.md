# Ashmora CityMind AI — Smart City Operating System

> **Brand Message**: Building the Intelligence Behind Tomorrow.  
> **Product Tagline**: One City. One Intelligence. Infinite Possibilities.

CityMind AI is an Agentic AI Smart City Operating System built by **Ashmora**. Unlike traditional passive monitoring software, CityMind AI connects citizens, municipal departments, and autonomous AI agents in real time to categorize incidents, assess hazards, coordinate emergency green corridors, and deliver spatial awareness.

---

## 🌐 Live Sharable Deployment Links

| Resource | Service / Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | 👉 **[https://city-mind-ai-three.vercel.app](https://city-mind-ai-three.vercel.app)** |
| **Backend REST API** | Render | 👉 **[https://citymind-ai-ul76.onrender.com](https://citymind-ai-ul76.onrender.com)** |
| **Interactive API Docs** | Render | 👉 **[https://citymind-ai-ul76.onrender.com/api/v1/docs](https://citymind-ai-ul76.onrender.com/api/v1/docs)** |
| **Source Code Repository** | GitHub | 👉 **[https://github.com/mani-538/CityMind-AI.git](https://github.com/mani-538/CityMind-AI.git)** |

---

## 🔑 Pre-Seeded Live Demo Accounts

All sample test accounts are pre-configured with auto-seeding. Default Password: **`DemoPassword123!`**

| Persona | Role | Sample Email | Default Password | Features & Access |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen Persona** | `Citizen` | `citizen@ashmora.gov` | `DemoPassword123!` | Incident reporting, interactive pin dropping, live timeline tracker, AI notifications |
| **Government Officer** | `Government Officer` | `officer@ashmora.gov` | `DemoPassword123!` | Command center telemetry stream, 1-click dispatch controls, live map, AI agent execution logs |
| **Department Admin** | `Department Admin` | `admin@ashmora.gov` | `DemoPassword123!` | Departmental analytics, resource allocation, and priority escalation |
| **Super Admin (CTO)** | `Super Admin` | `superadmin@ashmora.gov` | `DemoPassword123!` | Master system access, multi-agent configuration, full city audit logs |

> 💡 **1-Click Login**: When opening the [Login Page](https://city-mind-ai-three.vercel.app/login), click any persona in the **"Live Demo Quick Access"** box to auto-fill credentials instantly!

---

## 🌟 Key Architecture & Features

### 1. Multi-Agent Ecosystem (Gemini Powered)
- **Head Agent (Orchestrator)**: Coordinates specialized agents, delegating workflows, determining priority, and persisting execution trace logs to `AgentLog`.
- **Complaint Agent**: Classifies complaints, assesses severity, calculates priority (`Low`, `Medium`, `High`, `Critical`), and writes summary insights.
- **Fire Agent**: Assesses chemical/structural hazard levels, recommends unit deployment (`Pumper Units`, `Hazmat`), and establishes containment perimeters.
- **Traffic Agent**: Dynamically optimizes traffic light sequences for emergency vehicle green corridors and plans civilian detours.
- **Citizen Agent**: Crafts reassuring, personalized citizen status update notifications.
- **Analytics Agent**: Generates daily and weekly smart city briefings for municipal leadership.

### 2. Interactive GIS Leaflet Engine
- Spatial visualization of reported incidents using OpenStreetMap and Leaflet.
- Priority color-coded markers (Red=Critical, Orange=High, Blue=Medium, Green=Low).
- Dynamic pin location dropping during citizen complaint reporting.

### 3. Role-Based Security (RBAC) & Authentication
- JWT Access & Refresh Token architecture.
- Passlib secure password hashing.
- Four User Roles: `Citizen`, `Government Officer`, `Department Admin`, `Super Admin`.
- Public registration permits `Citizen`, `Government Officer`, `Department Admin`, and `Organization Member`; `Super Admin` cannot be self-assigned.
- Citizens must verify their email before receiving tokens. Organization applicants must verify their email first and then receive Super Admin approval before they can sign in.
- Existing access and refresh tokens stop working if an account becomes inactive, unverified, pending approval, or rejected.

### Email verification configuration

Registration requires a working Resend configuration. Set these backend environment variables (see `backend/.env.example`):

```env
EMAILS_ENABLED=true
RESEND_API_KEY=re_your_api_key
EMAILS_FROM_EMAIL=verified-sender@example.com
EMAILS_FROM_NAME=Ashmora CityMind AI
```

`EMAILS_FROM_EMAIL` must be a sender/domain verified in Resend. If delivery fails, the API reports `otp_sent: false`; the UI keeps the account in verification and offers a retry. OTP values are never returned by the API or written to application logs.

> Upgrade note: deployments created before email verification enforcement should audit accounts with `is_verified = false`. Such accounts cannot sign in or use existing tokens until they complete OTP verification. Do not update this flag directly in production.

### 4. Portals & UI
- **Citizen Portal**: Incident reporting with spatial location picker, AI verification badge, and status timeline tracking.
- **Government Command Center**: Live telemetry, real-time dispatch queue, manual dispatch controls, map overlays, and AI agent log streams.
- **Smart City AI Chatbot Drawer**: Floating Gemini-powered AI assistant for hospital lookups, status checks, and emergency guidance.
- **Executive Analytics Dashboard**: Priority distribution Doughnut charts, category Bar charts, and KPI telemetry.

---

## 🚀 Quick Setup & Local Development

### 1. Backend (FastAPI + SQLAlchemy)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run Pytest suite
pytest -v

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Swagger OpenAPI docs will be live at: `http://localhost:8000/api/v1/docs`

### 2. Frontend (Next.js 14 App Router)
```bash
cd frontend
npm install
npm run dev
```
Access the local application at: `http://localhost:3000`

---

## 🐳 Docker Deployment
```bash
docker-compose up --build -d
```

---

© 2026 Ashmora Technologies Inc. All rights reserved.
