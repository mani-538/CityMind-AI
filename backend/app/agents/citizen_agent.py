import time
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.base_agent import BaseAgent


class CitizenAgent(BaseAgent):
    def __init__(self):
        super().__init__("Citizen Agent")

    async def generate_notification(self, db: AsyncSession, user_name: str, complaint_title: str, status: str, priority: str) -> Dict[str, Any]:
        start_time = time.time()

        system_instruction = (
            "You are the Ashmora Citizen Communications AI Agent. "
            "Write a polite, concise notification message to update the citizen on their reported issue."
        )
        prompt = f"Citizen: {user_name}\nIssue: {complaint_title}\nCurrent Status: {status}\nPriority: {priority}"
        response_text = await self.generate_response(prompt, system_instruction)

        message = response_text if response_text else (
            f"Hello {user_name}, your reported incident '{complaint_title}' has been evaluated as {priority} priority. "
            f"Current status: [{status}]. Municipal teams have been dispatched."
        )

        result = {
            "notification_title": f"Update on: {complaint_title}",
            "message": message,
            "channel": "IN_APP_PUSH",
        }

        execution_time = (time.time() - start_time) * 1000
        await self.log_execution(db, "GENERATE_NOTIFICATION", None, {"title": complaint_title}, result, execution_time)

        return result
