"""
Tests for Neon session management using JSONB.
Replacing legacy system KV with PostgreSQL JSONB storage.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, AsyncMock
import json
from datetime import datetime, timedelta, timezone
import uuid
import asyncpg


@pytest.fixture
def mock_neon_pool():
    """Create a mock Neon connection pool for testing."""
    pool = AsyncMock(spec=asyncpg.Pool)
    return pool


@pytest.mark.asyncio
class TestNeonSessions:
    """Test session management using Neon PostgreSQL JSONB."""
    
    async def test_store_session_with_ttl(self, mock_neon_pool):
        """Test storing a session with TTL expiration."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        session_key = "session:test-123"
        session_data = {
            "user_id": "user-456",
            "robot_personality": "friend",
            "conversation_count": 5,
            "last_interaction": datetime.now(timezone.utc).isoformat()
        }
        ttl_seconds = 3600  # 1 hour
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.set_session(session_key, session_data, ttl_seconds)
        
        # Assert
        assert result["success"] is True
        mock_conn.execute.assert_called_once()
        query = mock_conn.execute.call_args[0][0]
        assert "INSERT INTO robot_memory" in query
        assert "ON CONFLICT (key) DO UPDATE" in query  # Upsert pattern
    
    async def test_retrieve_session_data(self, mock_neon_pool):
        """Test retrieving session data."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        session_key = "session:test-123"
        expected_data = {
            "user_id": "user-456",
            "robot_personality": "nerd",
            "conversation_count": 10
        }
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={
            "key": session_key,
            "value": expected_data,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)
        })
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.get_session(session_key)
        
        # Assert
        assert result is not None
        assert result["user_id"] == "user-456"
        assert result["robot_personality"] == "nerd"
        query = mock_conn.fetchrow.call_args[0][0]
        # Check for key parts of the query
        assert "SELECT value FROM robot_memory" in query
        assert "WHERE key = $1" in query
        assert "AND (expires_at IS NULL OR expires_at > NOW())" in query
    
    async def test_store_robot_state(self, mock_neon_pool):
        """Test storing robot state in JSONB."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        state_key = "robot_state:friend:session-789"
        robot_state = {
            "personality": "friend",
            "mood": "cheerful",
            "context": ["talked about weather", "shared a joke"],
            "tools_used": ["jokes", "encouragement"]
        }
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.set_robot_state(state_key, robot_state)
        
        # Assert
        assert result["success"] is True
        mock_conn.execute.assert_called_once()
    
    async def test_user_preferences_storage(self, mock_neon_pool):
        """Test storing and retrieving user preferences."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        user_key = "user_prefs:user-123"
        preferences = {
            "favorite_robot": "zen",
            "theme": "dark",
            "language": "en",
            "notifications": True
        }
        
        # Mock the connection for set
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={
            "key": user_key,
            "value": preferences,
            "expires_at": None  # No expiration for user prefs
        })
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        set_result = await manager.set_user_preferences(user_key, preferences)
        get_result = await manager.get_user_preferences(user_key)
        
        # Assert
        assert set_result["success"] is True
        assert get_result == preferences
    
    async def test_session_expiration(self, mock_neon_pool):
        """Test that expired sessions are not returned."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        session_key = "session:expired-123"
        
        # Mock the connection - return None for expired session
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.get_session(session_key)
        
        # Assert
        assert result is None
        query = mock_conn.fetchrow.call_args[0][0]
        assert "expires_at > NOW()" in query
    
    async def test_handle_session_errors(self, mock_neon_pool):
        """Test error handling for session operations."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        
        # Mock connection error
        mock_neon_pool.acquire.side_effect = asyncpg.PostgresConnectionError("Connection failed")
        
        # Act
        result = await manager.set_session("test-key", {"data": "test"}, 3600)
        
        # Assert
        assert result["success"] is False
        assert "error" in result
    
    async def test_list_active_sessions(self, mock_neon_pool):
        """Test listing all active sessions."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {"key": "session:123", "value": {"user": "A"}, "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)},
            {"key": "session:456", "value": {"user": "B"}, "expires_at": datetime.now(timezone.utc) + timedelta(hours=2)}
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        sessions = await manager.list_active_sessions()
        
        # Assert
        assert len(sessions) == 2
        assert all("key" in s for s in sessions)
        query = mock_conn.fetch.call_args[0][0]
        # Check for key parts of the query
        assert "SELECT * FROM robot_memory" in query
        assert "WHERE key LIKE 'session:%'" in query
        assert "AND (expires_at IS NULL OR expires_at > NOW())" in query
    
    async def test_delete_session(self, mock_neon_pool):
        """Test deleting a session."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        session_key = "session:to-delete-123"
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(return_value="DELETE 1")
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.delete_session(session_key)
        
        # Assert
        assert result["success"] is True
        assert result["deleted"] is True
        query = mock_conn.execute.call_args[0][0]
        assert "DELETE FROM robot_memory WHERE key = $1" in query
    
    async def test_batch_get_sessions(self, mock_neon_pool):
        """Test batch getting multiple sessions."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        keys = ["session:123", "session:456", "session:789"]
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {"key": "session:123", "value": {"data": "A"}},
            {"key": "session:456", "value": {"data": "B"}}
            # Note: session:789 is missing (expired or doesn't exist)
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        results = await manager.batch_get_sessions(keys)
        
        # Assert
        assert len(results) == 3
        assert results["session:123"] == {"data": "A"}
        assert results["session:456"] == {"data": "B"}
        assert results["session:789"] is None
        query = mock_conn.fetch.call_args[0][0]
        # Check for key parts of the query
        assert "SELECT key, value FROM robot_memory" in query
        assert "WHERE key = ANY($1)" in query
        assert "AND (expires_at IS NULL OR expires_at > NOW())" in query
    
    async def test_cleanup_expired_sessions(self, mock_neon_pool):
        """Test cleanup of expired sessions."""
        from src.neon.session_manager import SessionManager
        
        # Arrange
        manager = SessionManager(pool=mock_neon_pool)
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(return_value="DELETE 5")
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.cleanup_expired_sessions()
        
        # Assert
        assert result["success"] is True
        assert result["deleted_count"] == 5
        query = mock_conn.execute.call_args[0][0]
        assert "DELETE FROM robot_memory WHERE expires_at < NOW()" in query


if __name__ == "__main__":
    pytest.main([__file__, "-v"])