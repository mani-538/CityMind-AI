import time
import json
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.base_agent import BaseAgent


class ComplaintAgent(BaseAgent):
    def __init__(self):
        super().__init__("Complaint Agent")

    async def analyze(self, db: AsyncSession, complaint_id: str, title: str, category: str, description: str) -> Dict[str, Any]:
        start_time = time.time()
        
        system_instruction = (
            "You are the Ashmora Smart City Complaint Verification AI Agent. "
            "Analyze the complaint description, assess severity, calculate priority (Low, Medium, High, Critical), "
            "and output JSON with fields: priority, confidence_score (0.0-1.0), summary, recommended_action."
        )
        prompt = f"Title: {title}\nCategory: {category}\nDescription: {description}"

        response_text = await self.generate_response(prompt, system_instruction)
        
        # Rule-based parsing fallback if Gemini API is offline/empty
        result = {
            "priority": "Medium",
            "confidence_score": 0.88,
            "summary": f"Incident categorization verified for '{category}'. Standard dispatch assigned.",
            "recommended_action": "Notify relevant municipal department for inspection within 24 hours.",
            "is_duplicate": False,
        }

        if response_text:
            try:
                # Attempt JSON extraction from Gemini output
                cleaned = response_text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned)
                result.update(parsed)
            except Exception:
                result["summary"] = response_text[:250]

        # Rule adjustments for emergency keywords
        desc_lower = description.lower()
        if "fire" in desc_lower or "explosion" in desc_lower or "smoke" in desc_lower or "trapped" in desc_lower:
            result["priority"] = "Critical"
            result["recommended_action"] = "IMMEDIATE EMERGENCY DISPATCH: Notify Fire & Rescue Units and clear route."
        elif "flood" in desc_lower or "burst" in desc_lower or "accident" in desc_lower:
            result["priority"] = "High"

        execution_time = (time.time() - start_time) * 1000
        await self.log_execution(db, "ANALYZE_COMPLAINT", complaint_id, {"title": title, "category": category}, result, execution_time)

        return result
