# Ashmora CityMind AI — Smart City Operating System

> **Brand Message**: Building the Intelligence Behind Tomorrow.  
> **Product Tagline**: One City. One Intelligence. Infinite Possibilities.

CityMind AI is an Agentic AI Smart City Operating System built by **Ashmora**. Unlike traditional passive monitoring software, CityMind AI connects citizens, municipal departments, and autonomous AI agents in real time to categorize incidents, assess hazards, coordinate emergency green corridors, and deliver spatial awareness.

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

### 4. Portals & UI
- **Citizen Portal**: Incident reporting with spatial location picker, AI verification badge, and status timeline tracking.
- **Government Command Center**: Live telemetry, real-time dispatch queue, manual dispatch controls, map overlays, and AI agent log streams.
- **Smart City AI Chatbot Drawer**: Floating Gemini-powered AI assistant for hospital lookups, status checks, and emergency guidance.
- **Executive Analytics Dashboard**: Priority distribution Doughnut charts, category Bar charts, and KPI telemetry.

---

## 🚀 Quick Setup & Installation

### Option 1: Run Locally (Dev Mode)

#### 1. Backend (FastAPI + SQLAlchemy)
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

#### 2. Frontend (Next.js 14 App Router)
```bash
cd frontend
npm install
npm run dev
```
Access the application at: `http://localhost:3000`

---

### Option 2: Run with Docker Compose
```bash
docker-compose up --build
```

---

## 📚 Technical Documentation

- **[Walkthrough Summary](file:///C:/Users/DELL/.gemini/antigravity-ide/brain/8eb95c51-34d9-47e9-8f20-f14b04dca5bb/walkthrough.md)**
- **[Implementation Plan](file:///C:/Users/DELL/.gemini/antigravity-ide/brain/8eb95c51-34d9-47e9-8f20-f14b04dca5bb/implementation_plan.md)**

---
© 2026 Ashmora Technologies Inc. All rights reserved.
