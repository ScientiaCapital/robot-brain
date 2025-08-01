"""
Abstract BaseAgent class for creating professional vertical agents.
Based on patterns from Google's Agent Development Kit (ADK).
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Type
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Configuration for an agent."""
    name: str
    description: str
    tools: List[str] = field(default_factory=list)
    model: str = "default"
    parameters: Dict[str, Any] = field(default_factory=dict)
    

class BaseAgent(ABC):
    """Abstract base class for all agents in the system."""
    
    def __init__(
        self,
        name: str,
        description: str,
        tools: List[str],
        model: str = "default",
        parameters: Optional[Dict[str, Any]] = None
    ):
        """Initialize base agent with common properties."""
        self.name = name
        self.description = description
        self.tools = tools
        self.model = model
        self.parameters = parameters or {}
        self._tool_instances: Dict[str, Any] = {}
        
    @abstractmethod
    async def execute(
        self, 
        query: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute agent logic for a given query.
        
        Args:
            query: The input query/task for the agent
            context: Optional context information
            
        Returns:
            Dict containing at minimum a 'response' key
        """
        pass
    
    def validate_tools(self) -> bool:
        """Validate that all required tools are available."""
        from .base_tool import ToolRegistry
        
        for tool_name in self.tools:
            if not ToolRegistry.exists(tool_name):
                logger.warning(f"Tool '{tool_name}' not found in registry")
                return False
        return True
    
    async def use_tool(self, tool_name: str, **kwargs: Any) -> Dict[str, Any]:
        """Execute a tool by name with given parameters."""
        from .base_tool import ToolRegistry
        
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not available for agent '{self.name}'")
            
        tool = ToolRegistry.get(tool_name)
        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found in registry")
            
        return await tool.execute(**kwargs)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary representation."""
        return {
            "name": self.name,
            "description": self.description,
            "tools": self.tools,
            "model": self.model,
            "parameters": self.parameters
        }
    
    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "BaseAgent":
        """Create agent from dictionary configuration."""
        return cls(
            name=config["name"],
            description=config["description"],
            tools=config.get("tools", []),
            model=config.get("model", "default"),
            parameters=config.get("parameters", {})
        )


# Registry for agent types
_agent_registry: Dict[str, Type[BaseAgent]] = {}


def register_agent_type(name: str, agent_class: Type[BaseAgent]) -> None:
    """Register an agent type for dynamic creation."""
    _agent_registry[name] = agent_class


def get_agent_type(name: str) -> Optional[Type[BaseAgent]]:
    """Get an agent type by name."""
    return _agent_registry.get(name)


async def create_agent_from_config(config: Dict[str, Any]) -> BaseAgent:
    """Create an agent instance from configuration."""
    agent_type = config.get("type", "BaseAgent")
    
    # Get the agent class
    agent_class = get_agent_type(agent_type)
    if not agent_class:
        # For testing, create a simple implementation
        class ConfiguredAgent(BaseAgent):
            async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
                return {"response": f"Configured agent response to: {query}"}
        
        agent_class = ConfiguredAgent
    
    # Create the agent
    return agent_class(
        name=config["name"],
        description=config.get("description", f"{config['name']} agent"),
        tools=config.get("tools", []),
        model=config.get("model", "default"),
        parameters=config.get("parameters", {})
    )