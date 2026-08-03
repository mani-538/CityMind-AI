from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import require_roles
from app.schemas.agent import AgentLogResponse
from app.schemas.common import ResponseEnvelope
from app.models.agent import AgentLog
from app.agents.head_agent import process_complaint_with_agents

router = APIRouter()


@router.get("/logs", response_model=ResponseEnvelope[List[AgentLogResponse]])
async def get_agent_logs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    stmt = select(AgentLog).order_by(AgentLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    logs = list(result.scalars().all())

    return ResponseEnvelope(
        success=True,
        message="Agent execution logs retrieved successfully",
        data=[AgentLogResponse.model_validate(l) for l in logs],
    )


@router.post("/trigger/{complaint_id}", response_model=ResponseEnvelope[dict])
async def trigger_agent_workflow(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["Government Officer", "Department Admin", "Super Admin"])),
):
    res = await process_complaint_with_agents(db, complaint_id)
    return ResponseEnvelope(
        success=True,
        message="Multi-Agent AI workflow executed successfully",
        data=res,
    )
