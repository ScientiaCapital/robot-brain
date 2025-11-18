# Robot Brain Codebase Architecture Analysis
## Complete Implementation Guide for 5 New Features

---

## 1. CHAT API (`/api/chat`) - Core Implementation

### File Location & Structure
**Path:** `/home/user/robot-brain/robot-brain-ui/src/app/api/chat/route.ts` (151 lines)

### Request Flow
```
Client Input → Validation → Rate Limiting → Cache Check → 
Claude API Call → Conversation History → Neon DB Storage → Response
```

### Request/Response Format

**Request (POST /api/chat):**
```typescript
{
  message: string (1-1000 chars, required),
  personality: string (required, 'robot-friend'),
  sessionId?: string (optional, defaults to 'default')
}
```

**Response (200 OK):**
```typescript
{
  message: string,           // AI response text
  personality: string,       // Echo of personality
  emoji: string,            // Robot emoji
  name: string,             // Robot name
  sessionId: string,        // Session identifier
  cached: boolean,          // Cache hit flag
  responseTime: number      // Milliseconds
}
```

### Key Functions & Line Numbers

| Function | Lines | Purpose |
|----------|-------|---------|
| `POST()` | 20-151 | Main request handler |
| Rate limiting | 24-28 | 20 requests/minute per IP |
| Validation | 30-39 | Zod schema parsing |
| Cache lookup | 53-69 | Response cache check (5-min TTL) |
| Conversation history | 71-103 | In-memory Map storage per session |
| Anthropic API call | 84-90 | claude-3-haiku-20240307, 100 tokens, 0.3 temp |
| Database insert | 106-125 | Neon PostgreSQL insert |
| Error handling | 145-150 | Generic 500 error response |

### Data Flow Details

**Conversation History Management (Line 72-103):**
```typescript
const history = conversationHistory.get(sessionId) || [];
history.push({ role: 'user', content: sanitizedMessage });

const messages = history.map(msg => ({
  role: msg.role === 'user' ? 'user' : 'assistant',
  content: msg.content
}));

// Send to Claude with full history
const response = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 100,
  temperature: 0.3,
  system: robot.systemPrompt + "\n\nIMPORTANT: Keep responses under 2 sentences.",
  messages: messages
});

history.push({ role: 'assistant', content: responseText });
conversationHistory.set(sessionId, history);
```

**Important:** Conversation history is stored IN-MEMORY using a Map. This means:
- Data is lost on server restart
- Not shared across multiple instances
- Need Redis or database persistence for production multi-instance deployments

### Error Handling Patterns

1. **Validation Errors (400):** Zod parsing failures
2. **Rate Limit Errors (429):** 20 req/min exceeded
3. **Personality Errors (400):** Unknown personality
4. **API Errors (500):** Anthropic API failures → still returns response
5. **Database Errors (ignored):** Non-blocking, continues anyway (line 122-125)

### Security Features
- Input sanitization (HTML tag removal, length limits)
- Session ID validation (alphanumeric, hyphens, underscores only)
- Rate limiting (per-IP, time-windowed)
- Zod schema validation

---

## 2. VOICE/TTS API (`/api/voice/text-to-speech`) - Complete Implementation

### File Location & Structure
**Path:** `/home/user/robot-brain/robot-brain-ui/src/app/api/voice/text-to-speech/route.ts` (87 lines)

### Request/Response Format

**Request (POST /api/voice/text-to-speech):**
```typescript
{
  text: string (1-5000 chars, required),
  personality: string (required)
}
```

**Response (200 OK):**
```typescript
{
  audio: string,           // Base64-encoded MP3 audio data
  contentType: string,     // "audio/mpeg"
  model: string,          // "eleven_flash_v2_5"
  latency: string,        // e.g. "145ms"
  chunkSize: number       // Text length processed
}
```

### Key Functions & Line Numbers

| Function | Lines | Purpose |
|----------|-------|---------|
| `POST()` | 11-86 | Main TTS request handler |
| Rate limiting | 15-19 | 30 requests/minute per IP |
| Validation | 21-30 | Zod schema check |
| ElevenLabs call | 37-54 | eleven_flash_v2_5 model |
| Audio processing | 66-67 | ArrayBuffer → Base64 conversion |
| Performance tracking | 69-75 | Latency measurement |

