"""Voice API router for text-to-speech functionality.

This module provides FastAPI endpoints for:
- Converting text to speech using ElevenLabs
- Streaming audio for real-time playback
- Managing voice settings and configurations
"""

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
import logging
import base64
from io import BytesIO

from src.tools.elevenlabs_tool import ElevenLabsTool
from typing import Literal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])

# Initialize ElevenLabs tool
elevenlabs_tool = ElevenLabsTool()

# Define robot personality type
RobotPersonality = Literal["friend", "nerd", "zen", "pirate", "drama"]


class TextToSpeechRequest(BaseModel):
    """Request model for text-to-speech conversion."""
    text: str = Field(..., min_length=1, description="Text to convert to speech")
    personality: RobotPersonality = Field(..., description="Robot personality for voice selection")
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Ensure text is not empty or just whitespace."""
        if not v.strip():
            raise ValueError("Text cannot be empty")
        return v


class TextToSpeechResponse(BaseModel):
    """Response model for text-to-speech conversion."""
    audio: str = Field(..., description="Base64 encoded audio data")
    duration: float = Field(..., description="Audio duration in seconds")
    voice_id: str = Field(..., description="ElevenLabs voice ID used")


class StreamRequest(BaseModel):
    """Request model for streaming text-to-speech."""
    text: str = Field(..., min_length=1, description="Text to stream as speech")
    personality: RobotPersonality = Field(..., description="Robot personality for voice selection")


class BatchTextToSpeechRequest(BaseModel):
    """Request model for batch text-to-speech conversion."""
    texts: List[str] = Field(..., min_length=1, max_length=10, description="List of texts to convert")
    personality: RobotPersonality = Field(..., description="Robot personality for voice selection")


class VoiceSettings(BaseModel):
    """Voice settings for a personality."""
    voice_id: str
    settings: Dict[str, float]


@router.post("/text-to-speech", response_model=TextToSpeechResponse)
async def text_to_speech(request: TextToSpeechRequest) -> TextToSpeechResponse:
    """Convert text to speech for a specific robot personality."""
    try:
        # Convert text to speech using ElevenLabs tool
        result = await elevenlabs_tool.text_to_speech(
            text=request.text,
            personality=request.personality
        )
        
        return TextToSpeechResponse(
            audio=result["audio"],
            duration=result.get("duration", 0.0),
            voice_id=result.get("voice_id", "")
        )
    except Exception as e:
        logger.error(f"Voice generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Voice generation failed"
        )


@router.post("/stream")
async def stream_text_to_speech(request: StreamRequest) -> StreamingResponse:
    """Stream text-to-speech audio for real-time playback."""
    try:
        # For now, we'll implement a simple non-streaming version
        # In production, this would use ElevenLabs WebSocket API
        result = await elevenlabs_tool.text_to_speech(
            text=request.text,
            personality=request.personality
        )
        
        # Decode base64 audio data
        audio_bytes = base64.b64decode(result["audio"])
        
        # Return as streaming response
        return StreamingResponse(
            BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Voice-ID": result.get("voice_id", "")
            }
        )
    except Exception as e:
        logger.error(f"Voice streaming failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Voice streaming failed"
        )


@router.get("/settings")
async def get_voice_settings() -> Dict[str, Any]:
    """Get voice settings for all personalities."""
    settings = {
        "personalities": {
            "friend": {
                "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel
                "settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.8,
                    "style": 0.4,
                    "use_speaker_boost": True
                }
            },
            "nerd": {
                "voice_id": "yoZ06aMxZJJ28mfd3POQ",  # Sam
                "settings": {
                    "stability": 0.9,
                    "similarity_boost": 0.7,
                    "style": 0.2,
                    "use_speaker_boost": True
                }
            },
            "zen": {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella
                "settings": {
                    "stability": 0.95,
                    "similarity_boost": 0.6,
                    "style": 0.1,
                    "use_speaker_boost": False
                }
            },
            "pirate": {
                "voice_id": "SOYHLrjzK2X1ezoPC6cr",  # Harry
                "settings": {
                    "stability": 0.6,
                    "similarity_boost": 0.85,
                    "style": 0.7,
                    "use_speaker_boost": True
                }
            },
            "drama": {
                "voice_id": "jBpfuIE2acCO8z3wKNLl",  # Gigi
                "settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.9,
                    "style": 0.8,
                    "use_speaker_boost": True
                }
            }
        }
    }
    return settings


@router.get("/health")
async def voice_health_check() -> Dict[str, Any]:
    """Check voice service health status."""
    try:
        # Check if ElevenLabs API is accessible
        api_status = await elevenlabs_tool.check_api_status()
        
        return {
            "status": "healthy" if api_status else "degraded",
            "elevenlabs_connected": api_status,
            "service": "voice-api",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "elevenlabs_connected": False,
            "error": str(e)
        }


@router.post("/batch")
async def batch_text_to_speech(request: BatchTextToSpeechRequest) -> Dict[str, Any]:
    """Convert multiple texts to speech in batch."""
    results = []
    
    for text in request.texts:
        try:
            result = await elevenlabs_tool.text_to_speech(
                text=text,
                personality=request.personality
            )
            results.append({
                "text": text,
                "audio": result["audio"],
                "duration": result.get("duration", 0.0),
                "voice_id": result.get("voice_id", ""),
                "success": True
            })
        except Exception as e:
            logger.error(f"Failed to convert text '{text[:50]}...': {str(e)}")
            results.append({
                "text": text,
                "audio": None,
                "duration": 0.0,
                "voice_id": "",
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}