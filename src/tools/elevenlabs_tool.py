"""
ElevenLabs Text-to-Speech tool for Robot Brain voice interactions.
Optimized for kids with low-latency voice responses.
"""
import os
import re
import asyncio
import base64
import logging
from typing import Dict, Any, List, Optional
from io import BytesIO

from elevenlabs.client import AsyncElevenLabs
from elevenlabs import VoiceSettings

from ..core.base_tool import BaseTool, ToolParameter

logger = logging.getLogger(__name__)


class ElevenLabsTool(BaseTool):
    """
    ElevenLabs TTS tool for converting robot text responses to speech.
    
    Follows Context7 best practices for ElevenLabs integration:
    - Uses AsyncElevenLabs client for FastAPI compatibility
    - Flash v2.5 model for low latency (~75ms) suitable for kids
    - Preprocesses text for better number/date pronunciation
    - Maps robot personalities to appropriate voice IDs
    """
    
    # Robot personality to ElevenLabs voice ID mapping
    # Based on documentation research for kid-friendly voices
    ROBOT_VOICES = {
        "friend": "21m00Tcm4TlvDq8ikWAM",  # Rachel - warm, encouraging
        "nerd": "yoZ06aMxZJJ28mfd3POQ",    # Sam - excited, precise
        "zen": "EXAVITQu4vr4xnSDxMaL",     # Bella - calm, soothing
        "pirate": "SOYHLrjzK2X1ezoPC6cr",  # Harry - adventurous
        "drama": "jBpfuIE2acCO8z3wKNLl"    # Gigi - theatrical
    }
    
    def __init__(self) -> None:
        """Initialize ElevenLabs TTS tool."""
        super().__init__(
            name="elevenlabs_tts",
            description="Convert text to speech using ElevenLabs API",
            parameters={
                "text": ToolParameter(
                    type="string",
                    description="Text to convert to speech",
                    required=True
                ),
                "personality": ToolParameter(
                    type="string", 
                    description="Robot personality (friend, nerd, zen, pirate, drama)",
                    required=True
                )
            }
        )
        # Get API key from environment
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            logger.warning("ElevenLabs API key not found in environment")
    
    def _preprocess_text_for_kids(self, text: str) -> str:
        """
        Preprocess text to ensure better pronunciation for kids.
        
        Based on ElevenLabs docs: Flash v2.5 has limited text normalization,
        so we normalize numbers/dates/currencies for clearer speech.
        """
        # Convert simple numbers to words for better pronunciation
        number_words = {
            "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
            "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
            "10": "ten", "11": "eleven", "12": "twelve"
        }
        
        processed_text = text
        
        # Handle currency FIRST (before converting numbers to words)
        processed_text = re.sub(r'\$(\d+)', r'\1 dollars', processed_text)
        
        # Replace standalone numbers with words (for better speech)
        for num, word in number_words.items():
            processed_text = re.sub(r'\b' + num + r'\b', word, processed_text)
        
        # Handle time format (basic)
        processed_text = re.sub(r'(\d{1,2}):(\d{2})', r'\1 \2', processed_text)
        
        return processed_text
    
    def _get_voice_for_robot(self, personality: str) -> str:
        """Get ElevenLabs voice ID for robot personality."""
        return self.ROBOT_VOICES.get(
            personality.lower(), 
            self.ROBOT_VOICES["friend"]  # Default fallback
        )
    
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """
        Execute text-to-speech conversion using ElevenLabs API.
        
        Args:
            text: Text to convert to speech
            personality: Robot personality for voice selection
            
        Returns:
            Dict with success status and audio data or error message
        """
        try:
            text = kwargs.get("text", "")
            personality = kwargs.get("personality", "friend")
            
            # Validate inputs
            if not text.strip():
                return {"success": False, "error": "Text cannot be empty"}
            
            # Defer to text_to_speech method
            result = await self.text_to_speech(text, personality)
            
            return {
                "success": True,
                "audio_data": base64.b64decode(result["audio"]),
                "voice_id": result["voice_id"],
                "personality": personality,
                "processed_text": text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"ElevenLabs TTS error: {str(e)}"
            }
    
    async def text_to_speech(self, text: str, personality: str) -> Dict[str, Any]:
        """
        Convert text to speech and return base64 encoded audio.
        
        This method is called by the voice API router.
        
        Args:
            text: Text to convert to speech
            personality: Robot personality for voice selection
            
        Returns:
            Dict with audio (base64), duration, and voice_id
        """
        # Validate API key
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        
        # Preprocess text for better pronunciation
        processed_text = self._preprocess_text_for_kids(text)
        
        # Get voice ID for robot personality
        voice_id = self._get_voice_for_robot(personality)
        
        # Initialize ElevenLabs client
        client = AsyncElevenLabs(api_key=self.api_key)
        
        try:
            # Convert text to speech using Context7 patterns
            response = client.text_to_speech.convert(
                text=processed_text,
                voice_id=voice_id,
                model_id="eleven_flash_v2_5",  # Low latency model for kids
                output_format="mp3_44100_128",  # Good quality for web playback
                voice_settings=VoiceSettings(
                    stability=0.5,        # Moderate stability
                    similarity_boost=0.8, # Good similarity to original voice
                    style=0.2,            # Slight style for personality
                    use_speaker_boost=True  # Enhanced clarity for kids
                )
            )
            
            # Collect audio data from streaming response
            audio_data = BytesIO()
            async for chunk in response:
                if chunk:
                    audio_data.write(chunk)
            
            # Get audio bytes and encode as base64
            audio_data.seek(0)
            audio_bytes = audio_data.getvalue()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Calculate approximate duration (rough estimate)
            # MP3 at 128kbps = 16KB/s, so duration = size / 16000
            duration = len(audio_bytes) / 16000.0
            
            return {
                "audio": audio_base64,
                "duration": duration,
                "voice_id": voice_id
            }
            
        except Exception as e:
            logger.error(f"ElevenLabs TTS conversion failed: {str(e)}")
            raise
    
    async def check_api_status(self) -> bool:
        """
        Check if ElevenLabs API is accessible.
        
        Returns:
            bool: True if API is healthy, False otherwise
        """
        if not self.api_key:
            return False
            
        try:
            # Create client
            client = AsyncElevenLabs(api_key=self.api_key)
            
            # Try to get user info as a health check
            user = await client.user.get()
            
            # If we got here, API is working
            return True
        except Exception as e:
            logger.error(f"ElevenLabs API health check failed: {str(e)}")
            return False