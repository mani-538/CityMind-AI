from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, complaints, agents, analytics, chat

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints & GIS"])
api_router.include_router(agents.router, prefix="/agents", tags=["AI Agents Subsystem"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & KPIs"])
api_router.include_router(chat.router, prefix="/chat", tags=["Smart City AI Chat Assistant"])
