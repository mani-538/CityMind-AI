from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AgentLogResponse(BaseModel):
    id: str
    agent_name: str
    target_id: Optional[str] = None
    action: str
    input_data: Optional[str] = None
    output_data: Optional[str] = None
    execution_time_ms: Optional[float] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentAnalysisResult(BaseModel):
    agent_name: str
    action: str
    summary: str
    recommendation: Optional[str] = None
    priority: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
