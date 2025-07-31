"""
Tests for abstract BaseAgent and BaseTool classes.
Following TDD principles - tests written BEFORE implementation.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, List, Any, Optional
import asyncio
from abc import ABC, abstractmethod

# Mark all async tests
pytestmark = pytest.mark.asyncio


class TestBaseAgent:
    """Test the abstract BaseAgent class for professional verticals."""
    
    async def test_base_agent_initialization(self):
        """Test BaseAgent can be initialized with required parameters."""
        from src.core.base_agent import BaseAgent
        
        # Create a concrete implementation for testing
        class TestAgent(BaseAgent):
            async def execute(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
                return {"response": "test"}
        
        agent = TestAgent(
            name="TestAgent",
            description="A test agent",
            tools=["test_tool"],
            model="test-model"
        )
        
        assert agent.name == "TestAgent"
        assert agent.description == "A test agent"
        assert "test_tool" in agent.tools
        assert agent.model == "test-model"
    
    async def test_base_agent_abstract_methods(self):
        """Test that BaseAgent enforces abstract methods."""
        from src.core.base_agent import BaseAgent
        
        # Should not be able to instantiate without implementing execute
        with pytest.raises(TypeError, match="Can't instantiate abstract class"):
            BaseAgent(
                name="Invalid",
                description="Won't work",
                tools=[],
                model="test"
            )
    
    async def test_agent_tool_validation(self):
        """Test agent validates its tools exist."""
        from src.core.base_agent import BaseAgent
        from src.core.base_tool import ToolRegistry
        
        class TestAgent(BaseAgent):
            async def execute(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
                return {"response": "test"}
        
        # Register a test tool
        ToolRegistry.register("valid_tool", Mock())
        
        # Should work with valid tool
        agent = TestAgent(
            name="TestAgent",
            description="Test",
            tools=["valid_tool"],
            model="test"
        )
        assert agent.validate_tools() is True
        
        # Should fail with invalid tool
        agent2 = TestAgent(
            name="TestAgent2",
            description="Test",
            tools=["invalid_tool"],
            model="test"
        )
        assert agent2.validate_tools() is False
    
    async def test_agent_execute_with_context(self):
        """Test agent execution with context."""
        from src.core.base_agent import BaseAgent
        
        class ContextAwareAgent(BaseAgent):
            async def execute(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
                if context and "user_name" in context:
                    return {"response": f"Hello {context['user_name']}, {query}"}
                return {"response": query}
        
        agent = ContextAwareAgent(
            name="ContextAgent",
            description="Context-aware agent",
            tools=[],
            model="test"
        )
        
        # Test without context
        result = await agent.execute("How are you?")
        assert result["response"] == "How are you?"
        
        # Test with context
        result = await agent.execute("How are you?", context={"user_name": "Alice"})
        assert "Hello Alice" in result["response"]
    
    async def test_agent_tool_execution(self):
        """Test agent can execute tools."""
        from src.core.base_agent import BaseAgent
        from src.core.base_tool import BaseTool, ToolRegistry
        
        # Create a test tool
        class Calculator(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                operation = kwargs.get("operation")
                a = kwargs.get("a", 0)
                b = kwargs.get("b", 0)
                if operation == "add":
                    return {"result": a + b}
                return {"error": "Unknown operation"}
        
        calc_tool = Calculator(
            name="calculator",
            description="Basic math operations",
            parameters={
                "operation": {"type": "string", "required": True},
                "a": {"type": "number", "required": True},
                "b": {"type": "number", "required": True}
            }
        )
        ToolRegistry.register("calculator", calc_tool)
        
        # Create agent that uses the tool
        class MathAgent(BaseAgent):
            async def execute(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
                # Simple pattern matching for demo
                if "add" in query.lower():
                    result = await self.use_tool("calculator", operation="add", a=5, b=3)
                    return {"response": f"The result is {result['result']}"}
                return {"response": "I can only add numbers"}
        
        agent = MathAgent(
            name="MathAgent",
            description="Does math",
            tools=["calculator"],
            model="test"
        )
        
        result = await agent.execute("Please add numbers")
        assert "The result is 8" in result["response"]
    
    async def test_agent_configuration_from_dict(self):
        """Test creating agent from configuration dictionary."""
        from src.core.base_agent import BaseAgent, create_agent_from_config
        
        config = {
            "type": "TestAgent",
            "name": "ConfiguredAgent",
            "description": "Created from config",
            "tools": ["email", "database"],
            "model": "gpt-4",
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 1000
            }
        }
        
        agent = await create_agent_from_config(config)
        
        assert agent.name == "ConfiguredAgent"
        assert "email" in agent.tools
        assert agent.parameters["temperature"] == 0.7


class TestBaseTool:
    """Test the abstract BaseTool class."""
    
    async def test_base_tool_initialization(self):
        """Test BaseTool can be initialized properly."""
        from src.core.base_tool import BaseTool
        
        class TestTool(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                return {"status": "success"}
        
        tool = TestTool(
            name="test_tool",
            description="A test tool",
            parameters={
                "input": {"type": "string", "required": True},
                "count": {"type": "number", "required": False, "default": 1}
            }
        )
        
        assert tool.name == "test_tool"
        assert tool.description == "A test tool"
        assert "input" in tool.parameters
        assert tool.parameters["count"]["default"] == 1
    
    async def test_tool_parameter_validation(self):
        """Test tool validates parameters before execution."""
        from src.core.base_tool import BaseTool
        
        class StrictTool(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                return {"received": kwargs}
        
        tool = StrictTool(
            name="strict_tool",
            description="Validates parameters",
            parameters={
                "required_field": {"type": "string", "required": True},
                "optional_field": {"type": "number", "required": False}
            }
        )
        
        # Should fail without required parameter
        with pytest.raises(ValueError, match="Missing required parameter"):
            await tool.execute(optional_field=5)
        
        # Should succeed with required parameter
        result = await tool.execute(required_field="test")
        assert result["received"]["required_field"] == "test"
    
    async def test_tool_registry(self):
        """Test global tool registry functionality."""
        from src.core.base_tool import BaseTool, ToolRegistry
        
        class EmailTool(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                return {"sent": True, "to": kwargs.get("to")}
        
        email_tool = EmailTool(
            name="email",
            description="Send emails",
            parameters={
                "to": {"type": "string", "required": True},
                "subject": {"type": "string", "required": True},
                "body": {"type": "string", "required": True}
            }
        )
        
        # Register tool
        ToolRegistry.register("email", email_tool)
        
        # Retrieve tool
        retrieved = ToolRegistry.get("email")
        assert retrieved.name == "email"
        
        # List all tools
        all_tools = ToolRegistry.list_tools()
        assert "email" in all_tools
    
    async def test_tool_composition(self):
        """Test tools can be composed together."""
        from src.core.base_tool import BaseTool, CompositeTool
        
        class DatabaseTool(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                return {"data": [{"id": 1, "email": "test@example.com"}]}
        
        class EmailTool(BaseTool):
            async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
                return {"sent": True, "to": kwargs.get("to")}
        
        db_tool = DatabaseTool("database", "Query database", {"query": {"type": "string"}})
        email_tool = EmailTool("email", "Send email", {"to": {"type": "string"}, "message": {"type": "string"}})
        
        # Create composite tool
        composite = CompositeTool(
            name="notify_users",
            description="Query users and send notifications",
            tools=[db_tool, email_tool]
        )
        
        result = await composite.execute(
            steps=[
                {"tool": "database", "params": {"query": "SELECT * FROM users"}},
                {"tool": "email", "params": {"to": "{data[0].email}", "message": "Hello!"}}
            ]
        )
        
        assert result["database"]["data"][0]["email"] == "test@example.com"
        assert result["email"]["sent"] is True


class TestProfessionalVerticals:
    """Test professional vertical implementations."""
    
    async def test_trading_market_analyst(self):
        """Test MarketAnalyst agent for trading vertical."""
        from src.verticals.trading.agents import MarketAnalyst
        
        analyst = MarketAnalyst()
        
        assert analyst.name == "MarketAnalyst"
        assert "web_scraping" in analyst.tools
        assert "sentiment_analysis" in analyst.tools
        
        # Test execution
        result = await analyst.execute("Analyze AAPL market sentiment")
        assert "sentiment" in result
        assert result["sentiment"] in ["bullish", "bearish", "neutral"]
    
    async def test_hr_recruiter_agent(self):
        """Test Recruiter agent for HR vertical."""
        from src.verticals.hr.agents import Recruiter
        
        recruiter = Recruiter()
        
        assert recruiter.name == "Recruiter"
        assert "email" in recruiter.tools
        assert "calendar" in recruiter.tools
        assert "resume_parser" in recruiter.tools
        
        # Test candidate search
        result = await recruiter.execute(
            "Find Python developers with 5+ years experience",
            context={"department": "Engineering"}
        )
        assert "candidates" in result
    
    async def test_payroll_processor(self):
        """Test PayrollProcessor for payroll vertical."""
        from src.verticals.payroll.agents import PayrollProcessor
        
        processor = PayrollProcessor()
        
        assert processor.name == "PayrollProcessor"
        assert "timesheet_import" in processor.tools
        assert "payroll_calculation" in processor.tools
        
        # Test payroll processing
        result = await processor.execute(
            "Process biweekly payroll",
            context={
                "employees": [
                    {"id": "E001", "hours": 40, "rate": 25.00}
                ],
                "pay_period": "2024-01-01 to 2024-01-15"
            }
        )
        assert result["processed_count"] == 1
        assert result["total_gross_pay"] == 1000.00


class TestConfigurationSystem:
    """Test YAML/JSON configuration loading."""
    
    async def test_load_vertical_from_yaml(self):
        """Test loading a complete vertical from YAML config."""
        from src.core.config_loader import load_vertical_config
        
        yaml_config = """
        vertical: trading
        name: "Algorithmic Trading Team"
        agents:
          - type: MarketAnalyst
            name: "Market Scanner"
            tools: ["web_scraping", "news_api", "sentiment_analysis"]
            model: "gpt-4"
          - type: QuantResearcher  
            name: "Quant Brain"
            tools: ["data_analysis", "backtesting", "statistics"]
            model: "claude-2"
          - type: RiskManager
            name: "Risk Guardian"
            tools: ["position_sizing", "var_calculation", "alerts"]
            model: "gpt-3.5-turbo"
        workflows:
          - name: "daily_analysis"
            steps:
              - agent: "Market Scanner"
                task: "Scan market news and sentiment"
              - agent: "Quant Brain"
                task: "Analyze technical indicators"
              - agent: "Risk Guardian"
                task: "Calculate position sizes"
        """
        
        vertical = await load_vertical_config(yaml_config)
        
        assert vertical.name == "Algorithmic Trading Team"
        assert len(vertical.agents) == 3
        assert vertical.agents[0].name == "Market Scanner"
        assert "daily_analysis" in vertical.workflows
    
    async def test_dynamic_tool_loading(self):
        """Test dynamically loading tools from configuration."""
        from src.core.config_loader import load_tools_config
        
        tools_config = {
            "email": {
                "class": "EmailTool",
                "config": {
                    "smtp_host": "smtp.gmail.com",
                    "smtp_port": 587
                }
            },
            "slack": {
                "class": "SlackTool", 
                "config": {
                    "webhook_url": "https://hooks.slack.com/..."
                }
            }
        }
        
        tools = await load_tools_config(tools_config)
        
        assert "email" in tools
        assert "slack" in tools
        assert tools["email"].config["smtp_host"] == "smtp.gmail.com"


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])