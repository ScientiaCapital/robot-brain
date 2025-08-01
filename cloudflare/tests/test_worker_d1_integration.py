"""
D1 Worker Integration Tests
Following TDD RED Phase - Write failing tests FIRST
Tests for Cloudflare Worker D1 database integration
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import uuid

# Import the Worker handler (to be implemented)
from cloudflare.worker import handle_request


class TestWorkerD1Integration:
    """Test D1 database integration in Cloudflare Worker"""
    
    @pytest.fixture
    def mock_env(self):
        """Mock Cloudflare Worker environment with D1 binding"""
        env = Mock()
        
        # Mock D1 database
        env.DB = Mock()
        env.DB.prepare = Mock()
        env.DB.batch = Mock()
        
        # Mock KV and Vectorize (for complete env)
        env.ROBOT_MEMORY = Mock()
        env.VECTORIZE = Mock()
        env.AI = Mock()
        
        return env
    
    @pytest.fixture
    def mock_request(self):
        """Mock incoming request"""
        request = Mock()
        request.method = "POST"
        request.headers = {"Content-Type": "application/json"}
        request.json = AsyncMock()
        return request
    
    @pytest.mark.asyncio
    async def test_worker_can_store_conversation(self, mock_env, mock_request):
        """Test that worker can store a conversation in D1"""
        # Arrange
        conversation_data = {
            "action": "store_conversation",
            "data": {
                "robot_personality": "friend",
                "user_message": "Hello robot!",
                "robot_response": "Hey there! So happy to chat!",
                "session_id": "test-session-123"
            }
        }
        mock_request.json.return_value = conversation_data
        
        # Mock D1 prepare and run
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={"success": True})
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert "id" in response_data
        
        # Verify D1 was called correctly
        mock_env.DB.prepare.assert_called_once_with(
            "INSERT INTO conversations (id, robot_personality, user_message, robot_response, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        mock_statement.bind.assert_called_once()
        mock_statement.run.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_worker_can_retrieve_conversations_by_robot(self, mock_env, mock_request):
        """Test that worker can retrieve conversations for a specific robot"""
        # Arrange
        query_data = {
            "action": "get_conversations",
            "data": {
                "robot_personality": "nerd",
                "limit": 10
            }
        }
        mock_request.json.return_value = query_data
        
        # Mock D1 response
        mock_conversations = {
            "results": [
                {
                    "id": "conv-1",
                    "robot_personality": "nerd",
                    "user_message": "What is machine learning?",
                    "robot_response": "Machine learning is a subset of AI...",
                    "created_at": "2025-08-01T10:00:00Z"
                },
                {
                    "id": "conv-2",
                    "robot_personality": "nerd",
                    "user_message": "Explain neural networks",
                    "robot_response": "Neural networks are computing systems...",
                    "created_at": "2025-08-01T11:00:00Z"
                }
            ]
        }
        
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.all = AsyncMock(return_value=mock_conversations)
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert "conversations" in response_data
        assert len(response_data["conversations"]) == 2
        assert all(conv["robot_personality"] == "nerd" for conv in response_data["conversations"])
        
        # Verify D1 query
        mock_env.DB.prepare.assert_called_once_with(
            "SELECT * FROM conversations WHERE robot_personality = ? ORDER BY created_at DESC LIMIT ?"
        )
        mock_statement.bind.assert_called_once_with("nerd", 10)
    
    @pytest.mark.asyncio
    async def test_worker_handles_d1_errors_gracefully(self, mock_env, mock_request):
        """Test that worker handles D1 database errors gracefully"""
        # Arrange
        conversation_data = {
            "action": "store_conversation",
            "data": {
                "robot_personality": "pirate",
                "user_message": "Ahoy!",
                "robot_response": "Ahoy matey!",
                "session_id": "test-session-456"
            }
        }
        mock_request.json.return_value = conversation_data
        
        # Mock D1 error
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(side_effect=Exception("D1 database error"))
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 500
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "error" in response_data
        assert "database" in response_data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_worker_can_store_robot_interaction(self, mock_env, mock_request):
        """Test that worker can store multi-robot interactions"""
        # Arrange
        interaction_data = {
            "action": "store_interaction",
            "data": {
                "topic": "Space exploration",
                "interaction_type": "debate",
                "participants": ["nerd", "pirate", "friend"],
                "responses": [
                    {"robot": "nerd", "message": "Space is fascinating!"},
                    {"robot": "pirate", "message": "Arr, the cosmic seas!"},
                    {"robot": "friend", "message": "Space friends are the best!"}
                ]
            }
        }
        mock_request.json.return_value = interaction_data
        
        # Mock D1 prepare and run
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={"success": True})
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert "interaction_id" in response_data
        
        # Verify D1 was called for robot_interactions table
        mock_env.DB.prepare.assert_called_once_with(
            "INSERT INTO robot_interactions (id, topic, interaction_type, participants, responses, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
    
    @pytest.mark.asyncio
    async def test_worker_can_query_conversations_by_session(self, mock_env, mock_request):
        """Test that worker can retrieve conversations by session ID"""
        # Arrange
        query_data = {
            "action": "get_session_conversations",
            "data": {
                "session_id": "test-session-789"
            }
        }
        mock_request.json.return_value = query_data
        
        # Mock D1 response
        mock_conversations = {
            "results": [
                {
                    "id": "conv-1",
                    "robot_personality": "zen",
                    "user_message": "I need peace",
                    "robot_response": "Peace comes from within...",
                    "session_id": "test-session-789",
                    "created_at": "2025-08-01T10:00:00Z"
                }
            ]
        }
        
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.all = AsyncMock(return_value=mock_conversations)
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert "conversations" in response_data
        assert len(response_data["conversations"]) == 1
        assert response_data["conversations"][0]["session_id"] == "test-session-789"
        
        # Verify D1 used index for session query
        mock_env.DB.prepare.assert_called_once_with(
            "SELECT * FROM conversations WHERE session_id = ? ORDER BY created_at ASC"
        )
    
    @pytest.mark.asyncio
    async def test_worker_can_track_tool_usage(self, mock_env, mock_request):
        """Test that worker can track tool usage in D1"""
        # Arrange
        tool_usage_data = {
            "action": "track_tool_usage",
            "data": {
                "tool_name": "email",
                "robot_personality": "friend",
                "input_params": {"to": "test@example.com", "subject": "Hello!"},
                "output_result": {"success": True, "message_id": "123"},
                "status": "success"
            }
        }
        mock_request.json.return_value = tool_usage_data
        
        # Mock D1 prepare and run
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={"success": True})
        mock_env.DB.prepare.return_value = mock_statement
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        
        # Verify tool_usage table insert
        mock_env.DB.prepare.assert_called_once_with(
            "INSERT INTO tool_usage (id, tool_name, robot_personality, input_params, output_result, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
    
    @pytest.mark.asyncio
    async def test_worker_validates_required_fields(self, mock_env, mock_request):
        """Test that worker validates required fields for D1 operations"""
        # Arrange - Missing required fields
        invalid_data = {
            "action": "store_conversation",
            "data": {
                "robot_personality": "drama",
                # Missing user_message and robot_response
            }
        }
        mock_request.json.return_value = invalid_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "error" in response_data
        assert "required" in response_data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_worker_handles_batch_operations(self, mock_env, mock_request):
        """Test that worker can handle batch D1 operations"""
        # Arrange
        batch_data = {
            "action": "batch_store_conversations",
            "data": {
                "conversations": [
                    {
                        "robot_personality": "friend",
                        "user_message": "Hi!",
                        "robot_response": "Hello there!",
                        "session_id": "batch-session-1"
                    },
                    {
                        "robot_personality": "nerd",
                        "user_message": "Explain AI",
                        "robot_response": "AI is...",
                        "session_id": "batch-session-1"
                    }
                ]
            }
        }
        mock_request.json.return_value = batch_data
        
        # Mock D1 batch
        mock_env.DB.batch = AsyncMock(return_value=[
            {"success": True},
            {"success": True}
        ])
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["stored_count"] == 2
        
        # Verify batch was called
        mock_env.DB.batch.assert_called_once()