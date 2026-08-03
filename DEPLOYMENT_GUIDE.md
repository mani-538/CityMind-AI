# Ashmora CityMind AI — Simple Live Sharable Deployment Guide

> **Brand Message**: Building the Intelligence Behind Tomorrow.  
> **Product Tagline**: One City. One Intelligence. Infinite Possibilities.

This guide provides simple, step-by-step instructions to get a **Live Sharable URL** for **Ashmora CityMind AI** using free cloud hosting (Vercel & Render) or an instant local public tunnel.

---

## ⚡ Option 1: Instant 30-Second Sharable Link (Local Tunnel)

If you need a live shareable URL **right now** for a demo or hackathon presentation:

### Step 1: Start Backend Server
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# Install requirements if not installed:
pip install -r requirements.txt
# Start FastAPI backend server:
uvicorn app.main:app --port 8000
```

### Step 2: Start Frontend App
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(Your frontend is now running locally on `http://localhost:3000`)*

### Step 3: Generate Sharable Live URL using Localtunnel or Ngrok

**Method A: Localtunnel (No Account Required)**
Open a third terminal:
```bash
npx localtunnel --port 3000
```
Output will give you a public sharable URL:
`https://citymind-demo-xyz.loca.lt` 🎉

**Method B: Ngrok**
```bash
npx ngrok http 3000
```
Output will generate your live shareable link:
`https://a1b2-c3d4.ngrok-free.app` 🎉

---

## 🌐 Option 2: 100% Free Production Cloud Deployment (Vercel + Render)

Follow these 4 simple steps to deploy your repository `https://github.com/mani-538/CityMind-AI.git` permanently online.

---

### Step 1: Deploy Backend to Render (Free)

1. Go to **[Render.com](https://render.com/)** and sign in with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository: `mani-538/CityMind-AI`.
4. Fill in the following settings:
   - **Name**: `citymind-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Scroll to **Environment Variables** and add:
   - `SECRET_KEY` = `ashmora-citymind-ai-super-secret-jwt-key`
   - `GEMINI_API_KEY` = *(Your Gemini API key)*
   - `CORS_ORIGINS` = `*`
6. Click **Create Web Service**.

> Render will build your backend and generate a live URL:  
> **Backend API Link**: `https://citymind-ai-backend.onrender.com`  
> **Swagger API Docs Link**: `https://citymind-ai-backend.onrender.com/api/v1/docs`

---

### Step 2: Deploy Frontend to Vercel (Free)

1. Go to **[Vercel.com](https://vercel.com/)** and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import `mani-538/CityMind-AI`.
4. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click *Edit* and select `frontend`.
5. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://citymind-ai-backend.onrender.com/api/v1` *(Replace with your Render backend URL)*
6. Click **Deploy**.

> Vercel will build your frontend in under 60 seconds and give you a live shareable URL:  
> **Live App Link**: `https://citymind-ai.vercel.app` 🚀

---

### Step 3: Verify Your Live Link

Once deployed, visit your Vercel link:
1. **Landing Page**: View Ashmora branding and AI Agent ecosystem.
2. **Citizen Portal**: Register an account and submit a sample incident.
3. **Live GIS Map**: View interactive Leaflet priority markers.
4. **Command Center**: View officer telemetry and dispatch queue.
5. **AI Assistant**: Open the floating drawer in the bottom right corner to chat with Gemini CityMind AI.

---

## 📌 Summary Checklist

| Component | Platform | Live URL Example |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | `https://citymind-ai.vercel.app` |
| **Backend REST API** | Render | `https://citymind-ai-backend.onrender.com` |
| **Interactive API Docs** | Render | `https://citymind-ai-backend.onrender.com/api/v1/docs` |
| **GitHub Source Code** | GitHub | `https://github.com/mani-538/CityMind-AI.git` |
