"""
Advanced LangGraph Supervisor Tests
🔴 RED Phase: Write failing tests for enhanced multi-agent coordination
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from src.langgraph_supervisor import RobotSupervisor, DelegationStrategy


class TestLangGraphSupervisorAdvanced:
    """Advanced tests for LangGraph supervisor functionality."""
    
    @pytest.fixture
    def mock_agents(self):
        """Create mock agents for testing."""
        agents = {}
        
        # Create robot personality agents
        for robot in ["RoboFriend", "RoboNerd", "RoboZen", "RoboPirate", "RoboDrama"]:
            mock_agent = AsyncMock()
            mock_agent.execute = AsyncMock(return_value=f"{robot} response")
            agents[robot] = mock_agent
            
        # Create professional agents
        for agent in ["MarketAnalyst", "QuantResearcher", "RiskManager"]:
            mock_agent = AsyncMock()
            mock_agent.execute = AsyncMock(return_value=f"{agent} analysis")
            agents[agent] = mock_agent
            
        return agents
    
    @pytest.fixture
    def advanced_supervisor(self, mock_agents):
        """Create supervisor with advanced configuration."""
        config = {
            "name": "AdvancedSupervisor",
            "timeout": 30,
            "max_parallel_agents": 3,
            "delegation_strategy": "skill_based",
            "memory_enabled": True,
            "conversation_history_limit": 50
        }
        return RobotSupervisor(mock_agents, config)

    @pytest.mark.asyncio
    async def test_skill_based_agent_selection(self, advanced_supervisor, mock_agents):
        """
        🔴 RED: Test skill-based agent selection for specific domains.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Domain-specific skill mapping
        - Context-aware agent selection
        - Multi-criteria agent ranking
        """
        # Test math/calculation queries -> RoboNerd
        result = await advanced_supervisor.execute("Calculate the compound interest on $1000")
        
        # Should select RoboNerd based on calculation keywords
        mock_agents["RoboNerd"].execute.assert_called_once()
        assert "RoboNerd" in result["agents_involved"]
        
        # Test creative/storytelling queries -> RoboDrama + RoboPirate
        mock_agents["RoboNerd"].execute.reset_mock()
        result = await advanced_supervisor.execute("Tell me an exciting treasure hunt story")
        
        # Should select both RoboDrama and RoboPirate for creative collaboration
        assert len(result["agents_involved"]) >= 2
        assert "RoboDrama" in result["agents_involved"] or "RoboPirate" in result["agents_involved"]
        
        # Test trading queries -> Professional agents
        result = await advanced_supervisor.execute("Analyze AAPL stock for trading opportunity")
        
        # Should select MarketAnalyst and QuantResearcher
        professional_agents = ["MarketAnalyst", "QuantResearcher", "RiskManager"]
        selected_professional = [agent for agent in result["agents_involved"] if agent in professional_agents]
        assert len(selected_professional) >= 1, "Should select at least one professional trading agent"

    @pytest.mark.asyncio
    async def test_parallel_robot_coordination(self, advanced_supervisor, mock_agents):
        """
        🔴 RED: Test parallel execution with proper coordination and timeout handling.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Parallel execution with result aggregation
        - Timeout handling per agent
        - Result synchronization and ordering
        """
        # Configure agents to simulate different response times
        mock_agents["RoboFriend"].execute = AsyncMock(return_value="Friend advice")
        mock_agents["RoboNerd"].execute = AsyncMock(return_value="Nerd analysis") 
        mock_agents["RoboZen"].execute = AsyncMock(return_value="Zen wisdom")
        
        # Add delays to simulate realistic execution times
        async def delayed_friend_response(*args):
            await asyncio.sleep(0.1)
            return "Delayed friend advice"
            
        async def delayed_nerd_response(*args):
            await asyncio.sleep(0.2)
            return "Delayed nerd analysis"
            
        mock_agents["RoboFriend"].execute = delayed_friend_response
        mock_agents["RoboNerd"].execute = delayed_nerd_response
        
        # Test parallel execution
        start_time = asyncio.get_event_loop().time()
        result = await advanced_supervisor.execute(
            "Give me advice on learning programming",
            parallel=True,
            specific_agents=["RoboFriend", "RoboNerd", "RoboZen"]
        )
        end_time = asyncio.get_event_loop().time()
        
        # Should complete in parallel (less than sequential time)
        assert end_time - start_time < 0.5, "Parallel execution should be faster than sequential"
        
        # Should have responses from all three agents
        assert len(result["responses"]) == 3
        assert len(result["agents_involved"]) == 3
        
        # Should maintain response ordering or provide metadata
        assert "workflow" in result, "Should track execution workflow"

    @pytest.mark.asyncio
    async def test_agent_handoff_mechanism(self, advanced_supervisor, mock_agents):
        """
        🔴 RED: Test agent-to-agent handoff with task delegation.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Handoff detection and processing
        - Task context preservation during handoffs
        - Chained agent execution workflows
        """
        # Configure RoboFriend to hand off to RoboNerd for technical questions
        mock_agents["RoboFriend"].execute = AsyncMock(return_value={
            "response": "That's a technical question! Let me get RoboNerd to help.",
            "handoff_to": "RoboNerd", 
            "handoff_task": "Explain the technical details of machine learning"
        })
        
        mock_agents["RoboNerd"].execute = AsyncMock(return_value={
            "response": "Machine learning uses algorithms to find patterns in data..."
        })
        
        # Execute query that triggers handoff
        result = await advanced_supervisor.execute("How does machine learning work?")
        
        # Should execute both agents in sequence
        assert len(result["agents_involved"]) == 2
        assert "RoboFriend" in result["agents_involved"]
        assert "RoboNerd" in result["agents_involved"]
        
        # Should track handoff in workflow
        assert "workflow" in result
        handoff_events = [step for step in result["workflow"] if step.get("type") == "handoff"]
        assert len(handoff_events) >= 1, "Should record handoff events"
        
        # Should preserve context in handoff
        handoff = handoff_events[0]
        assert handoff["from"] == "RoboFriend"
        assert handoff["to"] == "RoboNerd"
        assert "technical details" in handoff["task"].lower()

    @pytest.mark.asyncio
    async def test_conversation_memory_persistence(self, advanced_supervisor, mock_agents):
        """
        🔴 RED: Test conversation memory with Neon PostgreSQL integration.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Neon database integration for conversation history
        - Context-aware query enhancement
        - Memory retrieval and injection
        """
        # Set up mock session manager on the supervisor instance
        mock_session = AsyncMock()
        mock_session.get_conversation_history = AsyncMock(return_value=[
            {"role": "user", "content": "My name is Alice", "timestamp": "2025-01-01T10:00:00"},
            {"role": "assistant", "content": "Nice to meet you Alice!", "timestamp": "2025-01-01T10:00:01"}
        ])
        mock_session.store_interaction = AsyncMock()
        
        # Set the session manager on the supervisor
        advanced_supervisor.session_manager = mock_session
        
        # Execute query that should benefit from memory
        result = await advanced_supervisor.execute("What's my name?")
        
        # Should retrieve conversation history
        mock_session.get_conversation_history.assert_called_once()
        
        # Should inject context into agent query
        # The query sent to agent should include context about Alice
        executed_query = mock_agents[result["agents_involved"][0]].execute.call_args[0][0]
        assert "Alice" in executed_query, "Should inject conversation context"
        
        # Should store new conversation turn
        mock_session.store_interaction.assert_called()

    @pytest.mark.asyncio
    async def test_multi_robot_discussion_flow(self, advanced_supervisor, mock_agents):
        """
        🔴 RED: Test multi-robot collaborative discussions.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Discussion orchestration logic
        - Context building between robot turns
        - Discussion quality assessment
        """
        # Configure robots with distinct responses
        responses = {
            "RoboFriend": "I think programming is about helping people solve problems!",
            "RoboNerd": "Programming involves algorithms, data structures, and computational thinking.",
            "RoboZen": "Code is like poetry - it should be simple, elegant, and purposeful."
        }
        
        for robot, response in responses.items():
            mock_agents[robot].execute = AsyncMock(return_value=response)
        
        # Execute multi-robot discussion
        result = await advanced_supervisor.execute_multi_robot_discussion(
            topic="What is the essence of programming?",
            robots=["RoboFriend", "RoboNerd", "RoboZen"],
            rounds=2
        )
        
        # Should have conversation structure
        assert "conversation" in result
        assert len(result["conversation"]) == 6  # 3 robots × 2 rounds
        
        # Should build context between turns
        conversation = result["conversation"]
        
        # Second round responses should reference earlier discussion
        second_round_messages = [msg for msg in conversation if msg["round"] == 2]
        
        # At least one robot should reference previous discussion
        context_aware_responses = 0
        for msg in second_round_messages:
            # The query sent to robots in round 2 should include previous discussion context
            robot_name = msg["robot"]
            call_args = mock_agents[robot_name].execute.call_args_list[-1][0][0]
            if "Previous discussion:" in call_args:
                context_aware_responses += 1
                
        assert context_aware_responses >= 1, "Should provide discussion context in later rounds"
        
        # Should track discussion quality
        assert result["status"] == "success"


# Additional test for error scenarios
class TestLangGraphSupervisorErrorHandling:
    """Test error handling and recovery scenarios."""
    
    @pytest.mark.asyncio
    async def test_agent_failure_recovery(self):
        """
        🔴 RED: Test graceful handling of agent failures with fallback strategies.
        
        This test should FAIL because the supervisor doesn't yet have:
        - Agent failure detection
        - Automatic fallback agent selection
        - Partial success handling
        """
        # Create agents where some fail
        agents = {
            "WorkingAgent": AsyncMock(),
            "FailingAgent": AsyncMock(),
            "BackupAgent": AsyncMock()
        }
        
        agents["WorkingAgent"].execute = AsyncMock(return_value="Success response")
        agents["FailingAgent"].execute = AsyncMock(side_effect=Exception("Agent crashed"))
        agents["BackupAgent"].execute = AsyncMock(return_value="Backup response")
        
        config = {"name": "FailureTestSupervisor", "enable_fallback": True}
        supervisor = RobotSupervisor(agents, config)
        
        # Execute with failing agent
        result = await supervisor.execute(
            "Test query",
            specific_agents=["WorkingAgent", "FailingAgent", "BackupAgent"]
        )
        
        # Should handle partial success
        assert result["status"] in ["success", "partial_success"]
        assert len(result["responses"]) >= 1  # At least working agent responded
        assert len(result["errors"]) >= 1  # Should record the failure
        
        # Should not crash the entire execution
        assert "Agent crashed" in str(result["errors"])