"""
Tests for KV Namespace integration.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime
import uuid


@pytest.fixture
def mock_kv_namespace():
    """Create a mock KV namespace for testing."""
    namespace = Mock()
    namespace.put = AsyncMock()
    namespace.get = AsyncMock()
    namespace.delete = AsyncMock()
    namespace.list = AsyncMock()
    return namespace


@pytest.mark.asyncio
class TestKVIntegration:
    """Test KV namespace integration for Robot Brain."""
    
    async def test_store_session_with_ttl(self, mock_kv_namespace):
        """Test storing session data with TTL."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        session_data = {
            "session_id": "test-session-789",
            "user_id": "user123",
            "start_time": datetime.now().isoformat(),
            "robots": ["friend", "nerd"],
            "context": {"theme": "education"}
        }
        
        # Act
        result = await client.store_session(
            session_id=session_data["session_id"],
            data=session_data,
            ttl=3600  # 1 hour
        )
        
        # Assert
        assert result["success"] is True
        assert result["key"] == f"session:{session_data['session_id']}"
        mock_kv_namespace.put.assert_called_once()
        # Verify TTL was passed
        call_args = mock_kv_namespace.put.call_args
        assert call_args[1]["expirationTtl"] == 3600
    
    async def test_retrieve_session_data(self, mock_kv_namespace):
        """Test retrieving session data from KV."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        session_id = "test-session-789"
        stored_data = {
            "session_id": session_id,
            "user_id": "user123",
            "start_time": datetime.now().isoformat(),
            "robots": ["friend", "nerd"]
        }
        
        # Mock KV response
        mock_kv_namespace.get.return_value = json.dumps(stored_data)
        
        # Act
        result = await client.get_session(session_id)
        
        # Assert
        assert result is not None
        assert result["session_id"] == session_id
        assert result["user_id"] == "user123"
        assert len(result["robots"]) == 2
        mock_kv_namespace.get.assert_called_with(f"session:{session_id}")
    
    async def test_store_robot_state(self, mock_kv_namespace):
        """Test storing robot state in KV."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        robot_state = {
            "robot_name": "zen",
            "last_active": datetime.now().isoformat(),
            "mood": "peaceful",
            "memory_context": [
                "User asked about meditation",
                "Discussed breathing techniques"
            ]
        }
        
        # Act
        result = await client.store_robot_state(
            robot_name=robot_state["robot_name"],
            state=robot_state
        )
        
        # Assert
        assert result["success"] is True
        assert result["key"] == f"robot:{robot_state['robot_name']}:state"
        mock_kv_namespace.put.assert_called_once()
    
    async def test_user_preferences(self, mock_kv_namespace):
        """Test storing and retrieving user preferences."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        user_id = "user456"
        preferences = {
            "favorite_robot": "pirate",
            "theme": "dark",
            "tools_enabled": ["email", "scraping", "calculate"],
            "language": "en"
        }
        
        # Test storing preferences
        result = await client.store_user_preferences(user_id, preferences)
        assert result["success"] is True
        
        # Mock retrieval
        mock_kv_namespace.get.return_value = json.dumps(preferences)
        
        # Test retrieving preferences
        retrieved = await client.get_user_preferences(user_id)
        assert retrieved is not None
        assert retrieved["favorite_robot"] == "pirate"
        assert "scraping" in retrieved["tools_enabled"]
    
    async def test_kv_expiration(self, mock_kv_namespace):
        """Test that expired keys return None."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        
        # Mock KV returning None for expired key
        mock_kv_namespace.get.return_value = None
        
        # Act
        result = await client.get_session("expired-session")
        
        # Assert
        assert result is None
        mock_kv_namespace.get.assert_called_with("session:expired-session")
    
    async def test_handle_kv_errors(self, mock_kv_namespace):
        """Test error handling for KV operations."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        
        # Mock KV error
        mock_kv_namespace.put.side_effect = Exception("KV namespace unavailable")
        
        # Act
        result = await client.store_session(
            session_id="error-session",
            data={"test": "data"}
        )
        
        # Assert
        assert result["success"] is False
        assert "error" in result
        assert "KV namespace unavailable" in result["error"]
    
    async def test_list_sessions(self, mock_kv_namespace):
        """Test listing all active sessions."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        
        # Mock KV list response
        mock_kv_namespace.list.return_value = {
            "keys": [
                {"name": "session:active1", "expiration": 1234567890},
                {"name": "session:active2", "expiration": 1234567891},
                {"name": "session:active3", "expiration": 1234567892}
            ]
        }
        
        # Act
        result = await client.list_active_sessions()
        
        # Assert
        assert len(result) == 3
        assert all(key.startswith("session:") for key in result)
        mock_kv_namespace.list.assert_called_with(prefix="session:")
    
    async def test_delete_session(self, mock_kv_namespace):
        """Test deleting a session from KV."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        session_id = "delete-me-session"
        
        # Act
        result = await client.delete_session(session_id)
        
        # Assert
        assert result["success"] is True
        assert result["deleted_key"] == f"session:{session_id}"
        mock_kv_namespace.delete.assert_called_with(f"session:{session_id}")
    
    async def test_batch_operations(self, mock_kv_namespace):
        """Test batch get operations for efficiency."""
        from src.cloudflare.kv_client import KVClient
        
        # Arrange
        client = KVClient(mock_kv_namespace)
        keys = ["session:1", "session:2", "session:3"]
        
        # Mock individual get responses
        mock_kv_namespace.get.side_effect = [
            json.dumps({"id": "1", "data": "session1"}),
            json.dumps({"id": "2", "data": "session2"}),
            None  # Third session doesn't exist
        ]
        
        # Act
        results = await client.batch_get(keys)
        
        # Assert
        assert len(results) == 3
        assert results[0] is not None
        assert results[1] is not None
        assert results[2] is None
        assert mock_kv_namespace.get.call_count == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])