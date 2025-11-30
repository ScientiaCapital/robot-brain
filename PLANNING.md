# Robot Friend - Architecture & Planning

**CRITICAL RULE**: NO OpenAI models - Use Anthropic Claude, Google Gemini, or OpenRouter only

**Project**: Robot Friend (Kids AI Chat)
**Location**: `/Users/tmkipper/Desktop/tk_projects/robot-brain`
**Last Updated**: 2024-11-30

---

## Project Vision

Build a safe, engaging AI chat companion for kids (ages 5-13) that:
- Uses voice and text for natural conversations
- Ensures kids-safety through multi-layer content filtering
- Empowers parents with full transparency and controls
- Delivers educational value through storytelling and learning games

**Core Principle**: Kids safety first, always.

---

## Tech Stack Decisions

### Frontend
| Technology | Version | Decision Rationale |
|------------|---------|-------------------|
| Next.js | 15.x | App Router, Server Components, streaming |
| TypeScript | 5.x | Type safety for kids-safety critical features |
| React | 18.x | Hooks, Suspense for better UX |
| Tailwind CSS | 3.x | Rapid UI development, mobile-first |
| Vercel | Latest | Zero-config deployment, edge functions |

**Why Next.js 15?**
- App Router for better code organization
- Server Components reduce client bundle size
- Streaming for faster perceived performance
- Built-in API routes for backend logic

### Backend & AI
| Technology | Version | Decision Rationale |
|------------|---------|-------------------|
| **Anthropic Claude** | 3.5 Sonnet | **PRIMARY AI** - Superior safety, quality |
| OpenRouter | Latest | Fallback for Anthropic Claude |
| Cartesia | Latest | Best kids-friendly voice synthesis |
| ❌ OpenAI | FORBIDDEN | Not used per project rules |

**Why Anthropic Claude?**
- Best-in-class content safety features
- Constitutional AI reduces harmful outputs
- Lower hallucination rate than competitors
- Excellent at following system prompts for kids-safety

**Why NOT OpenAI?**
- Project requirement: No OpenAI models
- Claude is safer for kids content

### Database & Auth
| Technology | Version | Decision Rationale |
|------------|---------|-------------------|
| Supabase | Latest | PostgreSQL + Auth + RLS in one |
| PostgreSQL | 15+ | Robust, ACID compliance for safety logs |
| Row Level Security | Built-in | Parent-child data isolation |

**Why Supabase?**
- Built-in authentication (email, phone)
- Row Level Security for parent-child data separation
- Real-time subscriptions for live chat updates
- Edge Functions for serverless compute

---

## Architecture Diagrams

### High-Level System Architecture
```
┌─────────────────────────────────────────────────┐
│               User (Child/Parent)               │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         Next.js 15 Frontend (Vercel)            │
│  ┌─────────────┐  ┌──────────────┐             │
│  │ Chat UI     │  │ Parent Panel │             │
│  │ (Voice+Text)│  │ (Monitoring) │             │
│  └─────────────┘  └──────────────┘             │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│        Next.js API Routes (Server-Side)         │
│  ┌──────────────┐  ┌───────────────┐           │
│  │ /api/chat    │  │ /api/voice    │           │
│  │ (Text chat)  │  │ (Voice chat)  │           │
│  └──────────────┘  └───────────────┘           │
└───────────┬─────────────────┬───────────────────┘
            │                 │
            ▼                 ▼
┌────────────────────┐  ┌────────────────────┐
│ Anthropic Claude   │  │ Cartesia TTS       │
│ (3.5 Sonnet)       │  │ (Voice Synthesis)  │
│ ✅ Primary AI      │  │                    │
│ ❌ NO OpenAI       │  │                    │
└────────────────────┘  └────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────┐
│           Supabase PostgreSQL                   │
│  ┌──────────────┐  ┌───────────────┐           │
│  │ Conversations│  │ Safety Logs   │           │
│  │ (RLS enabled)│  │ (Audit trail) │           │
│  └──────────────┘  └───────────────┘           │
└─────────────────────────────────────────────────┘
```

### Data Flow: Chat Message
```
1. Child types/speaks message
   ↓
2. Frontend: Pre-validation (length, basic profanity)
   ↓
3. POST /api/chat { message, childId, mode }
   ↓
4. Backend: Content filtering layer 1
   ↓ (if safe)
5. Anthropic Claude API call
   model: claude-3-5-sonnet-20241022
   system: "You are a friendly robot for kids..."
   ↓
6. Backend: Response sanitization layer 2
   ↓
7. Supabase: Log conversation (for parent review)
   ↓
8. Cartesia: Text-to-speech (if voice mode)
   ↓
9. Return { reply, audioUrl } to frontend
   ↓
10. Display message + play voice
```

### Authentication Flow
```
1. Parent signs up (email or phone)
   ↓
2. Supabase Magic Link / OTP
   ↓
3. Create parent profile
   ↓
4. Parent creates child profile(s)
   ↓
5. Child logs in (simplified, no password)
   ↓
6. Child accesses chat (RLS ensures data isolation)
```

