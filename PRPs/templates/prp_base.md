# PRP-XXX: [Feature Name]

**CRITICAL RULE**: NO OpenAI models - Use Anthropic Claude, Google Gemini, or OpenRouter only

## Metadata

| Field | Value |
|-------|-------|
| PRP Number | PRP-XXX |
| Feature Name | [Descriptive name] |
| Priority | High / Medium / Low |
| Estimated Effort | [Hours/Days] |
| Status | Draft / Approved / In Progress / Completed |
| Created Date | [YYYY-MM-DD] |
| Owner | [Name] |
| Project | Robot Friend (Kids AI Chat) |

---

## 1. Feature Overview

### 1.1 Problem Statement
[What problem does this feature solve? Why is it needed?]

**Example**: Kids need a safer, more engaging way to interact with the robot friend through voice conversations.

### 1.2 User Stories

**As a** [user type],
**I want** [capability],
**So that** [benefit].

**Examples**:
- As a **child**, I want to speak to the robot instead of typing, so that I can have natural conversations.
- As a **parent**, I want to review all voice conversations, so that I can ensure my child's safety.

### 1.3 Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

**Example**:
- [ ] 90% of kids prefer voice over text chat
- [ ] Voice response latency < 3 seconds
- [ ] Zero kids-safety incidents

### 1.4 Out of Scope
[What is explicitly NOT included in this feature]

**Example**:
- Multi-language support (future PRP)
- Group conversations (future PRP)
- Video chat

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 15.x |
| Backend | Next.js API Routes | 15.x |
| Database | Supabase PostgreSQL | Latest |
| AI Model | Anthropic Claude | 3.5 Sonnet |
| Voice | Cartesia TTS | Latest |
| Hosting | Vercel | Latest |

**AI Model Configuration**:
- **Primary**: Anthropic Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Fallback**: OpenRouter Anthropic (`anthropic/claude-3-5-sonnet`)
- **Voice**: Cartesia TTS
- **FORBIDDEN**: ❌ OpenAI (GPT-3.5/4, Whisper, any OpenAI product)

### 2.2 System Architecture Diagram

```
[User (Child)]
    ↓ Voice Input (Browser API)
    ↓
[Next.js Frontend]
    ↓ POST /api/chat
    ↓
[API Route] → [Anthropic Claude 3.5 Sonnet] ← ❌ NO OpenAI
    ↓
[Response Text]
    ↓
[Cartesia TTS] → Voice Output
    ↓
[User (Child) hears response]
    ↓
[Supabase] ← Log conversation for parent review
```

### 2.3 Database Schema Changes

```sql
-- Example: New tables or columns
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id),
  voice_input_url TEXT,
  text_transcription TEXT,
  ai_response TEXT,
  ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  voice_output_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_conversations_child
  ON voice_conversations(child_id, created_at DESC);

-- Row Level Security
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their child's conversations"
  ON voice_conversations FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  ));
```

### 2.4 API Endpoints

#### POST /api/chat/voice
```typescript
Request:
{
  "audioBlob": "base64-encoded-audio",
  "childId": "uuid",
  "mode": "friendly" | "educational" | "storytelling"
}

Response:
{
  "transcription": "What's your favorite color?",
  "reply": "My favorite color is blue, like the sky!",
  "audioUrl": "https://cartesia.ai/audio/...",
  "model": "claude-3-5-sonnet-20241022",
  "conversationId": "uuid"
}
```

### 2.5 Component Structure

```
ui/src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── voice/
│   │   │       └── route.ts        # Voice chat API (Anthropic Claude)
│   └── chat/
│       └── page.tsx                # Main chat page
├── components/
│   ├── VoiceRecorder.tsx           # Voice input component
│   ├── VoicePlayer.tsx             # Voice output component
│   └── ChatHistory.tsx             # Conversation display
├── lib/
│   ├── anthropic.ts                # Anthropic Claude client (NOT OpenAI)
│   ├── cartesia.ts                 # Cartesia TTS client
│   └── supabase.ts                 # Supabase client
└── hooks/
    └── useVoiceChat.ts             # Voice chat logic
```

---

## 3. AI Model Configuration

### 3.1 Anthropic Claude Setup

```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

// NO OpenAI imports
// import OpenAI from 'openai'; ❌ FORBIDDEN

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const getChatResponse = async (
  message: string,
  childAge: number,
  mode: string
) => {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.7,
    system: `You are a friendly robot chatting with a ${childAge}-year-old child.
             Mode: ${mode}
             Rules:
             - Keep responses simple and age-appropriate
             - Be encouraging and positive
             - Avoid: violence, politics, religion, adult topics
             - Use fun examples and analogies
             - Ask follow-up questions to keep the conversation going`,
    messages: [
      { role: 'user', content: message }
    ],
  });

  return response.content[0].text;
};
```

### 3.2 Cost Estimation

