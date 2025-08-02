"""
🔴 TDD RED Phase: Production Readiness Tests for Vercel
Tests robot brain functionality in Vercel serverless environment.
Following our proven TDD excellence methodology.
"""
import pytest
import requests
import json
import asyncio
from unittest.mock import Mock, patch
from typing import Dict, List, Any


class TestRobotBrainVercelProduction:
    """Test Robot Brain functionality in Vercel serverless production environment."""
    
    def test_all_robot_personalities_respond_on_vercel(self):
        """🔴 RED: Fail until all 5 robots work in Vercel serverless."""
        domain = "https://robots2.scientiacapital.com"
        personalities = ["friend", "nerd", "zen", "pirate", "drama"]
        
        for personality in personalities:
            try:
                response = requests.post(
                    f"{domain}/api/chat",
                    json={
                        "personality": personality,
                        "message": "Hello! Can you introduce yourself?",
                        "model": "ollama"
                    },
                    timeout=30
                )
                
                assert response.status_code == 200, f"Robot {personality} should respond with 200 status"
                
                chat_data = response.json()
                assert "response" in chat_data, f"Robot {personality} should return response field"
                assert "personality" in chat_data, f"Robot {personality} should return personality field"
                assert chat_data["personality"] == personality, f"Should confirm {personality} personality"
                assert len(chat_data["response"]) > 10, f"Robot {personality} should give meaningful response"
                
            except requests.exceptions.RequestException as e:
                pytest.fail(f"Robot {personality} not accessible on Vercel deployment: {e}")
    
    def test_elevenlabs_voice_integration_works_on_vercel(self):
        """🔴 RED: Fail until voice TTS works from Vercel deployment."""
        domain = "https://robots2.scientiacapital.com"
        personalities = ["friend", "nerd", "zen", "pirate", "drama"]
        
        for personality in personalities:
            try:
                response = requests.post(
                    f"{domain}/api/voice/tts",
                    json={
                        "text": f"Hello from {personality} robot!",
                        "personality": personality
                    },
                    timeout=30
                )
                
                assert response.status_code == 200, f"Voice TTS should work for {personality} on Vercel"
                
                voice_data = response.json()
                assert "audio_data" in voice_data, f"Should return audio data for {personality}"
                assert "voice_id" in voice_data, f"Should return voice ID for {personality}"
                assert len(voice_data["audio_data"]) > 100, f"Should return actual audio data for {personality}"
                
            except requests.exceptions.RequestException as e:
                pytest.fail(f"Voice integration for {personality} not working on Vercel: {e}")
    
    def test_professional_teams_discoverable_on_vercel(self):
        """🔴 RED: Fail until team queries work on deployed system."""
        domain = "https://robots2.scientiacapital.com"
        team_queries = [
            "get me the construction team",
            "I need help with trading",
            "connect me to the rental team",
            "who can help with home services",
            "I need business support"
        ]
        
        for query in team_queries:
            try:
                response = requests.post(
                    f"{domain}/api/chat",
                    json={
                        "personality": "friend",  # Use friend as coordinator
                        "message": query,
                        "model": "ollama"
                    },
                    timeout=30
                )
                
                assert response.status_code == 200, f"Team query '{query}' should work on Vercel"
                
                chat_data = response.json()
                response_text = chat_data.get("response", "").lower()
                
                # Should recognize and respond to team-related queries
                team_keywords = ["team", "robot", "help", "expert", "specialist"]
                has_team_keyword = any(keyword in response_text for keyword in team_keywords)
                assert has_team_keyword, f"Response should recognize team query: '{query}'"
                
            except requests.exceptions.RequestException as e:
                pytest.fail(f"Team query '{query}' not working on Vercel: {e}")
    
    def test_neon_database_connectivity_from_vercel(self):
        """🔴 RED: Fail until Vercel can connect to Neon PostgreSQL."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            # Test database connectivity through health endpoint
            response = requests.get(f"{domain}/health", timeout=15)
            assert response.status_code == 200, "Health endpoint should be accessible"
            
            health_data = response.json()
            assert "database_connected" in health_data, "Health check should include database status"
            assert health_data["database_connected"] is True, "Database should be connected from Vercel"
            
            # Test actual database operation through API
            response = requests.post(
                f"{domain}/api/chat",
                json={
                    "personality": "friend",
                    "message": "Hello, this is a database test",
                    "model": "ollama"
                },
                timeout=30
            )
            
            assert response.status_code == 200, "Database-backed chat should work from Vercel"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Database connectivity from Vercel not working: {e}")
    
    def test_vercel_serverless_cold_start_performance(self):
        """🔴 RED: Fail until cold start times are acceptable for kids."""
        domain = "https://robots2.scientiacapital.com"
        
        import time
        
        # Test cold start performance
        start_time = time.time()
        
        try:
            response = requests.get(f"{domain}/health", timeout=30)
            end_time = time.time()
            
            cold_start_time = end_time - start_time
            
            assert response.status_code == 200, "Health check should succeed"
            assert cold_start_time < 10.0, f"Cold start should be under 10 seconds, got {cold_start_time:.2f}s"
            
            # Test subsequent request (warm start)
            start_time = time.time()
            response = requests.get(f"{domain}/health", timeout=10)
            end_time = time.time()
            
            warm_start_time = end_time - start_time
            assert warm_start_time < 2.0, f"Warm start should be under 2 seconds, got {warm_start_time:.2f}s"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Performance test failed on Vercel: {e}")


class TestVercelRobotEcosystemIntegration:
    """Test the complete robot ecosystem integration on Vercel."""
    
    def test_plugin_robot_architecture_on_vercel(self):
        """🔴 RED: Fail until plugin robot-{type} architecture works on Vercel."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            # Test robot discovery endpoint
            response = requests.get(f"{domain}/api/robots", timeout=15)
            assert response.status_code == 200, "Robot discovery should work on Vercel"
            
            robots_data = response.json()
            assert "robots" in robots_data, "Should return robots list"
            
            robots = robots_data["robots"]
            
            # Check for plugin-style robot naming
            plugin_robots = [r for r in robots if r.get("id", "").startswith("robot-")]
            assert len(plugin_robots) >= 10, f"Should have plugin-style robots, found {len(plugin_robots)}"
            
            # Check for professional verticals
            verticals = set()
            for robot in robots:
                if "vertical" in robot:
                    verticals.add(robot["vertical"])
            
            expected_verticals = {"business", "construction", "home-services", "rental"}
            found_verticals = expected_verticals.intersection(verticals)
            assert len(found_verticals) >= 3, f"Should have professional verticals, found {found_verticals}"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Plugin robot architecture not working on Vercel: {e}")
    
    def test_voice_personality_mapping_on_vercel(self):
        """🔴 RED: Fail until voice personality mapping works on Vercel."""
        domain = "https://robots2.scientiacapital.com"
        
        # Test voice personality mapping for each robot type
        robot_personalities = [
            ("robot-trader", "professional trading voice"),
            ("robot-foreman", "construction supervisor voice"),
            ("robot-host", "hospitality expert voice"),
            ("robot-plumber", "technical expert voice")
        ]
        
        for robot_id, expected_context in robot_personalities:
            try:
                response = requests.post(
                    f"{domain}/api/voice/tts",
                    json={
                        "text": f"Hello, I am {robot_id} and I'm here to help!",
                        "personality": robot_id
                    },
                    timeout=30
                )
                
                # This will initially fail until we implement robot voice mapping
                assert response.status_code == 200, f"Voice mapping should work for {robot_id}"
                
                voice_data = response.json()
                assert "voice_id" in voice_data, f"Should return voice ID for {robot_id}"
                assert "audio_data" in voice_data, f"Should return audio for {robot_id}"
                
            except requests.exceptions.RequestException as e:
                pytest.fail(f"Voice personality mapping for {robot_id} not working: {e}")
    
    def test_industry_vertical_coordination_on_vercel(self):
        """🔴 RED: Fail until industry vertical coordination works on Vercel."""
        domain = "https://robots2.scientiacapital.com"
        
        vertical_test_queries = [
            ("construction", "I need help with a building project"),
            ("business", "I need help with payroll calculations"),
            ("rental", "I need help managing my Airbnb property"),
            ("home-services", "I have a plumbing issue")
        ]
        
        for vertical, query in vertical_test_queries:
            try:
                response = requests.post(
                    f"{domain}/api/chat",
                    json={
                        "personality": "friend",  # Use friend as coordinator
                        "message": query,
                        "model": "ollama"
                    },
                    timeout=30
                )
                
                assert response.status_code == 200, f"Vertical query should work for {vertical}"
                
                chat_data = response.json()
                response_text = chat_data.get("response", "").lower()
                
                # Should recognize vertical-specific queries
                vertical_keywords = {
                    "construction": ["build", "construct", "project", "site"],
                    "business": ["payroll", "business", "finance", "hr"],
                    "rental": ["airbnb", "rental", "property", "guest"],
                    "home-services": ["plumb", "repair", "home", "fix"]
                }
                
                keywords = vertical_keywords.get(vertical, [])
                has_relevant_keyword = any(keyword in response_text for keyword in keywords)
                assert has_relevant_keyword, f"Should recognize {vertical} context in query"
                
            except requests.exceptions.RequestException as e:
                pytest.fail(f"Vertical coordination for {vertical} not working: {e}")