---

## Database Schema

### Core Tables
```sql
-- Parents (authenticated users)
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  auth_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children (managed by parents)
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 5 AND age <= 13),
  avatar_url TEXT,
  daily_time_limit_minutes INTEGER DEFAULT 60,
  daily_message_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  mode TEXT CHECK (mode IN ('friendly', 'educational', 'storytelling')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- Conversation logs
CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  voice_url TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety logs (for incidents)
CREATE TABLE safety_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  user_input TEXT,
  ai_response TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  reviewed_by UUID REFERENCES parents(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)
```sql
-- Parents can only see their own children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their children"
  ON children
  FOR ALL
  USING (parent_id IN (
    SELECT id FROM parents WHERE auth_id = auth.uid()
  ));

-- Parents can view their children's conversations
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view child conversations"
  ON conversation_logs
  FOR SELECT
  USING (child_id IN (
    SELECT id FROM children
    WHERE parent_id IN (
      SELECT id FROM parents WHERE auth_id = auth.uid()
    )
  ));
```

---

## AI Model Configuration

### Anthropic Claude Setup
```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODELS = {
  PRIMARY: 'claude-3-5-sonnet-20241022',
  FALLBACK: 'claude-3-opus-20240229',
} as const;

export const getChatResponse = async (
  message: string,
  childAge: number,
  mode: 'friendly' | 'educational' | 'storytelling'
) => {
  const systemPrompts = {
    friendly: `You are a cheerful robot friend chatting with a ${childAge}-year-old child.
               Be warm, encouraging, and fun. Ask questions to keep the conversation going.`,
    educational: `You are an educational robot helping a ${childAge}-year-old learn.
                  Explain concepts simply with fun examples. Encourage curiosity.`,
    storytelling: `You are a creative robot telling stories to a ${childAge}-year-old.
                   Create age-appropriate tales with positive messages.`,
  };

  const response = await anthropic.messages.create({
    model: MODELS.PRIMARY,
    max_tokens: 1024,
    temperature: 0.7,
    system: `${systemPrompts[mode]}

SAFETY RULES (CRITICAL):
- Never discuss: violence, weapons, drugs, alcohol, politics, religion
- Keep all content G-rated and positive
- If asked inappropriate questions, redirect to fun topics
- Encourage learning, creativity, kindness
- If unsure, err on the side of caution`,
    messages: [
      { role: 'user', content: message }
    ],
  });

  return response.content[0].text;
};
```

### Cost Management
```typescript
// Track API costs
const COST_PER_1M_TOKENS = {
  input: 3.00,   // $3 per 1M input tokens
  output: 15.00, // $15 per 1M output tokens
};

const estimateCost = (inputTokens: number, outputTokens: number) => {
  const inputCost = (inputTokens / 1_000_000) * COST_PER_1M_TOKENS.input;
  const outputCost = (outputTokens / 1_000_000) * COST_PER_1M_TOKENS.output;
  return inputCost + outputCost;
};

// Alert if daily costs exceed threshold
const DAILY_BUDGET = 10.00; // $10/day
```

---

## Kids-Safety Architecture

### Multi-Layer Content Filtering
```
Layer 1: Frontend Pre-Validation
  ├─ Length check (max 500 chars)
  ├─ Basic profanity filter
  └─ Rate limiting (max 50 msgs/hour)
          ↓
Layer 2: Backend Content Filter
  ├─ Advanced profanity detection
  ├─ Topic classification (block politics, etc)
  └─ Sentiment analysis (detect distress)
          ↓
Layer 3: Anthropic Claude System Prompt
  ├─ Constitutional AI safety
  ├─ System prompt safety rules
  └─ Model refusal training
          ↓
Layer 4: Response Sanitization
  ├─ Output profanity check
  ├─ Hallucination detection
  └─ Age-appropriateness verification
          ↓
Layer 5: Post-Conversation Logging
  ├─ Log all messages to Supabase
  ├─ Flag suspicious patterns
  └─ Parent review dashboard
```

### Parental Controls
```typescript
interface ParentControls {
  // Time limits
  dailyTimeLimitMinutes: number; // Default: 60
  sessionTimeoutMinutes: number; // Default: 30

  // Message limits
  dailyMessageLimit: number; // Default: 50
  messageRateLimit: number; // Default: 10/min

  // Content controls
  allowedModes: Array<'friendly' | 'educational' | 'storytelling'>;
  blockedTopics: string[]; // Custom blocked topics

  // Monitoring
  alertOnFlaggedContent: boolean; // Email parent
  reviewConversationsDaily: boolean; // Reminder

  // Emergency
  pauseChatAccess: boolean; // Instant disable
}
```

---

## API Design

### Endpoints

#### POST /api/chat
Text-based chat with Anthropic Claude
```typescript
Request:
{
  "message": "What's your favorite color?",
  "childId": "uuid",
  "sessionId": "uuid",
  "mode": "friendly"
}

