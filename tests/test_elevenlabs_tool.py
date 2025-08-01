"""
Test suite for ElevenLabs TTS tool integration following TDD principles.
"""
import os
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from io import BytesIO

from src.tools.elevenlabs_tool import ElevenLabsTool


class TestElevenLabsTool:
    """Test suite for ElevenLabs text-to-speech tool."""

    @pytest.fixture
    def elevenlabs_tool(self):
        """Create ElevenLabsTool instance for testing."""
        # Patch environment before creating tool instance
        with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_key_fixture'}):
            return ElevenLabsTool()

    @pytest.fixture
    def mock_audio_data(self):
        """Mock audio data for testing."""
        return b"mock_audio_data_for_testing"
    
    def setup_mock_client(self, mock_client_class, audio_data):
        """Helper to set up mock client with proper async iterator."""
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Create a proper async iterable mock
        class MockAsyncIterable:
            def __init__(self, data):
                self.data = data
            
            def __aiter__(self):
                return self
            
            async def __anext__(self):
                if hasattr(self, '_exhausted'):
                    raise StopAsyncIteration
                self._exhausted = True
                return self.data
        
        # Make convert method return the iterable directly (not a coroutine)
        mock_convert = MagicMock()
        mock_convert.return_value = MockAsyncIterable(audio_data)
        mock_client.text_to_speech.convert = mock_convert
        
        return mock_client, mock_convert

    @pytest.mark.asyncio
    async def test_elevenlabs_tool_initialization(self, elevenlabs_tool):
        """Test ElevenLabsTool initializes correctly."""
        assert elevenlabs_tool.name == "elevenlabs_tts"
        assert elevenlabs_tool.description == "Convert text to speech using ElevenLabs API"
        assert "text" in elevenlabs_tool.parameters
        assert "personality" in elevenlabs_tool.parameters

    @pytest.mark.asyncio
    async def test_text_to_speech_conversion_success(self, elevenlabs_tool, mock_audio_data):
        """Test successful text-to-speech conversion."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_key'}):
                mock_client, mock_convert = self.setup_mock_client(mock_client_class, mock_audio_data)
                
                # Execute tool
                result = await elevenlabs_tool.execute(
                    text="Hello from Friend Robot!",
                    personality="friend"
                )
                
                # Verify result
                assert result["success"] is True
                assert "audio_data" in result
                assert result["audio_data"] == mock_audio_data
                
                # Verify API was called correctly
                mock_convert.assert_called_once()
                call_args = mock_convert.call_args.kwargs
                assert "Hello from Friend Robot!" in call_args["text"]  # May be preprocessed
                assert call_args["model_id"] == "eleven_flash_v2_5"  # Low latency for kids

    @pytest.mark.asyncio
    async def test_personality_voice_mapping(self, elevenlabs_tool):
        """Test that robot personalities map to correct voice IDs."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_key'}):
                mock_client, mock_convert = self.setup_mock_client(mock_client_class, b"audio")
                
                # Test Friend robot
                result = await elevenlabs_tool.execute(text="Hello", personality="friend")
                assert result["success"] is True
                call_args = mock_convert.call_args.kwargs
                assert "voice_id" in call_args
                friend_voice_id = call_args["voice_id"]
                
                # Reset mock for second call
                mock_convert.reset_mock()
                # Create new async iterable for second call
                class MockAsyncIterable2:
                    def __init__(self, data):
                        self.data = data
                    def __aiter__(self):
                        return self
                    async def __anext__(self):
                        if hasattr(self, '_exhausted'):
                            raise StopAsyncIteration
                        self._exhausted = True
                        return self.data
                mock_convert.return_value = MockAsyncIterable2(b"audio")
                
                # Test different personalities get different voice IDs
                await elevenlabs_tool.execute(text="Hello", personality="nerd")
                nerd_call_args = mock_convert.call_args.kwargs
                assert "voice_id" in nerd_call_args
                nerd_voice_id = nerd_call_args["voice_id"]
                
                # Different personalities should have different voices
                assert friend_voice_id != nerd_voice_id

    @pytest.mark.asyncio
    async def test_api_key_loading(self):
        """Test API key is loaded from environment."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_api_key'}):
                # Create fresh tool instance within the test to use the patched env
                elevenlabs_tool = ElevenLabsTool()
                mock_client, mock_convert = self.setup_mock_client(mock_client_class, b"audio")
                
                await elevenlabs_tool.execute(text="test", personality="friend")
                
                # Verify client was initialized with API key
                mock_client_class.assert_called_once_with(api_key='test_api_key')

    @pytest.mark.asyncio
    async def test_error_handling_missing_api_key(self, elevenlabs_tool):
        """Test error handling when API key is missing."""
        with patch.dict(os.environ, {}, clear=True):
            result = await elevenlabs_tool.execute(
                text="test",
                personality="friend"
            )
            
            assert result["success"] is False
            assert "error" in result
            assert "api key" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_error_handling_api_failure(self, elevenlabs_tool):
        """Test error handling when ElevenLabs API fails."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            mock_client.text_to_speech.convert.side_effect = Exception("API Error")
            
            result = await elevenlabs_tool.execute(
                text="test",
                personality="friend"
            )
            
            assert result["success"] is False
            assert "error" in result

    @pytest.mark.asyncio
    async def test_kid_friendly_settings(self, elevenlabs_tool):
        """Test that voice settings are optimized for kids."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_key'}):
                mock_client, mock_convert = self.setup_mock_client(mock_client_class, b"audio")
                
                result = await elevenlabs_tool.execute(
                    text="Hello kids!",
                    personality="friend"
                )
                
                assert result["success"] is True
                call_args = mock_convert.call_args.kwargs
                # Should use Flash v2.5 for low latency
                assert call_args["model_id"] == "eleven_flash_v2_5"
                # Should have appropriate output format for web playback
                assert "output_format" in call_args

    @pytest.mark.asyncio
    async def test_text_preprocessing_for_numbers(self, elevenlabs_tool):
        """Test that text with numbers is preprocessed appropriately."""
        with patch('src.tools.elevenlabs_tool.AsyncElevenLabs') as mock_client_class:
            with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_key'}):
                mock_client, mock_convert = self.setup_mock_client(mock_client_class, b"audio")
                
                # Test with numbers that should be normalized
                result = await elevenlabs_tool.execute(
                    text="You have 5 messages and $10 in your account",
                    personality="friend"
                )
                
                assert result["success"] is True
                call_args = mock_convert.call_args.kwargs
                processed_text = call_args["text"]
                
                # Should normalize numbers for better speech
                assert "five" in processed_text.lower()
                assert "ten dollars" in processed_text.lower()