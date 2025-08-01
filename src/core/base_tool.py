"""
Abstract BaseTool class for creating reusable tools across agents.
Tools can be composed and reused by multiple agents.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ToolParameter:
    """Definition of a tool parameter."""
    type: str  # string, number, boolean, array, object
    required: bool = True
    default: Any = None
    description: str = ""


class BaseTool(ABC):
    """Abstract base class for all tools in the system."""
    
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Union[Dict[str, Any], ToolParameter]]
    ):
        """Initialize base tool with metadata."""
        self.name = name
        self.description = description
        self.parameters = self._normalize_parameters(parameters)
        
    def _normalize_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize parameter definitions."""
        # Keep as dict for backward compatibility
        return params
    
    def validate_parameters(self, **kwargs: Any) -> None:
        """Validate provided parameters against tool definition."""
        # Check required parameters
        for param_name, param_def in self.parameters.items():
            if isinstance(param_def, dict):
                required = param_def.get("required", True)
            else:
                required = param_def.required
                
            if required and param_name not in kwargs:
                raise ValueError(f"Missing required parameter: {param_name}")
    
    async def execute(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute the tool with given parameters.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            Dict containing tool execution results
        """
        self.validate_parameters(**kwargs)
        return await self._execute_impl(**kwargs)
    
    @abstractmethod
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """Implementation of tool execution - to be overridden by subclasses."""
        pass
    
    async def __call__(self, **kwargs: Any) -> Dict[str, Any]:
        """Allow tool to be called directly."""
        self.validate_parameters(**kwargs)
        return await self.execute(**kwargs)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert tool to dictionary representation."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                k: v.__dict__ if hasattr(v, '__dict__') else v 
                for k, v in self.parameters.items()
            }
        }


class CompositeTool(BaseTool):
    """Tool that composes multiple other tools."""
    
    def __init__(
        self,
        name: str,
        description: str,
        tools: List[BaseTool],
        parameters: Optional[Dict[str, Any]] = None
    ):
        """Initialize composite tool."""
        super().__init__(
            name=name,
            description=description,
            parameters=parameters or {"steps": {"type": "array", "required": True}}
        )
        self.tools = {tool.name: tool for tool in tools}
        
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute composite tool by running tools in sequence."""
        steps = kwargs.get("steps", [])
        results: Dict[str, Any] = {}
        
        for step in steps:
            tool_name = step["tool"]
            tool_params = step.get("params", {})
            
            # Process parameter templates
            for key, value in tool_params.items():
                if isinstance(value, str) and value.startswith("{") and value.endswith("}"):
                    # Simple template replacement
                    path = value[1:-1].split(".")
                    if path[0] == "data" and len(path) >= 3:
                        # Handle {data[0].email} format
                        if path[1].startswith("[") and path[1].endswith("]"):
                            idx = int(path[1][1:-1])
                            if "database" in results and "data" in results["database"]:
                                tool_params[key] = results["database"]["data"][idx][path[2]]
            
            if tool_name in self.tools:
                tool = self.tools[tool_name]
                result = await tool.execute(**tool_params)
                results[tool_name] = result
                
        return results


class ToolRegistry:
    """Global registry for tools."""
    _tools: Dict[str, BaseTool] = {}
    
    @classmethod
    def register(cls, name: str, tool: BaseTool) -> None:
        """Register a tool in the global registry."""
        cls._tools[name] = tool
        
    @classmethod
    def get(cls, name: str) -> Optional[BaseTool]:
        """Get a tool from the registry."""
        return cls._tools.get(name)
        
    @classmethod
    def exists(cls, name: str) -> bool:
        """Check if a tool exists in the registry."""
        return name in cls._tools
        
    @classmethod
    def list_tools(cls) -> List[str]:
        """List all registered tool names."""
        return list(cls._tools.keys())
        
    @classmethod
    def clear(cls) -> None:
        """Clear all registered tools (useful for testing)."""
        cls._tools.clear()