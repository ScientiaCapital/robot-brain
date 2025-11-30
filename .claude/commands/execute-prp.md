# Execute Project Requirement Plan (PRP)

**CRITICAL RULE**: NO OpenAI models - Use Anthropic Claude, Google Gemini, or OpenRouter only

## Project: Robot Friend (Kids AI Chat)
**Tech Stack**: Next.js 15, Supabase, Anthropic Claude, Cartesia voice, OpenRouter
**Location**: `/Users/tmkipper/Desktop/tk_projects/robot-brain`

---

## 6-Phase Execution Framework

This guide walks through implementing a PRP from start to deployment.

---

## Phase 1: Environment Setup (15-30 minutes)

### 1.1 Create Feature Branch
```bash
cd /Users/tmkipper/Desktop/tk_projects/robot-brain

# Create branch from main
git checkout main
git pull origin main
git checkout -b feature/PRP-XXX-feature-name

# Verify clean state
git status
```

### 1.2 Install Dependencies (if needed)
```bash
# Check package.json for new deps
npm install

# Verify Anthropic SDK (not OpenAI)
npm list @anthropic-ai/sdk
npm list cartesia-ai

# Forbidden check
npm list openai  # Should return NOTHING
```

### 1.3 Environment Variables
```bash
# Copy .env.example if missing
cp .env.example .env.local

# Required variables
cat > .env.local << EOF
# AI Models (NO OPENAI)
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
CARTESIA_API_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Kids Safety
CONTENT_FILTER_LEVEL=strict
MAX_MESSAGES_PER_HOUR=50
EOF
```

### 1.4 Start Dev Server
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Supabase local (if using)
npx supabase start

# Verify localhost:3000 loads
```

---

## Phase 2: Implementation (2-8 hours, varies by feature)

### 2.1 Database Changes (if needed)

#### Supabase Migration
```bash
# Create migration
npx supabase migration new feature_name

# Example: Add chat_modes table
cat > supabase/migrations/20241130_chat_modes.sql << EOF
CREATE TABLE chat_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE chat_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat modes readable by all"
  ON chat_modes FOR SELECT
  USING (true);
EOF

# Apply migration
npx supabase db push
```

### 2.2 Backend API Routes

#### Example: Chat API with Anthropic Claude
```typescript
// ui/src/app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

// NO OpenAI imports allowed
// import OpenAI from 'openai'; ❌ FORBIDDEN

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { message, childAge, mode } = await request.json();

  // Kids-safety validation
  if (containsHarmfulContent(message)) {
    return Response.json({ error: 'Content blocked' }, { status: 400 });
  }

  // Call Anthropic Claude (NOT OpenAI)
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.7,
    system: `You are a friendly robot chatting with a ${childAge}-year-old.
             Mode: ${mode}. Keep responses simple and safe.`,
    messages: [
      { role: 'user', content: message }
    ],
  });

  return Response.json({
    reply: response.content[0].text,
    model: 'claude-3-5-sonnet-20241022', // Track usage
  });
}
```

### 2.3 Frontend Components

#### Example: Chat Component
```typescript
// ui/src/components/RobotChat.tsx
'use client';

import { useState } from 'react';
import { useVoice } from '@/lib/cartesia'; // Voice synthesis

interface RobotChatProps {
  childAge: number;
  mode: 'friendly' | 'educational' | 'storytelling';
}

export function RobotChat({ childAge, mode }: RobotChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { speak } = useVoice();

  const sendMessage = async () => {
    // Call API (uses Anthropic Claude)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, childAge, mode }),
    });

    const data = await response.json();

    // Add to messages
    setMessages([...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: data.reply }
    ]);

    // Voice synthesis (Cartesia)
    await speak(data.reply);
  };

  return (
    <div className="robot-chat">
      {/* Chat UI */}
    </div>
  );
}
```

### 2.4 Voice Integration (Cartesia)

```typescript
// ui/src/lib/cartesia.ts
import { Cartesia } from 'cartesia-ai';

const cartesia = new Cartesia({
  apiKey: process.env.NEXT_PUBLIC_CARTESIA_API_KEY,
});

export function useVoice() {
  const speak = async (text: string) => {
    const audio = await cartesia.synthesize({
      text,
      voice_id: 'kid-friendly-robot',
      speed: 1.0,
      emotion: 'cheerful',
    });

    // Play audio
    const audioElement = new Audio(audio.url);
    await audioElement.play();
  };

  return { speak };
}
```

---

## Phase 3: Testing (1-2 hours)

### 3.1 Unit Tests
```bash
# Run tests
npm test

# Watch mode during development
npm test -- --watch
```

#### Example Test
```typescript
// ui/src/components/__tests__/RobotChat.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { RobotChat } from '../RobotChat';

describe('RobotChat', () => {
  it('sends message and receives reply', async () => {
    const { getByRole, getByText } = render(
      <RobotChat childAge={8} mode="friendly" />
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.click(getByRole('button', { name: 'Send' }));

    // Verify API called with Anthropic (not OpenAI)
    await waitFor(() => {
      expect(getByText(/Hello/i)).toBeInTheDocument();
    });
  });

  it('blocks harmful content', async () => {
    // Kids-safety test
    const { getByRole, getByText } = render(
      <RobotChat childAge={8} mode="friendly" />
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'bad word' } });
    fireEvent.click(getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(getByText(/Content blocked/i)).toBeInTheDocument();
    });
  });
});
```

### 3.2 Integration Tests
```bash
npm run test:integration
```

### 3.3 Manual Testing Checklist
- [ ] Chat with age 5 input
- [ ] Chat with age 8 input
- [ ] Chat with age 12 input
- [ ] Voice response plays correctly
- [ ] Content filter blocks test cases
- [ ] Parent dashboard shows conversation
- [ ] Rate limiting works (51st message blocked)

---

## Phase 4: Code Review & Validation (30-60 minutes)

### 4.1 Self-Review
```bash
# Check for OpenAI usage (should return NOTHING)
grep -r "openai" ui/src --include="*.ts" --include="*.tsx"
grep -r "OpenAI" ui/src --include="*.ts" --include="*.tsx"

