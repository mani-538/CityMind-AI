import time
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.base_agent import BaseAgent


class TrafficAgent(BaseAgent):
    def __init__(self):
        super().__init__("Traffic Agent")

    async def optimize_corridor(self, db: AsyncSession, complaint_id: str, address: str, priority: str) -> Dict[str, Any]:
        start_time = time.time()

        system_instruction = (
            "You are the Ashmora Intelligent Traffic Management AI Agent. "
            "Suggest green corridor light sequences for emergency vehicles and rerouting for citizens."
        )
        prompt = f"Target Location: {address}\nIncident Priority: {priority}"
        response_text = await self.generate_response(prompt, system_instruction)

        corridor_plan = response_text if response_text else (
            f"GREEN CORRIDOR ACTIVATED: Override traffic light signals along Grand Arterial Boulevard towards {address}. "
            "Reroute civilian traffic to Boulevard West."
        )

        result = {
            "green_corridor_active": True,
            "signal_override_route": "Central Expressway -> Grand Arterial",
            "detour_advice": "Civilian traffic diverted to 8th Avenue West",
            "estimated_clearance_minutes": 25,
            "corridor_plan": corridor_plan
        }

        execution_time = (time.time() - start_time) * 1000
        await self.log_execution(db, "OPTIMIZE_CORRIDOR", complaint_id, {"address": address}, result, execution_time)

        return result