Response:
{
  "reply": "I love blue, like the ocean! What's your favorite?",
  "model": "claude-3-5-sonnet-20241022",
  "tokens": { "input": 150, "output": 80 },
  "cost": 0.0015,
  "flagged": false
}
```

#### POST /api/voice
Voice chat with transcription + TTS
```typescript
Request:
{
  "audioBlob": "base64-encoded-wav",
  "childId": "uuid",
  "sessionId": "uuid",
  "mode": "friendly"
}

Response:
{
  "transcription": "Tell me a story about a dragon",
  "reply": "Once upon a time, there was a friendly dragon...",
  "audioUrl": "https://cartesia.ai/audio/...",
  "model": "claude-3-5-sonnet-20241022",
  "voiceProvider": "cartesia",
  "flagged": false
}
```

#### GET /api/parent/conversations/:childId
Parent views child's conversations
```typescript
Response:
{
  "conversations": [
    {
      "sessionId": "uuid",
      "startedAt": "2024-11-30T10:00:00Z",
      "messageCount": 15,
      "mode": "storytelling",
      "flagged": false,
      "messages": [
        { "role": "user", "text": "...", "timestamp": "..." },
        { "role": "assistant", "text": "...", "timestamp": "..." }
      ]
    }
  ]
}
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chat response time | < 2s (p95) | Time from API call to response |
| Voice response time | < 3s (p95) | Time from audio upload to playback |
| Page load time | < 1s (p95) | Time to First Contentful Paint |
| Error rate | < 0.1% | 4xx/5xx errors / total requests |
| Uptime | 99.9%+ | Monthly uptime percentage |

---

## Security Considerations

### Data Privacy
- [ ] All conversation data encrypted at rest (Supabase)
- [ ] TLS 1.3 for data in transit
- [ ] No PII in logs (only IDs)
- [ ] GDPR compliance (right to delete)

### Authentication
- [ ] Supabase Auth (email magic links, phone OTP)
- [ ] No passwords for kids (PIN or biometric)
- [ ] Session expiry after 30 minutes inactivity
- [ ] Device fingerprinting (prevent unauthorized access)

### API Security
- [ ] Rate limiting (100 req/min per user)
- [ ] API key rotation every 90 days
- [ ] No API keys in client-side code
- [ ] CORS restricted to production domain

---

## Deployment Strategy

### Environments
| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | http://localhost:3000 |
| Staging | Pre-prod testing | https://robot-brain-staging.vercel.app |
| Production | Live users | https://robot-friend.vercel.app |

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  test:
    - npm run lint
    - npm run typecheck
    - npm test
  deploy:
    - if: main branch
    - vercel --prod
```

### Rollback Plan
```bash
# If production issues
vercel rollback

# Or redeploy specific commit
git revert HEAD
git push origin main
```

---

## Monitoring & Observability

### Vercel Analytics
- [ ] Web Vitals (LCP, FID, CLS)
- [ ] User session tracking
- [ ] Geographic distribution

### Supabase Logs
- [ ] Database query performance
- [ ] Auth events (logins, logouts)
- [ ] RLS policy violations

### Custom Metrics
```typescript
// Track AI usage
const trackAIUsage = async (data: {
  model: string;
  tokens: { input: number; output: number };
  latency: number;
  cost: number;
}) => {
  await supabase.from('ai_usage_metrics').insert(data);
};
```

### Alerts
- Error rate > 1% → Notify team
- Response time > 5s → Investigate
- Daily AI cost > $50 → Budget alert
- Flagged content → Notify parent + safety team

---

## Future Enhancements

### Phase 2 (Next 3 months)
- [ ] Multi-language support (Spanish, French)
- [ ] Group conversations (siblings)
- [ ] Educational games integration
- [ ] Progress tracking for learning goals

### Phase 3 (Next 6 months)
- [ ] Mobile app (React Native)
- [ ] Offline mode (local AI models)
- [ ] Advanced voice (emotion detection)
- [ ] Teacher/school dashboard

---

## Key Decisions & Rationale

### Decision 1: Anthropic Claude over OpenAI
**Date**: 2024-11-30
**Rationale**:
- Project requirement: No OpenAI
- Claude has better safety features for kids
- Constitutional AI aligns with kids-safety goals
**Trade-offs**: Slightly higher cost, but worth it for safety

### Decision 2: Supabase over Firebase
**Date**: 2024-11-30
**Rationale**:
- PostgreSQL is more robust than Firestore
- RLS is critical for parent-child data isolation
- Open source, no vendor lock-in
**Trade-offs**: Steeper learning curve than Firebase

### Decision 3: Vercel over AWS
**Date**: 2024-11-30
**Rationale**:
- Zero-config deployment for Next.js
- Edge functions for low latency
- Automatic scaling
**Trade-offs**: Less control than AWS, but faster to market

---

## References

- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cartesia TTS Docs](https://cartesia.ai/docs)
- [COPPA Compliance Guide](https://www.ftc.gov/coppa)

---

**Last Review**: 2024-11-30
**Next Review**: 2024-12-30
**Owner**: [Your Name]

**REMEMBER**: NO OpenAI. Use Anthropic Claude only. Kids safety is non-negotiable.