### ElevenLabs Configuration

**Voice ID Mapping (Line 7-9):**
```typescript
const ROBOT_VOICES = {
  'robot-friend': '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, friendly
};
```

**Model Settings (Line 37-54):**
```typescript
{
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text,
    model_id: 'eleven_flash_v2_5',        // Low latency (~75ms)
    voice_settings: {
      stability: 0.5,                      // Natural variation
      similarity_boost: 0.8,               // Voice character
      style: 0.0,                          // Natural style
      use_speaker_boost: true,             // Enhanced clarity
    },
  }),
}
```

### Error Handling

- **Validation errors (400):** Invalid text or personality
- **ElevenLabs API errors:** Proxies HTTP status code + error message
- **Network errors (500):** Wrapped with descriptive message
- **Audio data errors:** Error message extraction from response

---

## 3. FRONTEND CHAT COMPONENT - State Management & Voice Integration

### Main Component Files

| File | Lines | Purpose |
|------|-------|---------|
| `/src/components/voice-first-chat.tsx` | 301 | **PRIMARY ORCHESTRATOR** - All conversation control |
| `/src/components/conversational-ai-chat.tsx` | 486 | Alternative ElevenLabs Conversational AI (future) |
| `/src/components/ui/chat.tsx` | 336 | Chat message display container |
| `/src/components/ui/message-input.tsx` | 466 | Input box with voice/file controls |

### State Management (voice-first-chat.tsx)

**Key State Variables (Lines 24-32):**
```typescript
const selectedRobot: RobotId = "robot-friend";    // Single robot for MVP
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState("");
const [isGenerating, setIsGenerating] = useState(false);
const [sessionId] = useState(() => `session-${Date.now()}`);
const [conversationMode, setConversationMode] = useState<'text' | 'voice'>('text');
```

**Message Type Definition:**
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: Array<{
    type: "text";
    text: string;
  }>;
}
```

### Complete Data Flow - From User Input to Audio Playback

```
User Action (Text/Voice)
    ↓
[MessageInput Component] (handles voice recording)
    ↓
sendMessage() function (line 84-131)
    ├─ POST /api/chat
    ├─ Parse response
    ├─ Add to messages state
    └─ Call speakResponse()
    ↓
speakResponse() function (line 35-81)
    ├─ Call streamTTSAudio()
    ├─ Setup callbacks
    ├─ Audio manager plays chunks
    └─ Update UI states
    ↓
