# Robot Brain Architecture

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (inferred from modern Next.js practices)
- **UI Framework**: React 18+ with functional components and hooks
- **Styling**: Tailwind CSS (common with Next.js)
- **State Management**: React useState/useReducer (minimal MVP approach)

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **API Framework**: Next.js API Routes
- **Authentication**: None (MVP - public chat interface)

### External Services
- **AI Provider**: Anthropic Claude API
- **Text-to-Speech**: ElevenLabs API
- **Database**: Neon PostgreSQL (serverless Postgres)
- **Deployment**: Vercel (optimized for Next.js)

### Development Tools
- **Testing**: Jest + React Testing Library (inferred from npm scripts)
- **Linting**: ESLint + Prettier (standard Next.js setup)
- **Package Manager**: npm

## 2. Design Patterns

### Frontend Patterns
- **Component-Based Architecture**: React functional components
- **Container/Presenter Pattern**: Separation of logic and presentation
- **Custom Hooks**: For voice recording, API calls, and state management
- **Context API**: Potential for theme/voice mode management

### Backend Patterns
- **API Route Handlers**: Next.js file-based routing
- **Service Layer**: External API abstraction
- **Repository Pattern**: Database operations abstraction

### Application Patterns
- **MVP (Model-View-Presenter)**: Focus on core functionality first
- **Event-Driven Architecture**: Voice recording events, chat messages
- **Strategy Pattern**: Different AI providers (currently Claude)

## 3. Key Components

### Frontend Components
```
src/
├── app/
│   ├── page.tsx (Main chat interface)
│   ├── layout.tsx (Root layout)
│   └── globals.css (Global styles)
├── components/
│   ├── ChatInterface/
│   │   ├── ChatMessage.tsx (Individual message display)
│   │   ├── MessageInput.tsx (Text input area)
│   │   └── VoiceToggle.tsx (Voice/text mode switch)
│   ├── VoiceRecorder/
│   │   ├── VoiceButton.tsx (Microphone UI)
│   │   └── useVoiceRecording.ts (Voice recording hook)
│   └── RobotAvatar/
│       └── RobotDisplay.tsx (Robot visual representation)
```

### Backend Components
```
src/
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts (Claude API integration)
│       ├── voice/
│       │   └── text-to-speech/
│       │       └── route.ts (ElevenLabs TTS)
│       └── conversations/
│           └── route.ts (Database operations)
```

### Core Services
- **AIService**: Anthropic Claude integration
- **TTSService**: ElevenLabs text-to-speech
- **ConversationService**: Database operations
- **VoiceService**: Browser audio API management

## 4. Data Flow

### Text Chat Flow
1. **User Input** → MessageInput component captures text
2. **API Call** → `/api/chat` route called with message
3. **AI Processing** → Claude API generates response
4. **Database Storage** → Conversation saved to Neon PostgreSQL
5. **TTS Conversion** → Response sent to ElevenLabs
6. **UI Update** → Message displayed and audio played

### Voice Chat Flow
1. **Voice Recording** → useVoiceRecording hook captures audio
2. **Speech-to-Text** → Browser SpeechRecognition API
3. **AI Processing** → Same as text flow through `/api/chat`
4. **Response Generation** → Claude processes voice input
5. **Audio Playback** → ElevenLabs TTS streams response

### Data Persistence Flow
```
User Message → API Route → ConversationService → PostgreSQL
              ↓
AI Response → TTS Service → Audio Stream → Client
```

## 5. External Dependencies

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0", 
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0"
}
```

### API Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.0.0", // Anthropic Claude
  "elevenlabs": "^1.0.0", // Text-to-speech
  "pg": "^8.0.0", // PostgreSQL client
  "@neondatabase/serverless": "^0.0.0" // Neon integration
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "jest": "^29.0.0",
  "@testing-library/react": "^13.0.0"
}
```

## 6. API Design

### RESTful Endpoints

#### POST `/api/chat`
```typescript
// Request
{
  message: string;
  conversationId?: string;
  voiceMode?: boolean;
}

// Response
{
  response: string;
  conversationId: string;
  audioUrl?: string; // If voice mode enabled
}
```

#### POST `/api/voice/text-to-speech`
```typescript
// Request
{
  text: string;
  voiceId?: string; // Default robot voice
}

// Response
{
  audioUrl: string;
  audioContent: ArrayBuffer; // Streamable audio
}
```

#### GET/POST `/api/conversations`
```typescript
// GET Response
{
  conversations: Array<{
    id: string;
    createdAt: Date;
    messages: Array<ChatMessage>;
  }>;
}

// POST Request
{
  message: string;
  response: string;
  userId?: string; // Anonymous for MVP
}
```

## 7. Database Schema

### PostgreSQL Tables (Neon)

#### conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255), -- Anonymous user tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
```

#### messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  created_at TIMESTAMP DEFAULT NOW(),
  voice_mode BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

## 8. Security Considerations

### API Security
- **Rate Limiting**: Implement on API routes to prevent abuse
- **Input Validation**: Sanitize all user inputs and AI responses
- **CORS Configuration**: Restrict to Vercel domain
- **API Key Management**: Store secrets in environment variables

### Data Security
- **Database Encryption**: Neon PostgreSQL at-rest encryption
- **Anonymous Data**: No PII collection in MVP
- **Content Filtering**: Filter inappropriate content for kids

### Client Security
- **XSS Prevention**: React's built-in XSS protection
- **Audio Permissions**: Secure microphone access handling
- **HTTPS Enforcement**: Vercel automatic SSL

## 9. Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **Lazy Loading**: Voice recorder loaded on demand

### Backend Optimizations
- **Edge Runtime**: API routes on Vercel Edge Network
- **Database Connection Pooling**: Neon connection pooling
- **Caching**: Implement Redis for frequent responses
- **Streaming Responses**: Real-time AI response streaming

### External Service Optimizations
- **AI Response Caching**: Cache common responses
- **Audio File Caching**: CDN caching for TTS audio
- **Database Indexing**: Optimized query performance

## 10. Deployment Strategy

### Vercel Deployment
```
Development Workflow:
1. Code → GitHub Repository
2. CI/CD → Vercel Automatic Deploys
3. Preview → Vercel Preview Deployments
4. Production → Vercel Production Deployment
```

### Environment Configuration
```env
# Production Environment
ANTHROPIC_API_KEY=prod_key
ELEVENLABS_API_KEY=prod_key
DATABASE_URL=neon_prod_connection
NEXT_PUBLIC_APP_URL=https://robot-brain.vercel.app
```

### Deployment Process
1. **Automatic Deploys**: Push to main triggers production deploy
2. **Preview Deploys**: PRs generate preview deployments
3. **Environment Variables**: Managed in Vercel dashboard
4. **Rollback Strategy**: Instant rollback through Vercel

### Monitoring & Observability
- **Vercel Analytics**: Performance monitoring
- **Error Tracking**: Next.js error boundaries
- **Database Monitoring**: Neon performance insights
- **API Monitoring**: External service health checks

---

*This architecture follows the MVP philosophy of "ONE thing working perfectly" while maintaining scalability for future robot additions and feature enhancements.*