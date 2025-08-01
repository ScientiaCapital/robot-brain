# 🎙️ ElevenLabs Voice Integration - Complete Reference

## 🚀 Critical Information for Robot Brain Voice Features

### API Key Configuration
```bash
# Add to .env and .env.production files (never commit actual key)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## 📡 ElevenLabs API Endpoints

### 1. Core Text-to-Speech APIs
- **Stream API**: `POST /v1/text-to-speech/:voice_id/stream`
  - Real-time audio streaming
  - Low latency for immediate kid feedback
  - Supports previous_text/next_text for conversation continuity

- **Convert API**: `POST /v1/text-to-speech/:voice_id`
  - Standard text-to-speech conversion
  - Returns complete audio file

- **Convert with Timestamps**: `POST /v1/text-to-speech/:voice_id/with-timestamps`
  - Character-level timing information
  - Perfect for robot avatar lip-sync animations

### 2. Advanced Streaming APIs
- **WebSocket Stream Input**: `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input`
  - Partial text streaming as it's generated
  - Word-to-audio alignment information
  - Ideal for real-time robot conversations

- **Multi-Stream WebSocket**: `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/multi-stream-input`
  - Multiple independent conversation contexts
  - Perfect for simultaneous robot personalities
  - Reduces connection overhead

- **Stream with Timestamps**: Real-time streaming + character timing
  - JSON chunks with base64 audio + timing data
  - Enables word highlighting during robot speech

### 3. Model Selection for Kids
- **eleven_flash_v2_5**: ~75ms latency, limited text normalization
- **eleven_multilingual_v2**: Better text normalization, higher latency
- **Recommendation**: Flash v2.5 for kids (attention span), preprocess text for numbers

## 🎭 Robot Personality Voice Mapping
```python
ROBOT_VOICES = {
    "friend": "JBFqnCBsd6RMkjVDRZzb",  # Warm, encouraging
    "nerd": "pNInz6obpgDQGcFmaJgB",    # Excited, enthusiastic  
    "zen": "AZnzlk1XvdvUeBnXmlld",     # Calm, patient
    "pirate": "EXAVITQu4vr4xnSDxMaL",  # Adventurous, fun
    "drama": "MF3mGyEYCl7XYWbV9V6O"   # Expressive, theatrical
}
```

## 🎯 Kid-Optimized Voice Settings
```python
voice_settings = VoiceSettings(
    stability=0.5,        # Moderate stability
    similarity_boost=0.8, # Good similarity to original
    style=0.2,            # Slight personality style
    use_speaker_boost=True # Enhanced clarity for kids
)
```

## 🤖 Conversational AI Features

### LLM Customization
- **Providers**: OpenAI, Google Gemini, Anthropic Claude
- **Selection Factors**: Task complexity, latency, context window, cost
- **Gemini**: Balanced performance, large context windows
- **Claude**: Helpfulness and safety (perfect for kids)
- **Max System Prompt**: 2MB limit

### Widget Integration
- **Multimodal Modes**: Voice only, Voice + text, Text only
- **Customization**: Avatar images, orb gradients, button texts
- **Runtime Config**: Dynamic variables, overrides
- **SDKs**: Next.js, React, Python (type-safe)

### Conversation Flow Control
- **Timeouts**: 1-30 seconds for user silence
  - Kids: 5-10 seconds (shorter attention spans)
  - Thinking tasks: 10-30 seconds
- **Interruptions**: Enable for natural flow, disable for critical messages

### Client Tools
- **Browser Integration**: DOM manipulation, UI notifications
- **Wait for Response**: Interactive workflows
- **Use Cases**: Robot avatar animations, UI state changes

### Personalization
- **Dynamic Variables**: `{{ var_name }}` syntax
- **Overrides**: Complete prompt/voice/language replacement
- **User Context**: `conversation_initiation_client_data` object

## 🔗 MCP (Model Context Protocol) Integration

### Educational MCP Servers
- **Astro Docs**: `https://mcp.docs.astro.build/mcp` (Open auth)
- **Cloudflare Docs**: `https://docs.mcp.cloudflare.com/sse` (Open auth)
- **OneContext RAG**: `https://rag-mcp-2.whatsmcp.workers.dev/sse` (OAuth2.1)

### Robot Enhancement Opportunities
- **Documentation Servers**: Real-time learning content for educational robots
- **RAG-as-a-Service**: Enhanced robot knowledge base
- **GitHub Integration**: Coding assistance for Nerd robot
- **8,000+ Apps**: Via Zapier MCP integration

### Security Considerations
- Trust evaluation critical for kid-safe applications
- Open authentication servers safest for educational use
- Not available for Zero Retention Mode or HIPAA users

## 🎵 Technical Implementation Patterns

### Text Preprocessing for Kids
```python
def preprocess_for_kids(text: str) -> str:
    # Convert numbers to words (Flash v2.5 limitation)
    text = re.sub(r'\b5\b', 'five', text)
    text = re.sub(r'\$(\d+)', r'\1 dollars', text)
    text = re.sub(r'(\d{1,2}):(\d{2})', r'\1 \2', text)
    return text
```

### Streaming with Continuity
```python
# Enable conversation flow continuity
response = client.text_to_speech.stream(
    text=current_text,
    previous_text=last_robot_message,  # Context for natural flow
    next_text=anticipated_response,    # Helps with pronunciation
    voice_id=robot_voice_id,
    model_id="eleven_flash_v2_5"
)
```

### Base64 Audio for Browser
- No file handling required
- Direct browser playback capability
- Perfect for web-based robot interactions

### Multi-Context WebSocket
- Each robot personality = independent context
- Concurrent conversations supported
- Reduced connection overhead vs individual connections

## 🎯 Production Implementation Strategy

### Hour 1: Core Setup ✅
- Dependencies installed: elevenlabs==2.8.1
- API key configured in environment
- ElevenLabsTool implemented with TDD

### Hour 2: FastAPI Integration
- Voice endpoints with streaming support
- Robot personality voice mapping
- WebSocket support for real-time interaction

### Hour 3: Kid-Friendly Frontend
- Voice recording components
- Real-time audio playback
- Visual feedback during robot speech

### Hour 4: Polish & Testing
- Voice ID mapping for all robot personalities
- Kid testing and immediate feedback incorporation
- Performance optimization for <75ms latency

## 🚨 Critical Success Factors
1. **Latency**: <75ms using Flash v2.5 model
2. **Preprocessing**: Handle numbers/dates for clear speech
3. **Continuity**: Use previous_text/next_text for natural flow
4. **Visual Feedback**: Kids need to see when robots are "listening/thinking/talking"
5. **Error Recovery**: Kid-friendly "let's try again" messages
6. **Safety**: All MCP integrations thoroughly vetted for child safety

---
*This document contains all critical ElevenLabs integration information for Robot Brain voice features. Keep updated as implementation progresses.*