"""
Tests for FastAPI endpoints migrated from legacy system Worker.
Following TDD - write tests first!
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime


@pytest.fixture
def mock_neon_client():
    """Mock Neon client for testing."""
    client = AsyncMock()
    return client


@pytest.fixture
def test_client(mock_neon_client):
    """Create test client with mocked dependencies."""
    from src.api.main import app
    
    # Override dependencies
    app.state.neon_client = mock_neon_client
    
    return TestClient(app)


class TestFastAPIEndpoints:
    """Test all FastAPI endpoints match legacy system Worker functionality."""
    
    def test_get_robots_endpoint(self, test_client):
        """Test GET /api/robots endpoint."""
        # Act
        response = test_client.get("/api/robots")
        
        # Assert
        assert response.status_code == 200
        robots = response.json()
        assert "friend" in robots
        assert "nerd" in robots
        assert "zen" in robots
        assert "pirate" in robots
        assert "drama" in robots
        
        # Verify robot structure
        friend = robots["friend"]
        assert friend["name"] == "RoboFriend"
        assert friend["emoji"] == "😊"
        assert "tools" in friend
        assert "chat" in friend["tools"]
    
    def test_get_models_endpoint(self, test_client):
        """Test GET /api/models endpoint."""
        # Act
        response = test_client.get("/api/models")
        
        # Assert
        assert response.status_code == 200
        models = response.json()
        assert "chat" in models
        assert "default" in models["chat"]
    
    def test_get_tools_endpoint(self, test_client):
        """Test GET /api/tools endpoint."""
        # Act
        response = test_client.get("/api/tools")
        
        # Assert
        assert response.status_code == 200
        tools = response.json()
        assert "email" in tools
        assert "database" in tools
        assert "calculator" in tools
    
    def test_chat_endpoint_success(self, test_client, mock_neon_client):
        """Test POST /api/chat endpoint."""
        # Arrange
        chat_request = {
            "personality": "friend",
            "message": "Hello robot!",
            "model": "default"
        }
        
        mock_neon_client.store_conversation.return_value = {
            "success": True,
            "id": "conv-123"
        }
        
        # Act
        response = test_client.post("/api/chat", json=chat_request)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "personality" in data
        assert data["personality"] == "friend"
        assert "response" in data
        assert "emoji" in data
        assert data["emoji"] == "😊"
        assert "name" in data
        assert data["name"] == "RoboFriend"
    
    def test_chat_endpoint_invalid_personality(self, test_client):
        """Test chat endpoint with invalid personality."""
        # Arrange
        chat_request = {
            "personality": "invalid_robot",
            "message": "Hello!"
        }
        
        # Act
        response = test_client.post("/api/chat", json=chat_request)
        
        # Assert
        assert response.status_code == 400
        error = response.json()
        assert "detail" in error
        assert "error" in error["detail"]
        assert "Invalid personality" in error["detail"]["error"]
    
    def test_multi_chat_endpoint(self, test_client, mock_neon_client):
        """Test POST /api/multi-chat endpoint."""
        # Arrange
        multi_chat_request = {
            "topic": "What is the meaning of life?",
            "robots": ["friend", "nerd", "zen"]
        }
        
        mock_neon_client.store_robot_interaction.return_value = {
            "success": True,
            "id": "interaction-123"
        }
        
        # Act
        response = test_client.post("/api/multi-chat", json=multi_chat_request)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "topic" in data
        assert data["topic"] == multi_chat_request["topic"]
        assert "responses" in data
        assert len(data["responses"]) == 3
        
        # Verify each robot responded
        robot_names = [r["robot"] for r in data["responses"]]
        assert "friend" in robot_names
        assert "nerd" in robot_names
        assert "zen" in robot_names
    
    def test_cors_headers(self, test_client):
        """Test CORS headers are properly set."""
        # Act - CORS headers are added for actual cross-origin requests
        response = test_client.options(
            "/api/robots",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        
        # Assert
        assert response.status_code == 200
        # CORS middleware responds with the requesting origin or "*"
        assert response.headers.get("access-control-allow-origin") in ["*", "http://localhost:3000"]
        assert response.headers.get("access-control-allow-methods") is not None
    
    def test_health_check_endpoint(self, test_client):
        """Test GET /health endpoint."""
        # Act
        response = test_client.get("/health")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_tool_endpoints_email(self, test_client):
        """Test POST /api/tools/email endpoint."""
        # Arrange
        email_request = {
            "to": "test@example.com",
            "subject": "Test Email",
            "body": "Hello from Robot Brain!"
        }
        
        # Act
        response = test_client.post("/api/tools/email", json=email_request)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "message_id" in data
    
    def test_tool_endpoints_scrape(self, test_client):
        """Test POST /api/tools/calculator endpoint."""
        # Arrange
        calc_request = {
            "expression": "2 + 2"
        }
        
        # Act
        response = test_client.post("/api/tools/calculator", json=calc_request)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert data["result"] == 4
    
    def test_tool_endpoints_database(self, test_client):
        """Test POST /api/tools/database endpoint."""
        # Arrange
        db_request = {
            "operation": "set",
            "key": "test_key",
            "value": {"data": "test"}
        }
        
        # Act
        response = test_client.post("/api/tools/database", json=db_request)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
    
    def test_error_handling(self, test_client, mock_neon_client):
        """Test proper error handling and responses."""
        # Arrange
        mock_neon_client.store_conversation.side_effect = Exception("Database error")
        
        chat_request = {
            "personality": "friend",
            "message": "Hello!"
        }
        
        # Act
        response = test_client.post("/api/chat", json=chat_request)
        
        # Assert - the endpoint returns success even if database fails
        # This is the current behavior - database errors are caught and ignored
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "personality" in data
    
    def test_request_validation(self, test_client):
        """Test request validation."""
        # Arrange - missing required field
        invalid_request = {
            "personality": "friend"
            # missing "message"
        }
        
        # Act
        response = test_client.post("/api/chat", json=invalid_request)
        
        # Assert
        assert response.status_code == 422  # Unprocessable Entity
        error = response.json()
        assert "detail" in error
    
    def test_static_file_serving(self, test_client):
        """Test that static files are served correctly."""
        # Act
        response = test_client.get("/")
        
        # Assert
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])