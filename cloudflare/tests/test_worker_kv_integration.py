"""
KV Worker Integration Tests
Following TDD RED Phase - Write failing tests FIRST
Tests for Cloudflare Worker KV namespace integration
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
import uuid

# Import the Worker handler (to be implemented)
from cloudflare.worker import handle_request


class TestWorkerKVIntegration:
    """Test KV namespace integration in Cloudflare Worker"""
    
    @pytest.fixture
    def mock_env(self):
        """Mock Cloudflare Worker environment with KV binding"""
        env = Mock()
        
        # Mock KV namespace
        env.ROBOT_MEMORY = Mock()
        env.ROBOT_MEMORY.put = AsyncMock()
        env.ROBOT_MEMORY.get = AsyncMock()
        env.ROBOT_MEMORY.delete = AsyncMock()
        env.ROBOT_MEMORY.list = AsyncMock()
        
        # Mock other bindings for complete env
        env.DB = Mock()
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
    async def test_worker_can_store_session_with_ttl(self, mock_env, mock_request):
        """Test that worker can store session data with TTL in KV"""
        # Arrange
        session_data = {
            "action": "store_session",
            "data": {
                "session_id": "test-session-001",
                "user_id": "user123",
                "robots": ["friend", "nerd"],
                "context": {"topic": "science"},
                "ttl": 3600  # 1 hour
            }
        }
        mock_request.json.return_value = session_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["session_id"] == "test-session-001"
        
        # Verify KV put was called with TTL
        mock_env.ROBOT_MEMORY.put.assert_called_once()
        call_args = mock_env.ROBOT_MEMORY.put.call_args
        assert call_args[0][0] == "session:test-session-001"
        stored_data = json.loads(call_args[0][1])
        assert stored_data["user_id"] == "user123"
        assert stored_data["robots"] == ["friend", "nerd"]
        assert call_args[1]["expirationTtl"] == 3600
    
    @pytest.mark.asyncio
    async def test_worker_can_retrieve_session_data(self, mock_env, mock_request):
        """Test that worker can retrieve session data from KV"""
        # Arrange
        get_session_data = {
            "action": "get_session",
            "data": {
                "session_id": "test-session-002"
            }
        }
        mock_request.json.return_value = get_session_data
        
        # Mock KV get response
        stored_session = {
            "user_id": "user456",
            "robots": ["zen", "pirate"],
            "context": {"mood": "relaxed"},
            "start_time": "2025-08-01T10:00:00Z"
        }
        mock_env.ROBOT_MEMORY.get.return_value = json.dumps(stored_session)
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["session"]["user_id"] == "user456"
        assert response_data["session"]["robots"] == ["zen", "pirate"]
        
        # Verify KV get was called
        mock_env.ROBOT_MEMORY.get.assert_called_once_with("session:test-session-002")
    
    @pytest.mark.asyncio
    async def test_worker_handles_missing_session(self, mock_env, mock_request):
        """Test that worker handles missing session gracefully"""
        # Arrange
        get_session_data = {
            "action": "get_session",
            "data": {
                "session_id": "non-existent-session"
            }
        }
        mock_request.json.return_value = get_session_data
        
        # Mock KV returns None for missing key
        mock_env.ROBOT_MEMORY.get.return_value = None
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 404
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "not found" in response_data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_worker_can_store_robot_state(self, mock_env, mock_request):
        """Test that worker can store robot state in KV"""
        # Arrange
        robot_state_data = {
            "action": "store_robot_state",
            "data": {
                "robot_name": "drama",
                "state": {
                    "mood": "dramatic",
                    "last_active": "2025-08-01T12:00:00Z",
                    "memory_context": ["The user likes theater", "Previous topic: Shakespeare"],
                    "interaction_count": 5
                }
            }
        }
        mock_request.json.return_value = robot_state_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        
        # Verify KV put for robot state
        mock_env.ROBOT_MEMORY.put.assert_called_once()
        call_args = mock_env.ROBOT_MEMORY.put.call_args
        assert call_args[0][0] == "robot:drama:state"
        stored_state = json.loads(call_args[0][1])
        assert stored_state["mood"] == "dramatic"
        assert stored_state["interaction_count"] == 5
    
    @pytest.mark.asyncio
    async def test_worker_can_store_user_preferences(self, mock_env, mock_request):
        """Test that worker can store user preferences in KV"""
        # Arrange
        user_prefs_data = {
            "action": "store_user_preferences",
            "data": {
                "user_id": "user789",
                "preferences": {
                    "favorite_robot": "zen",
                    "theme": "dark",
                    "tools_enabled": ["email", "scraping", "database"],
                    "language": "en",
                    "notifications": True
                }
            }
        }
        mock_request.json.return_value = user_prefs_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        
        # Verify KV put for user preferences
        mock_env.ROBOT_MEMORY.put.assert_called_once()
        call_args = mock_env.ROBOT_MEMORY.put.call_args
        assert call_args[0][0] == "user:user789:prefs"
        stored_prefs = json.loads(call_args[0][1])
        assert stored_prefs["favorite_robot"] == "zen"
        assert stored_prefs["theme"] == "dark"
    
    @pytest.mark.asyncio
    async def test_worker_can_list_active_sessions(self, mock_env, mock_request):
        """Test that worker can list active sessions from KV"""
        # Arrange
        list_sessions_data = {
            "action": "list_sessions",
            "data": {
                "prefix": "session:",
                "limit": 10
            }
        }
        mock_request.json.return_value = list_sessions_data
        
        # Mock KV list response
        mock_env.ROBOT_MEMORY.list.return_value = {
            "keys": [
                {"name": "session:test-001", "metadata": {"user_id": "user1"}},
                {"name": "session:test-002", "metadata": {"user_id": "user2"}},
                {"name": "session:test-003", "metadata": {"user_id": "user3"}}
            ],
            "list_complete": True
        }
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert len(response_data["sessions"]) == 3
        assert response_data["list_complete"] is True
        
        # Verify KV list was called
        mock_env.ROBOT_MEMORY.list.assert_called_once_with(
            prefix="session:",
            limit=10
        )
    
    @pytest.mark.asyncio
    async def test_worker_can_delete_expired_session(self, mock_env, mock_request):
        """Test that worker can delete expired sessions from KV"""
        # Arrange
        delete_session_data = {
            "action": "delete_session",
            "data": {
                "session_id": "expired-session-001"
            }
        }
        mock_request.json.return_value = delete_session_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["deleted"] is True
        
        # Verify KV delete was called
        mock_env.ROBOT_MEMORY.delete.assert_called_once_with("session:expired-session-001")
    
    @pytest.mark.asyncio
    async def test_worker_handles_kv_errors_gracefully(self, mock_env, mock_request):
        """Test that worker handles KV errors gracefully"""
        # Arrange
        session_data = {
            "action": "store_session",
            "data": {
                "session_id": "error-session",
                "user_id": "user999",
                "robots": ["friend"]
            }
        }
        mock_request.json.return_value = session_data
        
        # Mock KV error
        mock_env.ROBOT_MEMORY.put.side_effect = Exception("KV namespace error")
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 500
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "error" in response_data
        assert "kv" in response_data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_worker_can_update_robot_state(self, mock_env, mock_request):
        """Test that worker can update existing robot state"""
        # Arrange
        update_state_data = {
            "action": "update_robot_state",
            "data": {
                "robot_name": "friend",
                "updates": {
                    "mood": "excited",
                    "last_active": "2025-08-01T14:00:00Z",
                    "interaction_count_increment": 1
                }
            }
        }
        mock_request.json.return_value = update_state_data
        
        # Mock existing state
        existing_state = {
            "mood": "happy",
            "last_active": "2025-08-01T10:00:00Z",
            "memory_context": ["User likes jokes"],
            "interaction_count": 10
        }
        mock_env.ROBOT_MEMORY.get.return_value = json.dumps(existing_state)
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        
        # Verify get was called first, then put with updated data
        mock_env.ROBOT_MEMORY.get.assert_called_once_with("robot:friend:state")
        mock_env.ROBOT_MEMORY.put.assert_called_once()
        
        put_args = mock_env.ROBOT_MEMORY.put.call_args
        updated_state = json.loads(put_args[0][1])
        assert updated_state["mood"] == "excited"
        assert updated_state["interaction_count"] == 11
        assert updated_state["memory_context"] == ["User likes jokes"]  # Preserved
    
    @pytest.mark.asyncio
    async def test_worker_validates_kv_key_format(self, mock_env, mock_request):
        """Test that worker validates KV key format"""
        # Arrange - Invalid key format
        invalid_data = {
            "action": "store_session",
            "data": {
                "session_id": "../../etc/passwd",  # Attempting path traversal
                "user_id": "malicious",
                "robots": ["friend"]
            }
        }
        mock_request.json.return_value = invalid_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "invalid" in response_data["error"].lower()
        
        # Verify KV was not called
        mock_env.ROBOT_MEMORY.put.assert_not_called()