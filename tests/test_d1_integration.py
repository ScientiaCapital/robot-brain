"""
Tests for D1 Database integration.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime
import uuid


@pytest.fixture
def mock_d1_client():
    """Create a mock D1 client for testing."""
    client = Mock()
    client.prepare = Mock()
    client.batch = Mock()
    return client


@pytest.mark.asyncio
class TestD1Integration:
    """Test D1 database integration for Robot Brain."""
    
    async def test_store_conversation_in_d1(self, mock_d1_client):
        """Test storing a conversation in D1 database."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        conversation_data = {
            "robot_personality": "friend",
            "user_message": "Hello robot!",
            "robot_response": "Hey there! So happy to chat with you!",
            "session_id": "test-session-123",
            "metadata": {"tool_used": None, "mood": "happy"}
        }
        
        # Mock the D1 response
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={
            "success": True,
            "meta": {"changes": 1}
        })
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        result = await client.store_conversation(conversation_data)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        mock_d1_client.prepare.assert_called_once()
        assert "INSERT INTO conversations" in mock_d1_client.prepare.call_args[0][0]
    
    async def test_retrieve_conversation_by_id(self, mock_d1_client):
        """Test retrieving a conversation by ID."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        conversation_id = str(uuid.uuid4())
        
        # Mock the D1 response
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.first = AsyncMock(return_value={
            "id": conversation_id,
            "robot_personality": "nerd",
            "user_message": "What is AI?",
            "robot_response": "Actually, AI stands for Artificial Intelligence...",
            "created_at": datetime.utcnow().isoformat(),
            "session_id": "test-session-456",
            "metadata": json.dumps({"tool_used": "research"})
        })
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        result = await client.get_conversation(conversation_id)
        
        # Assert
        assert result is not None
        assert result["id"] == conversation_id
        assert result["robot_personality"] == "nerd"
        assert "metadata" in result
        mock_d1_client.prepare.assert_called_with(
            "SELECT * FROM conversations WHERE id = ?"
        )
    
    async def test_query_conversations_by_robot(self, mock_d1_client):
        """Test querying conversations by robot personality."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        robot_personality = "zen"
        
        # Mock the D1 response
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.all = AsyncMock(return_value={
            "results": [
                {
                    "id": "conv1",
                    "robot_personality": "zen",
                    "user_message": "I'm stressed",
                    "robot_response": "Let's take a deep breath together...",
                    "created_at": datetime.utcnow().isoformat()
                },
                {
                    "id": "conv2",
                    "robot_personality": "zen",
                    "user_message": "Help me relax",
                    "robot_response": "Imagine a peaceful garden...",
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        })
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        results = await client.query_by_robot(robot_personality, limit=10)
        
        # Assert
        assert len(results) == 2
        assert all(conv["robot_personality"] == "zen" for conv in results)
        mock_d1_client.prepare.assert_called_with(
            "SELECT * FROM conversations WHERE robot_personality = ? ORDER BY created_at DESC LIMIT ?"
        )
    
    async def test_store_robot_interaction(self, mock_d1_client):
        """Test storing multi-robot chat interactions."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        interaction_data = {
            "topic": "What is the meaning of life?",
            "interaction_type": "discussion",
            "participants": ["friend", "nerd", "zen"],
            "responses": [
                {"robot": "friend", "response": "Life is about friendship and fun!"},
                {"robot": "nerd", "response": "Actually, from a philosophical perspective..."},
                {"robot": "zen", "response": "The meaning flows like water..."}
            ]
        }
        
        # Mock the D1 response
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={
            "success": True,
            "meta": {"changes": 1}
        })
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        result = await client.store_robot_interaction(interaction_data)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        mock_d1_client.prepare.assert_called_once()
        assert "INSERT INTO robot_interactions" in mock_d1_client.prepare.call_args[0][0]
    
    async def test_store_tool_usage(self, mock_d1_client):
        """Test tracking tool usage in D1."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        tool_usage = {
            "tool_name": "email",
            "robot_personality": "friend",
            "input_params": {"to": "test@example.com", "subject": "Hello!"},
            "output_result": {"status": "success", "message_id": "123"},
            "status": "success"
        }
        
        # Mock the D1 response
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(return_value={
            "success": True,
            "meta": {"changes": 1}
        })
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        result = await client.track_tool_usage(tool_usage)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        mock_d1_client.prepare.assert_called_once()
        assert "INSERT INTO tool_usage" in mock_d1_client.prepare.call_args[0][0]
    
    async def test_handle_d1_errors(self, mock_d1_client):
        """Test error handling for D1 operations."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        
        # Mock D1 error
        mock_statement = Mock()
        mock_statement.bind = Mock(return_value=mock_statement)
        mock_statement.run = AsyncMock(side_effect=Exception("D1 connection failed"))
        mock_d1_client.prepare.return_value = mock_statement
        
        # Act
        result = await client.store_conversation({
            "robot_personality": "friend",
            "user_message": "Hello",
            "robot_response": "Hi!"
        })
        
        # Assert
        assert result["success"] is False
        assert "error" in result
        assert "D1 connection failed" in result["error"]
    
    async def test_batch_insert_conversations(self, mock_d1_client):
        """Test batch inserting multiple conversations."""
        from src.cloudflare.d1_client import D1Client
        
        # Arrange
        client = D1Client(mock_d1_client)
        conversations = [
            {
                "robot_personality": "friend",
                "user_message": "Hi!",
                "robot_response": "Hello there!",
                "session_id": "batch-123"
            },
            {
                "robot_personality": "nerd",
                "user_message": "Explain quantum computing",
                "robot_response": "Actually, quantum computing uses qubits...",
                "session_id": "batch-123"
            }
        ]
        
        # Mock the D1 batch response - it needs to be a coroutine
        mock_d1_client.batch = AsyncMock(return_value=[
            {"success": True, "meta": {"changes": 1}},
            {"success": True, "meta": {"changes": 1}}
        ])
        
        # Act
        results = await client.batch_store_conversations(conversations)
        
        # Assert
        assert len(results) == 2
        assert all(r["success"] for r in results)
        # Also verify that id is included
        assert all("id" in r for r in results)
        mock_d1_client.batch.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])