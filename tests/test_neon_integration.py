"""
Tests for Neon PostgreSQL integration.
Following TDD - write tests first!
Based on our existing D1 tests but adapted for PostgreSQL.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime, timezone
import uuid
import asyncpg


@pytest.fixture
def mock_neon_connection():
    """Create a mock Neon connection for testing."""
    conn = AsyncMock(spec=asyncpg.Connection)
    return conn


@pytest.fixture
def mock_neon_pool():
    """Create a mock Neon connection pool for testing."""
    pool = AsyncMock(spec=asyncpg.Pool)
    return pool


@pytest.mark.asyncio
class TestNeonIntegration:
    """Test Neon database integration for Robot Brain."""
    
    async def test_store_conversation_in_neon(self, mock_neon_pool):
        """Test storing a conversation in Neon PostgreSQL."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        conversation_data = {
            "robot_personality": "friend",
            "user_message": "Hello robot!",
            "robot_response": "Hey there! So happy to chat with you!",
            "session_id": "test-session-123",
            "metadata": {"tool_used": None, "mood": "happy"}
        }
        
        # Mock the connection and query result
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": str(uuid.uuid4())})
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await client.store_conversation(conversation_data)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        mock_conn.fetchrow.assert_called_once()
        # Verify SQL query contains INSERT
        query = mock_conn.fetchrow.call_args[0][0]
        assert "INSERT INTO conversations" in query
    
    async def test_retrieve_conversation_by_id(self, mock_neon_pool):
        """Test retrieving a conversation by ID."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        conversation_id = str(uuid.uuid4())
        
        # Mock the connection and query result
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={
            "id": conversation_id,
            "robot_personality": "nerd",
            "user_message": "What is AI?",
            "robot_response": "Actually, AI stands for Artificial Intelligence...",
            "created_at": datetime.now(timezone.utc),
            "session_id": "test-session-456",
            "metadata": {"tool_used": "research"}
        })
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await client.get_conversation(conversation_id)
        
        # Assert
        assert result is not None
        assert result["id"] == conversation_id
        assert result["robot_personality"] == "nerd"
        assert "metadata" in result
        query = mock_conn.fetchrow.call_args[0][0]
        assert "SELECT * FROM conversations WHERE id = $1" in query
    
    async def test_query_conversations_by_robot(self, mock_neon_pool):
        """Test querying conversations by robot personality."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        robot_personality = "zen"
        
        # Mock the connection and query result
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {
                "id": "conv1",
                "robot_personality": "zen",
                "user_message": "I'm stressed",
                "robot_response": "Let's take a deep breath together...",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "conv2",
                "robot_personality": "zen",
                "user_message": "Help me relax",
                "robot_response": "Imagine a peaceful garden...",
                "created_at": datetime.now(timezone.utc)
            }
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        results = await client.query_by_robot(robot_personality, limit=10)
        
        # Assert
        assert len(results) == 2
        assert all(conv["robot_personality"] == "zen" for conv in results)
        query = mock_conn.fetch.call_args[0][0]
        # Check for key parts of the query (accounting for whitespace)
        assert "SELECT * FROM conversations" in query.replace("\n", " ")
        assert "WHERE robot_personality = $1" in query
        assert "ORDER BY created_at DESC" in query
        assert "LIMIT $2" in query
    
    async def test_store_robot_interaction(self, mock_neon_pool):
        """Test storing multi-robot chat interactions."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
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
        
        # Mock the connection and query result
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": str(uuid.uuid4())})
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await client.store_robot_interaction(interaction_data)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        query = mock_conn.fetchrow.call_args[0][0]
        assert "INSERT INTO robot_interactions" in query
    
    async def test_store_tool_usage(self, mock_neon_pool):
        """Test tracking tool usage in Neon."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        tool_usage = {
            "tool_name": "email",
            "robot_personality": "friend",
            "input_params": {"to": "test@example.com", "subject": "Hello!"},
            "output_result": {"status": "success", "message_id": "123"},
            "status": "success"
        }
        
        # Mock the connection and query result
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": str(uuid.uuid4())})
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await client.track_tool_usage(tool_usage)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        query = mock_conn.fetchrow.call_args[0][0]
        assert "INSERT INTO tool_usage" in query
    
    async def test_handle_neon_errors(self, mock_neon_pool):
        """Test error handling for Neon operations."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        
        # Mock connection error
        mock_neon_pool.acquire.side_effect = asyncpg.PostgresConnectionError("Connection failed")
        
        # Act
        result = await client.store_conversation({
            "robot_personality": "friend",
            "user_message": "Hello",
            "robot_response": "Hi!"
        })
        
        # Assert
        assert result["success"] is False
        assert "error" in result
        assert "Connection failed" in result["error"]
    
    async def test_batch_insert_conversations(self, mock_neon_pool):
        """Test batch inserting multiple conversations."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
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
        
        # Mock the connection and batch insert
        mock_conn = AsyncMock()
        # Mock the transaction context manager
        mock_transaction = AsyncMock()
        mock_transaction.__aenter__ = AsyncMock(return_value=None)
        mock_transaction.__aexit__ = AsyncMock(return_value=None)
        mock_conn.transaction = Mock(return_value=mock_transaction)
        mock_conn.execute = AsyncMock()
        
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        results = await client.batch_store_conversations(conversations)
        
        # Assert
        assert len(results) == 2
        assert all(r["success"] for r in results)
        assert all("id" in r for r in results)
        # Verify execute was called for each conversation
        assert mock_conn.execute.call_count == len(conversations)
    
    async def test_connection_pool_management(self, mock_neon_pool):
        """Test proper connection pool management."""
        from src.neon.neon_client import NeonClient
        
        # Arrange
        client = NeonClient(pool=mock_neon_pool)
        
        # Mock successful operations
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": str(uuid.uuid4())})
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act - perform multiple operations
        for _ in range(5):
            await client.store_conversation({
                "robot_personality": "friend",
                "user_message": "Test",
                "robot_response": "Response"
            })
        
        # Assert - verify pool was used correctly
        assert mock_neon_pool.acquire.call_count == 5
        # Verify connections were properly released (context manager used)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])