[Audio playback in browser]
```

### TTS Audio Streaming (lines 35-81)

**Streaming Process:**
```typescript
const speakResponse = useCallback(async (text: string) => {
  if (isSpeaking) return;
  
  setIsSpeaking(true);
  try {
    const callbacks: StreamTTSCallbacks = {
      onStart: () => console.log('TTS streaming started'),
      onProgress: (progress) => console.log(`${Math.round(progress * 100)}%`),
      onChunk: () => {},
      onComplete: (totalBytes, duration) => {
        setIsSpeaking(false);
        console.log(`Completed: ${totalBytes} bytes in ${duration}ms`);
      },
      onError: async (error) => {
        console.error('TTS error:', error);
        setIsSpeaking(false);
        // Logs error to Neon (requires audio-error-logging module)
        await logAudioError(sessionId, createAudioError(...));
      }
    };
    
    await streamTTSAudio(text, selectedRobot, callbacks);
  } catch (error) {
    console.error("TTS streaming failed:", error);
    setIsSpeaking(false);
  }
}, [isSpeaking, selectedRobot, sessionId]);
```

### Voice Input Handling (lines 134-170)

**Web Speech API Integration:**
```typescript
const startVoiceInput = useCallback(async () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Speech recognition is not supported in this browser');
    return;
  }

  const recognition = new window.webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => setIsListening(true);
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    setInput(transcript);
    sendMessage(transcript);
  };
  
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('Error:', event.error);
    setIsListening(false);
  };
  
  recognition.onend = () => setIsListening(false);
  
  recognition.start();
}, [sendMessage]);
```

### Auto-restart Voice Mode (lines 173-180)

**Continuous Voice Loop:**
```typescript
useEffect(() => {
  if (conversationMode === 'voice' && 
      !isSpeaking && !isListening && !isGenerating) {
    // Auto-restart voice input after robot finishes speaking
    const timer = setTimeout(() => {
      startVoiceInput();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [conversationMode, isSpeaking, isListening, isGenerating, startVoiceInput]);
```

### UI Components Hierarchy

```
VoiceFirstChat (main orchestrator)
├── Header
│   ├── Robot emoji/name
│   ├── Status indicator
│   └── Mode toggle buttons (Voice/Text)
├── Main Chat Area
│   └── Chat component
│       ├── Welcome message (if empty)
│       ├── MessageList (with auto-scroll)
│       └── ChatForm
│           └── MessageInput
│               ├── Textarea
│               ├── Voice button
│               ├── File attachment button
│               ├── Send button
│               └── Audio visualizer (when recording)
```

---

## 4. CURRENT ERROR HANDLING PATTERNS

### Missing Module: audio-error-logging

**CRITICAL FINDING:** The module is imported but doesn't exist!

**Location:** `/src/components/voice-first-chat.tsx` line 12
```typescript
import { logAudioError, createAudioError } from "@/lib/audio-error-logging"
```

**Expected Functions (from test file):**
```typescript
// These are expected but NOT IMPLEMENTED
logAudioError(sessionId: string, audioError: AudioError): Promise<boolean>
createAudioError(type: string, message: string, duration?: number, chunkCount?: number): AudioError
getAudioErrorStats(sessionId: string): Promise<AudioErrorStats | null>
```

**Current Error Handling Gaps:**
- TTS errors log to console, not database (line 62-72 of voice-first-chat.tsx)
- No persistent error tracking
- No error aggregation or analytics

### Existing Error Handling Patterns

**API Route Error Handling (chat/route.ts):**
```typescript
// 1. Validation errors → 400
if (!validationResult.success) {
  return NextResponse.json({ 
    error: 'Invalid input',
    details: validationResult.error.issues
  }, { status: 400 });
}

// 2. Rate limit → 429
if (!checkRateLimit(ip, 20, 60000)) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}

// 3. Unknown personality → 400
if (!robot) {
  return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
}

// 4. API errors → 500 (but DB continues)
try {
  // DB insert
} catch (dbError) {
  console.error('Database error:', dbError);
  // Continue anyway - don't block user
}

// 5. Generic error → 500
catch (error) {
  console.error('Chat API error:', error);
  return NextResponse.json(
    { error: 'Failed to process chat message' },
    { status: 500 }
  );
}
```

**Frontend Error Handling (voice-first-chat.tsx):**
```typescript
// Response error check
if (!response.ok) {
  console.error("Chat API error:", await response.text());
  alert("Sorry, I couldn't process your message. Please try again.");
}

// TTS error handling
onError: async (error) => {
  console.error('TTS streaming error:', error);
  setIsSpeaking(false);
  try {
    await logAudioError(sessionId, createAudioError(...));
  } catch (logError) {
    console.error('Failed to log audio error:', logError);
  }
}

// Voice input error
recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
  console.error('Speech recognition error:', event.error);
  setIsListening(false);
};

// General try-catch with alert
catch (error) {
  console.error("Failed to send message:", error);
  alert("Sorry, something went wrong. Please try again.");
}
```

---

## 5. DATABASE SCHEMA - Neon PostgreSQL

### Current Schema (Production)

**Location:** `/home/user/robot-brain/robot-brain-ui/src/app/api/chat/route.ts` lines 106-121

**Conversations Table:**
```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_personality varchar NOT NULL,
  user_message text NOT NULL,
  robot_response text NOT NULL,
  session_id varchar,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

**SQL Insert Pattern (from route.ts):**
```typescript
await sql`
  INSERT INTO conversations (
    session_id,
    robot_personality,
    user_message,
    robot_response,
    created_at
  ) VALUES (
    ${validatedSessionId},
    ${personality},
    ${sanitizedMessage},
    ${responseText},
    NOW()
  )
`;
```

### Additional Tables (Defined but not fully implemented)

```sql
CREATE TABLE sessions (
  -- Session management (not yet implemented)
);

CREATE TABLE embeddings (
  -- Vector embeddings for semantic search (not yet implemented)
);

CREATE TABLE robot_interactions (
  -- Detailed interaction tracking (not yet implemented)
);

CREATE TABLE tool_usage (
  -- Tool/function call tracking (not yet implemented)
);
```

### Expected Metadata Structure (for audio errors)

Based on test expectations:
```typescript
metadata: {
  audio_errors: [
    {
      type: 'tts_streaming' | 'network' | 'audio_decode' | 'unknown',
      message: string,
      timestamp: number,
      duration?: number,
      chunkCount?: number
    }
  ],
  audio_error_count: number,
  last_audio_error: number  // timestamp
}
```

### Connection Details

```
Host: ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech
Database: neondb
Port: 5432
SSL: Required
Connection String: postgresql://neondb_owner:***@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

---

## 6. SUPPORTING LIBRARIES & UTILITIES

### Response Caching (`/src/lib/response-cache.ts`)

```typescript
class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxAge: number = 5 * 60 * 1000;  // 5 minutes
  private maxSize: number = 100;           // Max 100 entries

  generateKey(params: Record<string, any>): string
  get(key: string): any | null
  set(key: string, data: any): void
  clear(): void
  getStats(): { size, hits, entries[] }
}

export const responseCache = new ResponseCache();
export function logCachePerformance(): void
```

**Usage in Chat API (line 53-69):**
- Generate cache key from message + personality
- Check cache before API call
- Store response after successful API call
- Log performance every 10 requests (10% sampling)

### Audio Streaming (`/src/lib/audio-streaming.ts`)

**AudioStreamManager Class:**
```typescript
class AudioStreamManager {
  private audioContext: AudioContext | null;
  private currentSource: AudioBufferSourceNode | null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;

  async initialize(): Promise<void>           // Resume suspended audio context
  async addAudioChunk(audioData: ArrayBuffer): Promise<void>
  private playNextInQueue(): void
  stop(): void
  destroy(): void
  getState(): AudioContextState | null
}

export function getAudioStreamManager(): AudioStreamManager  // Singleton

export interface StreamTTSCallbacks {
  onStart?: () => void;
  onChunk?: (chunk: Uint8Array, loaded: number, total: number) => void;
  onComplete?: (totalBytes: number, duration: number) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export async function streamTTSAudio(
  text: string,
  voiceId: string,
  callbacks?: StreamTTSCallbacks
): Promise<void>
```

**Metrics Tracking:**
```typescript
interface AudioStreamingMetricsStats {
  totalRequests: number;
  totalErrors: number;
  totalLatency: number;
  totalFirstByteLatency: number;
  averageLatency: number;
  averageChunksPerRequest: number;
  errorRate: number;
  errorTypes: Record<string, number>;
}

export const AudioStreamingMetrics  // Singleton with recordRequest/recordError
```

### Audio Recording & Processing (`/src/lib/audio-utils.ts`)

```typescript
class AudioRecorder {
  static isSupported(): boolean
  async startRecording(options?: AudioRecordingOptions): Promise<void>
  async stopRecording(): Promise<Blob | null>
  getState(): RecordingState | null
}

export async function blobToBase64(blob: Blob): Promise<string>
export function base64ToBlob(base64: string, mimeType?: string): Blob
export async function getAudioDuration(blob: Blob): Promise<number>
export async function recordAudio(options?: AudioRecordingOptions): Promise<...>
export function createAudioVisualizer(audioContext, source, canvas): () => void
```

### Input Validation (`/src/lib/validation.ts`)

```typescript
export const schemas = {
  chatRequest: z.object({
    message: z.string().min(1).max(1000),
    personality: z.string(),
    sessionId: z.string().optional()
  }),
  ttsRequest: z.object({
    text: z.string().min(1).max(5000),
    personality: z.string()
  })
};

export function sanitizeInput(input: string): string
export function validateSessionId(sessionId: string): string
export function getClientIP(request: NextRequest): string
export function checkRateLimit(identifier, maxRequests, windowMs): boolean
```

### Performance Monitoring (`/src/lib/performance-monitor.ts`)

```typescript
class PerformanceMonitor {
  startTimer(name: string): void
  endTimer(name: string, tags?: Record<string, string>): number
  recordMetric(name: string, value: number, tags?: Record<string, string>): void
  getMetrics(name?, startTime?, endTime?): PerformanceMetric[]
  generateReport(timeWindowMs?): PerformanceReport
  clear(): void
  logSummary(): void
}

export const performanceMonitor = new PerformanceMonitor();
export async function measureAsync<T>(name, fn, tags?): Promise<T>
export function measureSync<T>(name, fn, tags?): T
```

### Robot Configuration (`/src/lib/robot-config.ts`)

```typescript
export interface RobotPersonality {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  voiceId: string;
  welcomeMessage: string;
  traits: string[];
  tools?: string[];
}

export const ROBOT_PERSONALITIES: Record<string, RobotPersonality> = {
  'robot-friend': {
    id: 'robot-friend',
    name: 'Robot Friend',
    emoji: '😊',
    description: 'A cheerful and supportive companion for kids',
    systemPrompt: 'You are Robot Friend, a cheerful and supportive robot...',
    voiceId: '21m00Tcm4TlvDq8ikWAM',  // Rachel - ElevenLabs
    welcomeMessage: "Hi there! I'm Robot Friend! 😊...",
    traits: ['cheerful', 'supportive', 'enthusiastic']
  }
};

export function getRobotPersonality(id: string): RobotPersonality | undefined
export function getAllRobots(): RobotPersonality[]
```

---

## 7. HOOKS & STATE MANAGEMENT

### useRobotSelection (`/src/hooks/useRobotSelection.ts`)

```typescript
interface UseRobotSelectionReturn {
  selectedRobot: RobotId | null;
  isRobotSelected: boolean;
  selectRobot: (robotId: RobotId) => void;
  clearSelection: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredRobots: RobotId[];
  isRobotAvailable: (robotId: string) => boolean;
  getRobotInfo: (robotId: string) => RobotPersonality | null;
  selectionHistory: RobotId[];
  getMostRecentSelection: () => RobotId | null;
  isFavorite: (robotId: string) => boolean;
  toggleFavorite: (robotId: RobotId) => void;
  favoriteRobots: RobotId[];
}

// Features:
- Selection with 5-item history (line 30-32)
- Search across name, ID, and traits (line 40-56)
- Favorite tracking (line 80-87)
- useMemo optimization (line 40, 56)
- useCallback memoization throughout
```

### useAudioRecording (`/src/hooks/use-audio-recording.ts`)

```typescript
interface UseAudioRecordingOptions {
  transcribeAudio?: (blob: Blob) => Promise<string>;
  onTranscriptionComplete?: (text: string) => void;
}

function useAudioRecording({
  transcribeAudio,
  onTranscriptionComplete,
}): {
  isListening: boolean;
  isSpeechSupported: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  audioStream: MediaStream | null;
  toggleListening: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

// Features:
- Browser speech support detection (line 21-30)
- getUserMedia integration (line 63-65)
- recordAudio function usage (line 69)
- Audio stream cleanup (line 50-52)
- Transcription callback pipeline (line 41-42)
```

### useAutoScroll (`/src/hooks/use-auto-scroll.ts`)

Used in ChatMessages component for auto-scroll behavior

### useAutosizeTextarea (`/src/hooks/use-autosize-textarea.ts`)

Used in MessageInput component for dynamic textarea sizing

---

## 8. MIDDLEWARE & SECURITY

### Next.js Middleware (`/src/middleware.ts`)

**Security Headers:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block

**Content Security Policy:**
- default-src 'self'
- connect-src includes: api.anthropic.com, api.elevenlabs.io

**API Route Configuration:**
- CORS for specific origins
- Gzip/Deflate compression support
- Cache-Control headers:
  - Chat: 60s public + 300s stale-while-revalidate
  - Voice: 300s public + 600s stale-while-revalidate
  - Static assets: 1 year (immutable)
  - Images: 30 days

---

## 9. TESTING STRUCTURE

### Test Files & Coverage

| Test File | Purpose | Key Test Cases |
|-----------|---------|-----------------|
| `__tests__/api/chat.test.ts` | Chat API validation | Validation, caching, history, errors |
| `__tests__/api/voice/text-to-speech.test.ts` | TTS API | Model config, voice settings, error handling |
| `__tests__/audio-error-logging.test.ts` | Error logging | logAudioError, getAudioErrorStats (MISSING MODULE) |
| `__tests__/audio-streaming.test.ts` | Audio streaming | Audio playback, metrics, error handling |
| `__tests__/performance.test.ts` | Performance monitor | Timer, metrics, reports |
| `__tests__/hooks/useRobotSelection.test.ts` | Robot selection hook | Selection, search, favorites |

### Chat API Test Example (from test file)

```typescript
describe('Chat API Route', () => {
  describe('Request Validation', () => {
    // Tests for missing message, missing personality, invalid personality
  });
  
  describe('Successful Chat', () => {
    // Tests for valid response, token limit enforcement, history inclusion
  });
  
  describe('Database Storage', () => {
    // Tests for INSERT INTO conversations
  });
  
  describe('Error Handling', () => {
    // Tests for Anthropic errors, database errors, graceful degradation
  });
  
  describe('Performance', () => {
    // Tests for cache usage, history limits
  });
});
```

---

## 10. IMPLEMENTATION GAPS & REQUIRED MODULES

### CRITICAL: Missing audio-error-logging Module

**Status:** Imported but not implemented

**Required implementation at:** `/src/lib/audio-error-logging.ts`

**Expected interface:**
```typescript
interface AudioError {
  type: 'tts_streaming' | 'network' | 'audio_decode' | 'unknown';
  message: string;
  timestamp: number;
  duration?: number;
  chunkCount?: number;
}

export function createAudioError(
  type: string,
  message: string,
  duration?: number,
  chunkCount?: number
): AudioError

export async function logAudioError(
  sessionId: string,
  audioError: AudioError
): Promise<boolean>

export async function getAudioErrorStats(
  sessionId: string
): Promise<{
  totalErrors: number;
  errorsByType: Record<string, number>;
  lastError: AudioError | null;
} | null>
```

### Other Implementation Gaps

1. **Conversation Memory** - Only in-memory, lost on restart
2. **Streaming Responses** - Not implemented (all responses are complete)
3. **Error Boundaries** - No React error boundary components
4. **Analytics** - Basic performance monitoring only, no usage analytics
5. **PWA** - No service worker, no offline support

---

## 11. KEY DEPLOYMENT DETAILS

### Environment Variables Required

```bash
# Database
NEON_DATABASE_URL=postgresql://neondb_owner:***@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-***
ELEVENLABS_API_KEY=sk_***

# Optional
NEXT_PUBLIC_API_URL=                    # Defaults to same origin
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=        # For ConversationalAI mode
```

### Deployment Target

- **Platform:** Vercel (Next.js serverless)
- **Database:** Neon PostgreSQL (serverless)
- **Build:** `npm run build`
- **Runtime:** Node.js 18+

---

## 12. QUICK REFERENCE - KEY FILE PATHS

| Feature | File Path | Lines |
|---------|-----------|-------|
| **Chat API** | `/src/app/api/chat/route.ts` | 1-151 |
| **TTS API** | `/src/app/api/voice/text-to-speech/route.ts` | 1-87 |
| **Main Chat UI** | `/src/components/voice-first-chat.tsx` | 1-301 |
| **Chat Container** | `/src/components/ui/chat.tsx` | 1-336 |
| **Message Input** | `/src/components/ui/message-input.tsx` | 1-466 |
| **Voice Config** | `/src/lib/robot-config.ts` | 1-58 |
| **Validation** | `/src/lib/validation.ts` | 1-87 |
| **Response Cache** | `/src/lib/response-cache.ts` | 1-108 |
| **Audio Streaming** | `/src/lib/audio-streaming.ts` | 1-318 |
| **Performance Monitor** | `/src/lib/performance-monitor.ts` | 1-170 |
| **useRobotSelection** | `/src/hooks/useRobotSelection.ts` | 1-105 |
| **useAudioRecording** | `/src/hooks/use-audio-recording.ts` | 1-93 |
| **Middleware** | `/src/middleware.ts` | 1-83 |
| **Test: Chat API** | `/__tests__/api/chat.test.ts` | 1-356 |
| **Test: TTS API** | `/__tests__/api/voice/text-to-speech.test.ts` | 1-413 |

