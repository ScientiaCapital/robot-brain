"""
Integration tests with REAL LLMs for LangGraph Supervisor.
These tests use actual AI models to verify real-world behavior.
Run sparingly due to cost and time.
"""

import pytest
import os
from typing import Dict, Any
import asyncio
from datetime import datetime

# Mark these tests as integration tests that use real LLMs
pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


class TestRealLLMIntegration:
    """Test supervisor with real LLM calls - not mocked!"""
    
    @pytest.fixture
    def real_ollama_config(self):
        """Configuration for real Ollama connection."""
        return {
            "base_url": os.getenv("OLLAMA_HOST", "http://localhost:11434"),
            "timeout": 30,
            "models": {
                "default": "llama2:latest",
                "smart": "codellama:latest",
                "fast": "tinyllama:latest"
            }
        }
    
    @pytest.fixture
    def real_cloudflare_config(self):
        """Configuration for real Cloudflare Workers AI."""
        return {
            "account_id": os.getenv("CLOUDFLARE_ACCOUNT_ID"),
            "api_token": os.getenv("CLOUDFLARE_API_TOKEN"),
            "models": {
                "default": "@cf/meta/llama-2-7b-chat-int8",
                "smart": "@cf/mistral/mistral-7b-instruct-v0.1",
                "fast": "@cf/tinyllama/tinyllama-1.1b-chat-v1.0"
            }
        }
    
    @pytest.mark.skipif(
        not os.getenv("RUN_EXPENSIVE_TESTS"),
        reason="Set RUN_EXPENSIVE_TESTS=1 to run real LLM tests"
    )
    async def test_real_robot_conversation(self, real_ollama_config):
        """Test actual conversation between robot personalities with real LLMs."""
        from src.langgraph_supervisor import RobotSupervisor
        from src.agents.robot_agents import create_real_robot_agents
        
        # Create real agents with actual LLM connections
        agents = await create_real_robot_agents(real_ollama_config)
        
        supervisor = RobotSupervisor(
            agents=agents,
            config={
                "name": "RealRobotSupervisor",
                "timeout": 45,
                "use_real_llms": True
            }
        )
        
        # Ask a real question
        result = await supervisor.execute(
            "What is quantum computing and why is it exciting?"
        )
        
        # Verify we got real responses
        assert result["status"] == "success"
        assert len(result["responses"]) > 0
        
        # Check that response mentions quantum concepts
        full_response = " ".join(result["responses"])
        quantum_terms = ["quantum", "qubit", "superposition", "entanglement"]
        assert any(term in full_response.lower() for term in quantum_terms)
        
        # Verify timing is realistic for real LLM calls
        assert result["duration"] > 1.0  # Real calls take time
    
    @pytest.mark.skipif(
        not os.getenv("RUN_EXPENSIVE_TESTS"),
        reason="Set RUN_EXPENSIVE_TESTS=1 to run real LLM tests"
    )
    async def test_real_multi_robot_discussion(self, real_ollama_config):
        """Test real multi-robot discussion about a topic."""
        from src.langgraph_supervisor import RobotSupervisor
        from src.agents.robot_agents import create_real_robot_agents
        
        agents = await create_real_robot_agents(real_ollama_config)
        
        supervisor = RobotSupervisor(
            agents=agents,
            config={
                "name": "RealRobotSupervisor",
                "timeout": 60,
                "use_real_llms": True,
                "enable_multi_robot_chat": True
            }
        )
        
        # Start a multi-robot discussion
        result = await supervisor.execute_multi_robot_discussion(
            topic="How can we make learning math fun for kids?",
            robots=["RoboFriend", "RoboNerd", "RoboPirate"],
            rounds=2
        )
        
        # Verify all robots participated
        assert len(result["conversation"]) >= 6  # 3 robots * 2 rounds
        
        # Check each robot maintained their personality
        for message in result["conversation"]:
            if message["robot"] == "RoboFriend":
                assert any(word in message["text"].lower() 
                          for word in ["fun", "awesome", "great", "😊"])
            elif message["robot"] == "RoboNerd":
                assert any(word in message["text"].lower() 
                          for word in ["calculate", "formula", "equation", "🤓"])
            elif message["robot"] == "RoboPirate":
                assert any(word in message["text"].lower() 
                          for word in ["arr", "matey", "treasure", "🏴‍☠️"])
    
    async def test_real_trading_team_analysis(self, real_ollama_config):
        """Test real trading team analyzing a stock."""
        from src.supervisors.trading_supervisor import TradingSupervisor
        from src.verticals.trading.agents import create_trading_agents
        
        # Create real trading agents
        agents = await create_trading_agents(real_ollama_config)
        
        supervisor = TradingSupervisor(
            agents=agents,
            config={
                "name": "TradingSupervisor",
                "timeout": 60,
                "use_real_llms": True
            }
        )
        
        # Analyze a real stock
        result = await supervisor.analyze_stock("AAPL")
        
        # Verify we got analysis from each specialist
        assert "market_sentiment" in result
        assert "technical_analysis" in result
        assert "risk_assessment" in result
        assert "recommendation" in result
        
        # Check recommendations are sensible
        assert result["risk_assessment"]["position_size"] > 0
        assert result["risk_assessment"]["position_size"] <= 5  # Max 5% position
    
    async def test_real_payroll_processing(self, real_ollama_config):
        """Test real payroll team processing with actual calculations."""
        from src.supervisors.payroll_supervisor import PayrollSupervisor
        from src.verticals.payroll.agents import create_payroll_agents
        
        # Create real payroll agents
        agents = await create_payroll_agents(real_ollama_config)
        
        supervisor = PayrollSupervisor(
            agents=agents,
            config={
                "name": "PayrollSupervisor",
                "timeout": 45,
                "use_real_llms": True
            }
        )
        
        # Process a sample payroll
        test_employees = [
            {"id": "E001", "hours": 40, "rate": 25.00},
            {"id": "E002", "hours": 45, "rate": 30.00},  # Overtime
        ]
        
        result = await supervisor.process_payroll(
            employees=test_employees,
            pay_period="2024-01-01 to 2024-01-15"
        )
        
        # Verify calculations
        assert result["status"] == "success"
        assert len(result["processed_employees"]) == 2
        
        # Check overtime was calculated
        overtime_employee = next(e for e in result["processed_employees"] 
                               if e["id"] == "E002")
        assert overtime_employee["overtime_hours"] == 5
        assert overtime_employee["gross_pay"] > 40 * 30  # More than regular


class TestHybridMockAndReal:
    """Test mixing mocked and real components for efficiency."""
    
    async def test_mock_agents_real_supervisor(self):
        """Use mocked agents but real supervisor logic."""
        from src.langgraph_supervisor import RobotSupervisor
        from unittest.mock import Mock, AsyncMock
        
        # Mock agents for speed
        mock_agents = {
            "TestBot": Mock(
                execute=AsyncMock(return_value="Test response"),
                tools=["test_tool"]
            )
        }
        
        # But use real supervisor
        supervisor = RobotSupervisor(
            agents=mock_agents,
            config={
                "name": "HybridSupervisor",
                "timeout": 5
            }
        )
        
        result = await supervisor.execute("Test query")
        assert result["status"] == "success"


if __name__ == "__main__":
    # Run only the integration tests
    pytest.main([__file__, "-v", "-m", "integration"])