# Check for hardcoded keys
grep -r "sk-ant-" ui/src --include="*.ts" --include="*.tsx"
grep -r "API_KEY" ui/src --include="*.ts" --include="*.tsx"
```

### 4.2 Run Full Validation
```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Tests with coverage
npm test -- --coverage

# Build verification
npm run build
```

### 4.3 Kids-Safety Review
- [ ] All user inputs validated
- [ ] Anthropic Claude system prompts reviewed
- [ ] Content filters tested
- [ ] Parent controls functional
- [ ] Conversation logging enabled

---

## Phase 5: Commit & PR (15-30 minutes)

### 5.1 Commit Changes
```bash
# Stage files
git add .

# Commit with descriptive message
git commit -m "feat(PRP-XXX): Add [feature name]

- Implement [component/API]
- Use Anthropic Claude 3.5 Sonnet (NOT OpenAI)
- Add kids-safety content filtering
- Include Cartesia voice synthesis
- Add comprehensive tests

Closes PRP-XXX"
```

### 5.2 Push & Create PR
```bash
# Push to remote
git push origin feature/PRP-XXX-feature-name

# Create PR (GitHub CLI)
gh pr create \
  --title "PRP-XXX: [Feature Name]" \
  --body "Implements PRP-XXX

## Changes
- [List key changes]

## AI Models Used
- ✅ Anthropic Claude 3.5 Sonnet
- ✅ Cartesia TTS
- ❌ NO OpenAI

## Kids-Safety
- Content filtering: ✅
- Parent controls: ✅
- Conversation logging: ✅

## Testing
- Unit tests: ✅
- Integration tests: ✅
- Manual testing: ✅

## Screenshots
[Add screenshots]"
```

---

## Phase 6: Deploy & Monitor (30-60 minutes)

### 6.1 Pre-Deploy Checks
```bash
# Build production
npm run build

# Start production locally
npm start

# Smoke test critical paths
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","childAge":8,"mode":"friendly"}'
```

### 6.2 Deploy to Vercel
```bash
# Deploy to preview
vercel

# Verify preview environment
# Test chat, voice, parent controls

# Deploy to production
vercel --prod
```

### 6.3 Post-Deploy Validation
```bash
# Health check
curl https://robot-friend.vercel.app/api/health

# Monitor logs (Vercel dashboard)
# Check for errors
# Verify Anthropic API calls (not OpenAI)
```

### 6.4 Monitor Key Metrics
- **Response Time**: < 2s (p95)
- **Error Rate**: < 0.1%
- **API Costs**: < $0.01/interaction
- **Voice Latency**: < 3s

### 6.5 Rollback Plan (if issues)
```bash
# Revert deployment
vercel rollback

# Or redeploy previous version
git revert HEAD
git push origin feature/PRP-XXX-feature-name
vercel --prod
```

---

## Post-Execution Checklist

### PRP Completion
- [ ] Feature deployed to production
- [ ] All tests passing
- [ ] No OpenAI usage detected
- [ ] Kids-safety validated
- [ ] Monitoring enabled
- [ ] PRP moved to `completed/`

```bash
# Move PRP to completed
mv PRPs/active/PRP-XXX-feature-name.md \
   PRPs/completed/PRP-XXX-feature-name.md

# Update PRP status
echo "Status: ✅ COMPLETED - Deployed $(date)" >> \
  PRPs/completed/PRP-XXX-feature-name.md
```

---

## Troubleshooting

### OpenAI Accidentally Used
```bash
# Find all OpenAI references
grep -r "openai" ui/src

# Replace with Anthropic
# ui/src/lib/ai.ts
- import OpenAI from 'openai';
+ import Anthropic from '@anthropic-ai/sdk';

# Update calls
- const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
+ const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

- const response = await openai.chat.completions.create({
-   model: 'gpt-4',
+ const response = await anthropic.messages.create({
+   model: 'claude-3-5-sonnet-20241022',
```

### Kids-Safety Issue
1. Enable maintenance mode
2. Review conversation logs
3. Update content filters
4. Re-test with kids-safety team
5. Deploy fix

### Voice Not Working
- Check Cartesia API key
- Verify network connectivity
- Test with different browsers
- Review audio permissions

---

## Quick Reference

| Phase | Duration | Key Command |
|-------|----------|-------------|
| 1. Setup | 15-30 min | `git checkout -b feature/PRP-XXX` |
| 2. Implementation | 2-8 hours | `npm run dev` |
| 3. Testing | 1-2 hours | `npm test` |
| 4. Review | 30-60 min | `npm run lint && npm run typecheck` |
| 5. Commit & PR | 15-30 min | `git commit && gh pr create` |
| 6. Deploy | 30-60 min | `vercel --prod` |

**Total Time**: 4-12 hours (varies by feature complexity)

**Remember**: Kids safety first. No OpenAI. Anthropic Claude only. Test thoroughly before deploying.
