import time
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.base_agent import BaseAgent


class FireAgent(BaseAgent):
    def __init__(self):
        super().__init__("Fire Agent")

    async def evaluate_hazard(self, db: AsyncSession, complaint_id: str, address: str, description: str) -> Dict[str, Any]:
        start_time = time.time()
        
        system_instruction = (
            "You are the Ashmora Emergency Fire & Rescue AI Agent. "
            "Evaluate structural/thermal hazards, suggest unit deployment, containment strategies, and evacuation advice."
        )
        prompt = f"Address: {address}\nIncident Details: {description}"
        response_text = await self.generate_response(prompt, system_instruction)

        recommendation = response_text if response_text else (
            f"DISPATCH PROTOCOL ALPHA: Deploy 2 Fire Engine Pumper Units from Central Station to {address}. "
            "Establish 100m perimeter, isolate power lines, and coordinate medical triage."
        )

        result = {
            "hazard_level": "CRITICAL_ALPHA",
            "units_required": ["Fire Engine Unit 04", "Hazmat Support", "Ambulance Team 2"],
            "containment_strategy": recommendation,
            "evacuation_zone_meters": 150,
        }

        execution_time = (time.time() - start_time) * 1000
        await self.log_execution(db, "EVALUATE_FIRE_HAZARD", complaint_id, {"address": address}, result, execution_time)

        return result