| Model | Input Cost | Output Cost | Est. Messages/Month | Est. Cost |
|-------|------------|-------------|---------------------|-----------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens | 10,000 | $20 |
| Cartesia TTS | $0.025/1000 chars | - | 10,000 | $15 |
| **Total** | | | | **$35/month** |

**Budget Alert**: If costs exceed $50/month, investigate usage patterns.

### 3.3 Fallback Strategy

```typescript
// If Anthropic fails, use OpenRouter
const getResponseWithFallback = async (message: string) => {
  try {
    return await anthropic.messages.create({ /* ... */ });
  } catch (error) {
    console.error('Anthropic failed, using OpenRouter fallback');
    return await openrouter.chat({
      model: 'anthropic/claude-3-5-sonnet',
      /* ... */
    });
  }
};
```

---

## 4. Kids-Safety Considerations (CRITICAL)

### 4.1 Content Filtering

#### Input Validation
```typescript
const BLOCKED_WORDS = [
  'violence', 'weapon', 'drug', 'alcohol',
  // ... comprehensive list
];

const BLOCKED_TOPICS = [
  'politics', 'religion', 'sexuality', 'self-harm'
];

const containsHarmfulContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();

  // Check blocked words
  if (BLOCKED_WORDS.some(word => lowerText.includes(word))) {
    return true;
  }

  // Check blocked topics (AI-based)
  // Use Claude to classify topic sensitivity

  return false;
};
```

#### Output Sanitization
```typescript
const sanitizeResponse = (text: string): string => {
  // Remove any inappropriate content that AI might generate
  // Additional safety layer beyond system prompts
  return text
    .replace(/harmful_pattern/gi, '[removed]')
    .trim();
};
```

### 4.2 Parental Controls

- [ ] **Conversation Review**: Parents can view all conversations
- [ ] **Time Limits**: Max 1 hour/day chat time
- [ ] **Message Limits**: Max 50 messages/day per child
- [ ] **Content Alerts**: Flag and notify parents of concerning patterns
- [ ] **Emergency Stop**: Parents can disable chat instantly

### 4.3 Monitoring & Logging

```typescript
// Log all conversations for safety review
const logConversation = async (data: {
  childId: string;
  input: string;
  output: string;
  flagged: boolean;
}) => {
  await supabase.from('conversation_logs').insert({
    child_id: data.childId,
    user_message: data.input,
    ai_message: data.output,
    ai_model: 'claude-3-5-sonnet-20241022',
    flagged_for_review: data.flagged,
    created_at: new Date().toISOString(),
  });
};
```

### 4.4 Age-Appropriate Responses

| Age Group | Response Style | Example |
|-----------|----------------|---------|
| 5-7 years | Very simple, short | "The sky is blue!" |
| 8-10 years | Simple explanations | "The sky looks blue because of how sunlight bounces off air." |
| 11-13 years | More detail | "The sky appears blue due to Rayleigh scattering of sunlight in the atmosphere." |

```typescript
const adjustForAge = (response: string, age: number): string => {
  if (age <= 7) {
    // Simplify to 1-2 sentences, basic vocabulary
  } else if (age <= 10) {
    // Moderate complexity
  } else {
    // Age-appropriate detail
  }
  return response;
};
```

---

## 5. Implementation Plan

### 5.1 Development Phases

#### Phase 1: Backend API (2-3 hours)
- [ ] Create `/api/chat/voice` route
- [ ] Integrate Anthropic Claude SDK (NOT OpenAI)
- [ ] Add content filtering
- [ ] Add Supabase logging
- [ ] Write unit tests

#### Phase 2: Voice Integration (2-3 hours)
- [ ] Integrate Cartesia TTS
- [ ] Add browser voice recording (Web Speech API)
- [ ] Test voice quality and latency
- [ ] Handle network errors

#### Phase 3: Frontend Components (3-4 hours)
- [ ] Build `VoiceRecorder` component
- [ ] Build `VoicePlayer` component
- [ ] Build `ChatHistory` component
- [ ] Add loading states and error handling

#### Phase 4: Kids-Safety Features (2-3 hours)
- [ ] Implement content filter
- [ ] Add parent dashboard
- [ ] Create conversation review UI
- [ ] Add rate limiting

#### Phase 5: Testing (2-3 hours)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Manual testing with kids (5, 8, 12 years)
- [ ] Kids-safety testing

#### Phase 6: Documentation (1 hour)
- [ ] Update README
- [ ] Add API documentation
- [ ] Create parent guide
- [ ] Update CLAUDE.md

**Total Estimated Time**: 12-17 hours

### 5.2 Task Breakdown

```bash
# Create tracking tasks
- [ ] Set up feature branch
- [ ] Create database migrations
- [ ] Implement API route with Anthropic Claude
- [ ] Integrate Cartesia voice
- [ ] Build frontend components
- [ ] Add content filtering
- [ ] Implement parental controls
- [ ] Write tests
- [ ] Manual testing
- [ ] Deploy to staging
- [ ] Final review
- [ ] Deploy to production
```

