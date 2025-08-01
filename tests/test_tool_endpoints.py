"""
Test script for tool API endpoints.
Run with: python -m pytest tests/test_tool_endpoints.py -v
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app


client = TestClient(app)


class TestToolEndpoints:
    """Test the tool API endpoints."""
    
    def test_list_tools(self):
        """Test listing available tools."""
        response = client.get("/api/tools/")
        assert response.status_code == 200
        
        data = response.json()
        assert "tools" in data
        assert "email" in data["tools"]
        assert "scrape" in data["tools"]
        assert "database" in data["tools"]
    
    def test_email_endpoint_validation(self):
        """Test email endpoint validation."""
        # Missing required fields
        response = client.post("/api/tools/email", json={})
        assert response.status_code == 422  # Validation error
        
        # Valid request (will fail to send but validates)
        response = client.post("/api/tools/email", json={
            "to": "test@example.com",
            "subject": "Test Subject",
            "body": "Test body"
        })
        # Should return 200 even if SMTP fails (handled gracefully)
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
    
    def test_scrape_endpoint(self):
        """Test web scraping endpoint."""
        # Test with a URL (will fail but validates)
        response = client.post("/api/tools/scrape", json={
            "url": "https://example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
    
    def test_database_endpoint(self):
        """Test database endpoint."""
        # Test store operation
        response = client.post("/api/tools/database", json={
            "operation": "store",
            "key": "test_key",
            "value": {"test": "data"}
        })
        # Will fail if Redis not running, but validates
        assert response.status_code == 200
        
        # Test invalid operation
        response = client.post("/api/tools/database", json={
            "operation": "invalid",
            "key": "test_key"
        })
        assert response.status_code == 400
    
    def test_tools_health(self):
        """Test tools health endpoint."""
        response = client.get("/api/tools/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "email" in data
        assert "scraping" in data
        assert "database" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])