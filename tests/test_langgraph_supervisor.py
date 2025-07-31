"""
Integration tests for LangGraph Supervisor implementation.
Following TDD principles - these tests are written BEFORE the implementation.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio
from typing import Dict, List, Any
from datetime import datetime, timedelta

# Mark all async tests properly
pytestmark = pytest.mark.asyncio


class TestLangGraphSupervisor:
    """Test the supervisor pattern for coordinating robot agents."""
    
    @pytest.fixture
    def mock_agents(self):
        """Create mock robot agents for testing."""
        return {
            "RoboFriend": Mock(
                name="RoboFriend",
                traits=["cheerful", "supportive"],
                tools=["chat", "jokes", "encouragement"],
                execute=AsyncMock(return_value="Hi! I'm here to help! 😊")
            ),
            "RoboNerd": Mock(
                name="RoboNerd", 
                traits=["analytical", "precise"],
                tools=["chat", "calculate", "research", "code"],
                execute=AsyncMock(return_value="According to my calculations... 🤓")
            ),
            "RoboPirate": Mock(
                name="RoboPirate",
                traits=["adventurous", "playful"],
                tools=["chat", "treasure_hunt", "sea_tales"],
                execute=AsyncMock(return_value="Ahoy matey! Ready for adventure! 🏴‍☠️")
            )
        }
    
    @pytest.fixture
    def supervisor_config(self):
        """Configuration for the supervisor."""
        return {
            "name": "RobotBrainSupervisor",
            "timeout": 30,  # 30 second timeout
            "max_parallel_agents": 3,
            "delegation_strategy": "skill_based"  # delegate based on agent skills
        }
    
    async def test_supervisor_initialization(self, mock_agents, supervisor_config):
        """Test that supervisor initializes correctly with agents."""
        from src.langgraph_supervisor import RobotSupervisor
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        assert supervisor.name == "RobotBrainSupervisor"
        assert len(supervisor.agents) == 3
        assert supervisor.timeout == 30
        assert "RoboFriend" in supervisor.agents
    
    async def test_single_agent_delegation(self, mock_agents, supervisor_config):
        """Test supervisor delegates to appropriate single agent."""
        from src.langgraph_supervisor import RobotSupervisor
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        # Test math-related query goes to RoboNerd
        result = await supervisor.execute("What is 2 + 2?")
        
        mock_agents["RoboNerd"].execute.assert_called_once()
        assert "calculations" in str(result).lower()
    
    async def test_multi_agent_coordination(self, mock_agents, supervisor_config):
        """Test supervisor coordinates multiple agents for complex tasks."""
        from src.langgraph_supervisor import RobotSupervisor
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        # Complex query requiring multiple agents
        result = await supervisor.execute(
            "Calculate the distance to treasure island and tell me a pirate joke"
        )
        
        # Both RoboNerd and RoboPirate should be called
        mock_agents["RoboNerd"].execute.assert_called()
        mock_agents["RoboPirate"].execute.assert_called()
        
        # Result should contain responses from both
        assert isinstance(result, dict)
        assert "agents_involved" in result
        # May include RoboFriend too due to "joke" keyword
        assert len(result["agents_involved"]) >= 2
    
    async def test_parallel_execution(self, mock_agents, supervisor_config):
        """Test that supervisor executes agents in parallel when possible."""
        from src.langgraph_supervisor import RobotSupervisor
        
        # Add delays to simulate real work
        async def delayed_response(agent_name, delay=1):
            await asyncio.sleep(delay)
            return f"Response from {agent_name}"
        
        mock_agents["RoboFriend"].execute = AsyncMock(
            side_effect=lambda x: delayed_response("RoboFriend", 1)
        )
        mock_agents["RoboNerd"].execute = AsyncMock(
            side_effect=lambda x: delayed_response("RoboNerd", 1)
        )
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        start_time = datetime.now()
        result = await supervisor.execute(
            "Tell me a joke and calculate something",
            parallel=True
        )
        duration = (datetime.now() - start_time).total_seconds()
        
        # If executed in parallel, should take ~1 second, not 2
        assert duration < 1.5
        # May include RoboPirate too
        assert len(result["agents_involved"]) >= 2
    
    async def test_timeout_handling(self, mock_agents, supervisor_config):
        """Test supervisor handles timeouts gracefully."""
        from src.langgraph_supervisor import RobotSupervisor
        
        # Create an agent that times out
        async def timeout_response(query):
            await asyncio.sleep(40)  # Longer than timeout
            return "This should timeout"
        
        mock_agents["RoboNerd"].execute = AsyncMock(side_effect=timeout_response)
        
        supervisor_config["timeout"] = 2  # 2 second timeout for test
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        result = await supervisor.execute("Calculate something complex")
        
        assert result["status"] == "partial_success"
        assert "timeout" in result["errors"][0].lower()
    
    async def test_error_recovery(self, mock_agents, supervisor_config):
        """Test supervisor recovers from agent errors."""
        from src.langgraph_supervisor import RobotSupervisor
        
        # Make one agent fail
        mock_agents["RoboNerd"].execute = AsyncMock(
            side_effect=Exception("Calculation error")
        )
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        result = await supervisor.execute("Calculate 2+2 and tell a joke")
        
        # Should still get response from RoboFriend
        assert result["status"] == "partial_success"
        assert len(result["responses"]) >= 1
        assert any("error" in str(e).lower() for e in result["errors"])
    
    async def test_skill_based_delegation(self, mock_agents, supervisor_config):
        """Test supervisor delegates based on agent skills/tools."""
        from src.langgraph_supervisor import RobotSupervisor
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        # Test different queries go to appropriate agents
        test_cases = [
            ("Tell me a joke", "RoboFriend"),
            ("Calculate pi to 10 digits", "RoboNerd"),
            ("Tell me about treasure", "RoboPirate")
        ]
        
        for query, expected_agent in test_cases:
            mock_agents[expected_agent].execute.reset_mock()
            
            await supervisor.execute(query)
            
            mock_agents[expected_agent].execute.assert_called()
    
    async def test_conversation_context(self, mock_agents, supervisor_config):
        """Test supervisor maintains conversation context."""
        from src.langgraph_supervisor import RobotSupervisor
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        # First query
        await supervisor.execute("My name is Alice")
        
        # Second query should have context
        result = await supervisor.execute("What's my name?")
        
        # Check that context was passed to agents
        call_args = mock_agents["RoboFriend"].execute.call_args
        assert "Alice" in str(call_args)
    
    async def test_supervisor_configuration_validation(self):
        """Test supervisor validates configuration properly."""
        from src.langgraph_supervisor import RobotSupervisor
        
        # Test missing required config
        with pytest.raises(ValueError, match="name"):
            RobotSupervisor(
                agents={},
                config={}
            )
        
        # Test invalid timeout
        with pytest.raises(ValueError, match="timeout"):
            RobotSupervisor(
                agents={},
                config={"name": "TestSupervisor", "timeout": -1}
            )
    
    async def test_agent_handoff(self, mock_agents, supervisor_config):
        """Test agents can hand off tasks to each other."""
        from src.langgraph_supervisor import RobotSupervisor
        
        # RoboNerd hands off joke request to RoboFriend
        mock_agents["RoboNerd"].execute = AsyncMock(
            return_value={
                "response": "I'll calculate that, but...",
                "handoff_to": "RoboFriend",
                "handoff_task": "tell a math joke"
            }
        )
        
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config=supervisor_config
        )
        
        result = await supervisor.execute("Calculate 2+2 and make it funny")
        
        # Both agents should be called
        assert len(result["agents_involved"]) == 2
        assert len(result["workflow"]) > 0
        assert result["workflow"][0]["type"] == "handoff"


class TestProfessionalVerticalSupport:
    """Test that supervisor pattern supports professional verticals."""
    
    @pytest.fixture
    def trading_agents(self):
        """Create mock trading team agents."""
        return {
            "MarketAnalyst": Mock(
                name="MarketAnalyst",
                tools=["web_scraping", "news_api", "sentiment_analysis"],
                execute=AsyncMock(return_value="Market sentiment is bullish")
            ),
            "QuantResearcher": Mock(
                name="QuantResearcher",
                tools=["data_analysis", "backtesting", "calculation"],
                execute=AsyncMock(return_value="RSI indicates oversold conditions")
            ),
            "RiskManager": Mock(
                name="RiskManager",
                tools=["position_sizing", "risk_calculation", "alerts"],
                execute=AsyncMock(return_value="Recommended position size: 2%")
            )
        }
    
    async def test_trading_workflow(self, trading_agents):
        """Test supervisor can coordinate trading team workflow."""
        from src.langgraph_supervisor import VerticalSupervisor, TradingSupervisor
        
        supervisor = VerticalSupervisor(
            vertical="trading",
            agents=trading_agents,
            config={
                "name": "TradingSupervisor",
                "timeout": 30,
                "workflow_type": "trading_analysis"
            }
        )
        
        result = await supervisor.execute("Analyze AAPL for trading opportunity")
        
        # All three agents should contribute
        assert len(result["agents_involved"]) == 3
        assert "market_sentiment" in result["analysis"]
        assert "risk_assessment" in result["analysis"]
        assert result["analysis"]["risk_assessment"]["position_size"] == 2
    
    @pytest.fixture
    def payroll_agents(self):
        """Create mock payroll team agents."""
        return {
            "PayrollProcessor": Mock(
                name="PayrollProcessor",
                tools=["timesheet_import", "payroll_calculation", "direct_deposit"],
                execute=AsyncMock(return_value="Processed 50 employee timesheets")
            ),
            "TaxCalculator": Mock(
                name="TaxCalculator",
                tools=["tax_calculation", "tax_filing", "w2_generation"],
                execute=AsyncMock(return_value="Federal tax: $5,000, State tax: $2,000")
            ),
            "ComplianceAgent": Mock(
                name="ComplianceAgent",
                tools=["audit_log", "compliance_check", "policy_lookup"],
                execute=AsyncMock(return_value="All overtime compliant with FLSA")
            )
        }
    
    async def test_payroll_workflow(self, payroll_agents):
        """Test supervisor can coordinate payroll team workflow."""
        from src.langgraph_supervisor import VerticalSupervisor, PayrollSupervisor
        
        supervisor = PayrollSupervisor(
            agents=payroll_agents,
            config={
                "name": "PayrollSupervisor",
                "timeout": 45,
                "workflow_type": "biweekly_payroll"
            }
        )
        
        # Test the specific payroll processing method
        test_employees = [
            {"id": "E001", "hours": 40, "rate": 25.00},
            {"id": "E002", "hours": 45, "rate": 30.00},  # Overtime
        ]
        
        result = await supervisor.process_payroll(
            employees=test_employees,
            pay_period="2024-01-01 to 2024-01-15"
        )
        
        # Verify workflow execution order
        assert result["workflow_steps"][0]["agent"] == "PayrollProcessor"
        assert result["workflow_steps"][1]["agent"] == "TaxCalculator"
        assert result["workflow_steps"][2]["agent"] == "ComplianceAgent"
        
        # Verify calculations
        assert result["status"] == "success"
        assert len(result["processed_employees"]) == 2
        
        # Check overtime was calculated
        overtime_employee = next(e for e in result["processed_employees"] 
                               if e["id"] == "E002")
        assert overtime_employee["overtime_hours"] == 5
        assert overtime_employee["gross_pay"] == (40 * 30) + (5 * 30 * 1.5)  # 1425.0


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])