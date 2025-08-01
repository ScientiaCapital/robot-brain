"""Test suite for voice API endpoints following TDD principles.

This module tests the FastAPI voice endpoints that will handle:
1. Text-to-speech conversion for robot responses
2. Voice streaming for real-time playback
3. Speech-to-text for kid voice input (future feature)
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import json
import base64
import os
from io import BytesIO

# Set test environment variables
os.environ["ELEVENLABS_API_KEY"] = "test_api_key_for_testing"

from src.api.main import app


@pytest.fixture
def client():
    """Create test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_elevenlabs_tool():
    """Mock ElevenLabsTool for testing."""
    with patch('src.api.routers.voice.elevenlabs_tool') as mock_instance:
        mock_instance.text_to_speech = AsyncMock()
        mock_instance.check_api_status = AsyncMock()
        yield mock_instance


@pytest.fixture
def mock_audio_data():
    """Create mock audio data for testing."""
    # Create a simple WAV header + some data
    audio_bytes = b'RIFF' + b'\x00' * 36 + b'data' + b'\x00' * 100
    return base64.b64encode(audio_bytes).decode('utf-8')


class TestVoiceAPI:
    """Test suite for voice API endpoints."""
    
    def test_text_to_speech_endpoint_exists(self, client, mock_elevenlabs_tool, mock_audio_data):
        """Test that text-to-speech endpoint exists."""
        # Mock the response
        mock_elevenlabs_tool.text_to_speech.return_value = {
            "audio": mock_audio_data,
            "duration": 1.5,
            "voice_id": "voice123"
        }
        
        response = client.post(
            "/api/voice/text-to-speech",
            json={
                "text": "Hello kids!",
                "personality": "friend"
            }
        )
        # This should now pass with mocking
        assert response.status_code == 200
    
    def test_text_to_speech_returns_audio_data(self, client, mock_elevenlabs_tool, mock_audio_data):
        """Test that endpoint returns proper audio data."""
        mock_elevenlabs_tool.text_to_speech.return_value = {
            "audio": mock_audio_data,
            "duration": 1.5,
            "voice_id": "voice123"
        }
        
        response = client.post(
            "/api/voice/text-to-speech",
            json={
                "text": "Hello kids!",
                "personality": "friend"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "audio" in data
        assert "duration" in data
        assert "voice_id" in data
        assert data["audio"] == mock_audio_data
    
    def test_text_to_speech_validates_personality(self, client):
        """Test that endpoint validates robot personality."""
        response = client.post(
            "/api/voice/text-to-speech",
            json={
                "text": "Hello!",
                "personality": "invalid_robot"
            }
        )
        
        assert response.status_code == 422
        assert "personality" in response.json()["detail"][0]["loc"]
    
    def test_text_to_speech_handles_empty_text(self, client):
        """Test that endpoint handles empty text gracefully."""
        response = client.post(
            "/api/voice/text-to-speech",
            json={
                "text": "",
                "personality": "friend"
            }
        )
        
        assert response.status_code == 422
        # Pydantic returns a list of validation errors
        detail = response.json()["detail"]
        assert isinstance(detail, list)
        # Check if validation error is about empty string
        error_messages = [str(error) for error in detail]
        assert any("at least 1 character" in msg.lower() or "string too short" in msg.lower() for msg in error_messages)
    
    def test_text_to_speech_handles_elevenlabs_error(self, client, mock_elevenlabs_tool):
        """Test that endpoint handles ElevenLabs API errors."""
        mock_elevenlabs_tool.text_to_speech.side_effect = Exception("ElevenLabs API error")
        
        response = client.post(
            "/api/voice/text-to-speech",
            json={
                "text": "Hello!",
                "personality": "friend"
            }
        )
        
        assert response.status_code == 500
        assert "voice generation failed" in response.json()["detail"].lower()
    
    def test_streaming_endpoint_exists(self, client, mock_elevenlabs_tool, mock_audio_data):
        """Test that voice streaming endpoint exists."""
        # Mock the response
        mock_elevenlabs_tool.text_to_speech.return_value = {
            "audio": mock_audio_data,
            "duration": 1.5,
            "voice_id": "voice123"
        }
        
        response = client.post(
            "/api/voice/stream",
            json={
                "text": "Hello kids!",
                "personality": "pirate"
            }
        )
        # This should return streaming response
        assert response.status_code == 200
        assert response.headers["content-type"] == "audio/mpeg"
    
    def test_streaming_returns_audio_chunks(self, client, mock_elevenlabs_tool, mock_audio_data):
        """Test that streaming endpoint returns audio chunks."""
        # Mock the text_to_speech response (streaming endpoint uses this)
        mock_elevenlabs_tool.text_to_speech.return_value = {
            "audio": mock_audio_data,
            "duration": 1.5,
            "voice_id": "voice123"
        }
        
        response = client.post(
            "/api/voice/stream",
            json={
                "text": "Ahoy matey!",
                "personality": "pirate"
            }
        )
        
        assert response.status_code == 200
        # Read streaming content
        content = b''
        for chunk in response.iter_bytes():
            content += chunk
        # Should contain the decoded audio data
        assert len(content) > 0
    
    def test_voice_settings_endpoint(self, client):
        """Test voice settings configuration endpoint."""
        response = client.get("/api/voice/settings")
        
        assert response.status_code == 200
        data = response.json()
        assert "personalities" in data
        assert "friend" in data["personalities"]
        assert data["personalities"]["friend"]["voice_id"] is not None
        assert data["personalities"]["friend"]["settings"]["stability"] > 0
        assert data["personalities"]["friend"]["settings"]["similarity_boost"] > 0
    
    def test_voice_health_check(self, client, mock_elevenlabs_tool):
        """Test voice service health check."""
        mock_elevenlabs_tool.check_api_status = AsyncMock(return_value=True)
        
        response = client.get("/api/voice/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["elevenlabs_connected"] is True
    
    def test_batch_text_to_speech(self, client, mock_elevenlabs_tool, mock_audio_data):
        """Test batch processing multiple texts."""
        mock_elevenlabs_tool.text_to_speech.return_value = {
            "audio": mock_audio_data,
            "duration": 1.0,
            "voice_id": "voice123"
        }
        
        response = client.post(
            "/api/voice/batch",
            json={
                "texts": ["Hello!", "How are you?", "Let's play!"],
                "personality": "friend"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 3
        assert all("audio" in result for result in data["results"])