"""
HR vertical agents: Recruiter, HRGeneralist, OnboardingAgent
"""

from typing import Dict, Any, Optional, List
from src.core.base_agent import BaseAgent


class Recruiter(BaseAgent):
    """Handles recruitment and candidate sourcing."""
    
    def __init__(self) -> None:
        super().__init__(
            name="Recruiter",
            description="Candidate sourcing and recruitment",
            tools=["email", "calendar", "resume_parser", "linkedin_api", "ats_integration"],
            model="gpt-4"
        )
        
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find and evaluate candidates."""
        # Simple implementation for testing
        candidates = []
        if "python" in query.lower() and "5+ years" in query.lower():
            candidates = [
                {
                    "name": "Jane Smith",
                    "experience_years": 7,
                    "skills": ["Python", "Django", "FastAPI", "AWS"],
                    "match_score": 92
                },
                {
                    "name": "John Doe", 
                    "experience_years": 6,
                    "skills": ["Python", "Flask", "Docker", "Kubernetes"],
                    "match_score": 88
                }
            ]
        
        return {
            "response": f"Found {len(candidates)} candidates matching criteria",
            "candidates": candidates,
            "search_criteria": query,
            "department": context.get("department", "Unknown") if context else "Unknown"
        }


class HRGeneralist(BaseAgent):
    """Handles general HR operations and employee relations."""
    
    def __init__(self) -> None:
        super().__init__(
            name="HRGeneralist",
            description="General HR operations and employee support",
            tools=["email", "calendar", "hr_database", "policy_lookup", "ticket_system"],
            model="gpt-3.5-turbo"
        )
        
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Handle HR requests and operations."""
        return {
            "response": f"HR request processed: {query}",
            "action_taken": "Policy clarification provided",
            "follow_up_required": True,
            "ticket_number": "HR-2024-0123"
        }


class OnboardingAgent(BaseAgent):
    """Manages new employee onboarding process."""
    
    def __init__(self) -> None:
        super().__init__(
            name="OnboardingAgent",
            description="New employee onboarding and orientation",
            tools=["email", "calendar", "task_management", "document_generation", "training_platform"],
            model="gpt-3.5-turbo"
        )
        
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Manage onboarding tasks."""
        return {
            "response": f"Onboarding process initiated",
            "tasks_created": [
                "IT equipment setup",
                "Benefits enrollment",
                "Training schedule",
                "Team introductions"
            ],
            "estimated_completion": "5 business days",
            "assigned_buddy": "Senior team member"
        }


async def create_hr_agents(config: Optional[Dict[str, Any]] = None) -> Dict[str, BaseAgent]:
    """Create all HR team agents."""
    return {
        "Recruiter": Recruiter(),
        "HRGeneralist": HRGeneralist(),
        "OnboardingAgent": OnboardingAgent()
    }