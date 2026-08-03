import time
import json
from typing import Optional, Dict, Any
import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.logging import logger
from app.models.agent import AgentLog


class BaseAgent:
    def __init__(self, name: str):
        self.name = name
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    async def log_execution(
        self,
        db: AsyncSession,
        action: str,
        target_id: Optional[str],
        input_data: Any,
        output_data: Any,
        execution_time_ms: float,
        status: str = "SUCCESS",
    ) -> AgentLog:
        input_str = json.dumps(input_data) if isinstance(input_data, (dict, list)) else str(input_data)
        output_str = json.dumps(output_data) if isinstance(output_data, (dict, list)) else str(output_data)

        log = AgentLog(
            agent_name=self.name,
            target_id=target_id,
            action=action,
            input_data=input_str[:1000],
            output_data=output_str[:2000],
            execution_time_ms=execution_time_ms,
            status=status,
        )
        db.add(log)
        await db.flush()
        return log

    async def generate_response(self, prompt: str, system_instruction: str) -> str:
        if not self.model:
            logger.warning(f"Agent [{self.name}] Gemini API key missing. Utilizing rule-based fallback response.")
            return ""

        try:
            full_prompt = f"System Instruction: {system_instruction}\n\nTask Prompt: {prompt}"
            response = self.model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Agent [{self.name}] Gemini generation error: {e}")
            return ""
