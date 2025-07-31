"""
Configuration loader for dynamic vertical and tool loading.
Supports YAML and JSON configurations.
"""

import yaml
import json
from typing import Dict, Any, List, Optional, Type
from dataclasses import dataclass, field
import importlib
import logging

from .base_agent import BaseAgent, create_agent_from_config
from .base_tool import BaseTool, ToolRegistry

logger = logging.getLogger(__name__)


@dataclass 
class WorkflowStep:
    """A step in a workflow."""
    agent: str
    task: str
    timeout: Optional[int] = None
    

@dataclass
class Workflow:
    """Definition of a multi-agent workflow."""
    name: str
    steps: List[WorkflowStep] = field(default_factory=list)
    

@dataclass
class VerticalConfig:
    """Configuration for a professional vertical."""
    name: str
    vertical: str
    agents: List[BaseAgent] = field(default_factory=list)
    workflows: Dict[str, Workflow] = field(default_factory=dict)
    

async def load_vertical_config(config_data: str) -> VerticalConfig:
    """Load a vertical configuration from YAML or JSON string."""
    # Try to parse as YAML first
    try:
        config = yaml.safe_load(config_data)
    except yaml.YAMLError:
        # Try JSON if YAML fails
        try:
            config = json.loads(config_data)
        except json.JSONDecodeError:
            raise ValueError("Invalid configuration format (must be YAML or JSON)")
    
    # Create vertical config
    vertical = VerticalConfig(
        name=config["name"],
        vertical=config["vertical"]
    )
    
    # Load agents
    for agent_config in config.get("agents", []):
        agent = await create_agent_from_config(agent_config)
        vertical.agents.append(agent)
    
    # Load workflows
    for workflow_config in config.get("workflows", []):
        workflow = Workflow(name=workflow_config["name"])
        
        for step in workflow_config.get("steps", []):
            workflow.steps.append(WorkflowStep(
                agent=step["agent"],
                task=step["task"],
                timeout=step.get("timeout")
            ))
        
        vertical.workflows[workflow.name] = workflow
    
    return vertical


async def load_tools_config(config: Dict[str, Any]) -> Dict[str, BaseTool]:
    """Load tools from configuration."""
    loaded_tools = {}
    
    for tool_name, tool_config in config.items():
        # Get tool class
        class_name = tool_config["class"]
        
        # For testing, create simple tool implementations
        if class_name == "EmailTool":
            class EmailTool(BaseTool):
                def __init__(self, config: Dict[str, Any]):
                    super().__init__(
                        name="email",
                        description="Send emails",
                        parameters={
                            "to": {"type": "string", "required": True},
                            "subject": {"type": "string", "required": True},
                            "body": {"type": "string", "required": True}
                        }
                    )
                    self.config = config
                    
                async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                    return {"sent": True, "to": kwargs.get("to")}
            
            tool = EmailTool(tool_config["config"])
            
        elif class_name == "SlackTool":
            class SlackTool(BaseTool):
                def __init__(self, config: Dict[str, Any]):
                    super().__init__(
                        name="slack",
                        description="Send Slack messages",
                        parameters={
                            "channel": {"type": "string", "required": True},
                            "message": {"type": "string", "required": True}
                        }
                    )
                    self.config = config
                    
                async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                    return {"sent": True, "channel": kwargs.get("channel")}
            
            tool = SlackTool(tool_config["config"])
            
        else:
            # Try to dynamically import
            try:
                module_path, class_name = class_name.rsplit(".", 1)
                module = importlib.import_module(module_path)
                tool_class = getattr(module, class_name)
                tool = tool_class(tool_config.get("config", {}))
            except Exception as e:
                logger.error(f"Failed to load tool {tool_name}: {e}")
                continue
        
        loaded_tools[tool_name] = tool
        ToolRegistry.register(tool_name, tool)
    
    return loaded_tools


def export_vertical_config(vertical: VerticalConfig) -> Dict[str, Any]:
    """Export vertical configuration to dictionary."""
    return {
        "name": vertical.name,
        "vertical": vertical.vertical,
        "agents": [agent.to_dict() for agent in vertical.agents],
        "workflows": [
            {
                "name": workflow.name,
                "steps": [
                    {
                        "agent": step.agent,
                        "task": step.task,
                        "timeout": step.timeout
                    }
                    for step in workflow.steps
                ]
            }
            for workflow in vertical.workflows.values()
        ]
    }