class TestVercelDeploymentQuality:
    """Test deployment quality and reliability on Vercel."""
    
    def test_vercel_deployment_has_proper_cors(self):
        """🔴 RED: Fail until CORS is properly configured for production."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            # Test CORS headers
            response = requests.options(f"{domain}/api/chat", timeout=10)
            
            cors_headers = response.headers
            
            assert "Access-Control-Allow-Origin" in cors_headers, "Should have CORS origin header"
            assert "Access-Control-Allow-Methods" in cors_headers, "Should have CORS methods header"
            assert "Access-Control-Allow-Headers" in cors_headers, "Should have CORS headers header"
            
            # Should not allow all origins in production
            origin_header = cors_headers.get("Access-Control-Allow-Origin", "")
            assert origin_header != "*", "Production should not allow all origins"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"CORS configuration not working on Vercel: {e}")
    
    def test_vercel_deployment_has_security_headers(self):
        """🔴 RED: Fail until security headers are properly configured."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            response = requests.get(f"{domain}/health", timeout=10)
            
            headers = response.headers
            
            # Check for security headers
            security_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options", 
                "X-XSS-Protection"
            ]
            
            for header in security_headers:
                assert header in headers, f"Should have security header: {header}"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Security headers not configured on Vercel: {e}")
    
    def test_vercel_deployment_handles_errors_gracefully(self):
        """🔴 RED: Fail until error handling works properly on Vercel."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            # Test 404 handling
            response = requests.get(f"{domain}/nonexistent-endpoint", timeout=10)
            assert response.status_code == 404, "Should return 404 for nonexistent endpoints"
            
            # Test invalid API request
            response = requests.post(
                f"{domain}/api/chat",
                json={"invalid": "request"},
                timeout=10
            )
            
            # Should handle gracefully, not crash
            assert response.status_code in [400, 422], "Should handle invalid requests gracefully"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Error handling not working properly on Vercel: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])