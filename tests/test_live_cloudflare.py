"""
Live tests against the deployed Cloudflare Robot Brain.
These tests verify the actual deployment is working correctly.
"""

import pytest
import requests
import json
from typing import Dict, Any


class TestLiveCloudflareDeployment:
    """Test the live Cloudflare deployment at robot-brain.tkipper.workers.dev"""
    
    BASE_URL = "https://robot-brain.tkipper.workers.dev"
    
    def test_health_endpoint(self):
        """Test that the health endpoint is responding."""
        response = requests.get(f"{self.BASE_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert len(data["robots"]) == 5
        assert "friend" in data["robots"]
    
    def test_robots_api(self):
        """Test the robots API returns all personalities."""
        response = requests.get(f"{self.BASE_URL}/api/robots")
        assert response.status_code == 200
        
        robots = response.json()
        assert "friend" in robots
        assert "nerd" in robots
        assert "pirate" in robots
        
        # Check robot structure
        friend = robots["friend"]
        assert friend["name"] == "RoboFriend"
        assert friend["emoji"] == "😊"
        assert "chat" in friend["tools"]
    
    def test_real_chat_with_robofriend(self):
        """Test actual chat with RoboFriend using real AI."""
        response = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": "friend",
                "message": "Hello! How are you today?"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["personality"] == "friend"
        assert data["emoji"] == "😊"
        assert data["name"] == "RoboFriend"
        assert len(data["response"]) > 0
        
        # Check that it's actually a friendly response
        response_lower = data["response"].lower()
        friendly_indicators = ["hi", "hello", "great", "happy", "😊", "!"]
        assert any(indicator in response_lower for indicator in friendly_indicators)
    
    def test_real_chat_with_robonerd(self):
        """Test actual chat with RoboNerd about technical topics."""
        response = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": "nerd",
                "message": "What is quantum computing?"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a technical response
        response_lower = data["response"].lower()
        technical_terms = ["quantum", "qubit", "computer", "computing", "technology"]
        assert any(term in response_lower for term in technical_terms)
    
    def test_model_switching(self):
        """Test that different models can be specified."""
        # First request with default model
        response1 = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": "pirate",
                "message": "Ahoy!"
            }
        )
        
        # Second request with specific model
        response2 = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": "pirate",
                "message": "Ahoy!",
                "model": "@cf/tinyllama/tinyllama-1.1b-chat-v1.0"
            }
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Both should have pirate personality
        assert "arr" in response1.json()["response"].lower() or \
               "ahoy" in response1.json()["response"].lower()
    
    def test_tools_api(self):
        """Test the tools API endpoint."""
        response = requests.get(f"{self.BASE_URL}/api/tools")
        assert response.status_code == 200
        
        tools = response.json()
        assert "chat" in tools
        assert tools["chat"]["name"] == "Chat"
        assert tools["chat"]["icon"] == "💬"
    
    def test_response_performance(self):
        """Test that responses come back in reasonable time."""
        import time
        
        start = time.time()
        response = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": "zen",
                "message": "What is the meaning of life?"
            },
            timeout=30  # 30 second timeout
        )
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 10  # Should respond in under 10 seconds
        
        # Check for zen-like response
        data = response.json()
        assert data["emoji"] == "🧘"
        zen_indicators = ["peace", "harmony", "balance", "wisdom", "🍃", "☯️"]
        assert any(indicator in data["response"] for indicator in zen_indicators)
    
    @pytest.mark.parametrize("personality,test_message,expected_traits", [
        ("friend", "I'm sad", ["cheer", "happy", "smile", "😊", "!"]),
        ("nerd", "Calculate 42 * 17", ["calculate", "equals", "result", "🤓"]),
        ("pirate", "Where's the treasure?", ["arr", "treasure", "matey", "🏴‍☠️"]),
        ("drama", "To be or not to be", ["shakespeare", "dramatic", "!", "🎭"]),
        ("zen", "I'm stressed", ["calm", "breathe", "peace", "🧘"])
    ])
    def test_all_personalities_respond_appropriately(
        self, personality, test_message, expected_traits
    ):
        """Test each personality responds with appropriate characteristics."""
        response = requests.post(
            f"{self.BASE_URL}/api/chat",
            json={
                "personality": personality,
                "message": test_message
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        response_text = data["response"].lower()
        assert any(trait in response_text for trait in expected_traits), \
            f"Expected {personality} to use one of {expected_traits}, got: {response_text[:100]}..."


if __name__ == "__main__":
    # Run the live tests
    pytest.main([__file__, "-v", "-k", "test_real_chat"])