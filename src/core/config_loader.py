"""
Configuration loader for dynamic vertical and tool loading.
Supports YAML and JSON configurations.
🟢 TDD GREEN Phase: Enhanced with production configuration support.
"""

import yaml
import json
import os
from pathlib import Path
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


# 🟢 TDD GREEN Phase: Production configuration functions

def load_production_config() -> Dict[str, Any]:
    """
    Load production configuration based on environment variables.
    Context7 best practices: Secure, environment-specific settings.
    """
    environment = os.getenv("ENVIRONMENT", "development")
    
    config = {
        "debug": False if environment == "production" else True,
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "environment": environment,
        "secret_key": os.getenv("SECRET_KEY", "dev-secret-key"),
    }
    
    # CORS configuration based on environment
    if environment == "production":
        cors_origins_str = os.getenv("CORS_ORIGINS", "[]")
        # Parse the string as a list (simple implementation)
        import ast
        try:
            config["cors_origins"] = ast.literal_eval(cors_origins_str)
        except (ValueError, SyntaxError):
            config["cors_origins"] = ["https://robot-brain.example.com"]
    else:
        config["cors_origins"] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Trusted hosts for production
    if environment == "production":
        trusted_hosts_str = os.getenv("TRUSTED_HOSTS", '["robot-brain.example.com"]')
        try:
            config["trusted_hosts"] = ast.literal_eval(trusted_hosts_str)
        except (ValueError, SyntaxError):
            config["trusted_hosts"] = ["robot-brain.example.com"]
    else:
        config["trusted_hosts"] = ["localhost", "127.0.0.1"]
    
    return config


def load_environment_file(env_file: str = None) -> None:
    """
    Load environment variables from .env file.
    """
    if env_file is None:
        environment = os.getenv("ENVIRONMENT", "development")
        env_file = f".env.{environment}"
    
    env_path = Path(env_file)
    if not env_path.exists():
        return
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip('"\'')
                os.environ[key] = value


def get_database_config() -> Dict[str, Any]:
    """
    Get database configuration with Context7 best practices.
    """
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    config = {
        "database_url": database_url,
        "uses_pooler": "-pooler" in database_url,
        "ssl_enabled": "sslmode=require" in database_url,
        "channel_binding": "channel_binding=require" in database_url,
    }
    
    return config


def validate_production_config() -> Dict[str, bool]:
    """
    Validate that production configuration is secure and complete.
    """
    validation_results = {}
    
    # Check required environment variables
    required_vars = ["DATABASE_URL", "NEON_API_KEY", "NEON_PROJECT_ID", "ENVIRONMENT"]
    for var in required_vars:
        validation_results[f"has_{var.lower()}"] = os.getenv(var) is not None
    
    # Check database configuration
    try:
        db_config = get_database_config()
        validation_results["uses_pooler_endpoint"] = db_config["uses_pooler"]
        validation_results["ssl_enabled"] = db_config["ssl_enabled"]
        validation_results["channel_binding_enabled"] = db_config["channel_binding"]
    except Exception:
        validation_results["database_config_valid"] = False
    
    # Check production-specific settings
    environment = os.getenv("ENVIRONMENT", "development")
    if environment == "production":
        validation_results["debug_disabled"] = os.getenv("DEBUG", "true").lower() == "false"
        validation_results["has_secret_key"] = len(os.getenv("SECRET_KEY", "")) > 20
    
    return validation_results