---

## 6. Validation Criteria

### 6.1 Automated Tests

#### Unit Tests
```bash
npm test -- VoiceRecorder.test.tsx
npm test -- api/chat/voice.test.ts
npm test -- anthropic.test.ts
```

**Coverage Target**: 80%+

#### Integration Tests
```bash
npm run test:integration -- voice-chat-flow
```

**Test Scenarios**:
- Child sends voice message → Receives voice response
- Harmful content blocked at input
- Parent views conversation log
- Rate limit enforced (51st message blocked)

### 6.2 Manual Testing Checklist

#### Functional Testing
- [ ] Voice recording works on Chrome, Safari, Firefox
- [ ] Voice playback quality is good
- [ ] Chat history displays correctly
- [ ] Parent dashboard shows conversations
- [ ] Content filter blocks test cases
- [ ] Rate limiting works

#### Kids-Safety Testing
- [ ] Test with age 5, 8, 12 inputs
- [ ] Attempt harmful queries (should be blocked)
- [ ] Verify parent notifications
- [ ] Test emergency stop button

#### Performance Testing
- [ ] Voice response < 3 seconds (p95)
- [ ] API response < 2 seconds (p95)
- [ ] No memory leaks during long sessions
- [ ] Works on mobile devices

### 6.3 Acceptance Criteria

- [ ] ✅ All automated tests passing
- [ ] ✅ Manual testing checklist complete
- [ ] ✅ Kids-safety validated by QA
- [ ] ✅ Performance targets met
- [ ] ✅ NO OpenAI usage detected
- [ ] ✅ Code reviewed and approved
- [ ] ✅ Documentation updated

---

## 7. Deployment Strategy

### 7.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
  - `ANTHROPIC_API_KEY`
  - `CARTESIA_API_KEY`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- [ ] Database migrations applied
- [ ] Build successful (`npm run build`)
- [ ] No hardcoded secrets

### 7.2 Deployment Steps

```bash
# 1. Deploy to staging
vercel

# 2. Smoke test staging
curl https://robot-brain-staging.vercel.app/api/health

# 3. Manual testing on staging
# Test critical paths

# 4. Deploy to production
vercel --prod

# 5. Monitor for 1 hour
# Check logs, metrics, errors
```

### 7.3 Rollback Plan

**Trigger Rollback if**:
- Error rate > 1%
- Response time > 5s
- Kids-safety incident
- Anthropic API costs spike

```bash
# Rollback command
vercel rollback
```

### 7.4 Post-Deployment Monitoring

#### Metrics to Track (First 24 hours)
- **Latency**: p50, p95, p99 response times
- **Errors**: Error rate, error types
- **Usage**: Messages/hour, voice interactions
- **Costs**: Anthropic API spend, Cartesia spend

#### Alert Thresholds
```yaml
critical:
  - error_rate > 1%
  - response_time_p95 > 5s
  - api_cost > $10/hour

warning:
  - error_rate > 0.5%
  - response_time_p95 > 3s
  - api_cost > $5/hour
```

---

## 8. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Kids-safety incident | Critical | Low | Multi-layer content filtering, parent monitoring |
| Anthropic API costs spike | High | Medium | Rate limiting, cost alerts, budget caps |
| Voice latency > 5s | Medium | Medium | Optimize API calls, use CDN for audio |
| Browser compatibility issues | Medium | Low | Test on all major browsers, provide fallback |
| Data privacy breach | Critical | Very Low | Encryption, RLS policies, audit logs |

---

## 9. Success Metrics (Post-Launch)

### 9.1 Product Metrics (30 days)

- **Engagement**: 70%+ of kids use voice feature
- **Satisfaction**: 4.5+ star rating from parents
- **Safety**: Zero reported kids-safety incidents
- **Retention**: 60%+ kids return weekly

### 9.2 Technical Metrics (30 days)

- **Latency**: p95 < 3s for voice responses
- **Uptime**: 99.9%+ availability
- **Error Rate**: < 0.1%
- **Costs**: < $50/month total AI costs

### 9.3 Review Timeline

- **Day 1**: Post-deployment check
- **Day 7**: Weekly review (metrics, incidents)
- **Day 30**: Monthly retrospective (lessons learned)

---

## 10. Notes & References

### 10.1 Related PRPs
- PRP-000: Initial robot friend setup
- PRP-002: Parent dashboard (dependency)

### 10.2 Documentation Links
- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [Cartesia TTS Docs](https://cartesia.ai/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)

### 10.3 Design Resources
- [Figma Mockups](https://figma.com/...)
- [User Research Notes](https://notion.so/...)

### 10.4 Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-11-30 | [Name] | Initial PRP draft |
| | | |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Kids-Safety Lead | | | |

---

**STATUS**: [Draft / Approved / In Progress / Completed]

**REMEMBER**: NO OpenAI. Use Anthropic Claude only. Kids safety is non-negotiable.
