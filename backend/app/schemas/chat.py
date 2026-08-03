from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session"


class ChatMessageResponse(BaseModel):
    session_id: str
    role: str  # "model"
    content: str
    intent: Optional[str] = None
    created_at: datetime


class ChatHistoryItem(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    intent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
