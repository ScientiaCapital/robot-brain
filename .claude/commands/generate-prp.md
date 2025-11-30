# Generate Project Requirement Plan (PRP)

**CRITICAL RULE**: NO OpenAI models - Use Anthropic Claude, Google Gemini, or OpenRouter only

## Project: Robot Friend (Kids AI Chat)
**Tech Stack**: Next.js 15, Supabase, Anthropic Claude, Cartesia voice, OpenRouter
**Location**: `/Users/tmkipper/Desktop/tk_projects/robot-brain`

---

## What is a PRP?

A Project Requirement Plan is a structured document that defines:
- Feature objectives and scope
- Technical implementation details
- Validation criteria
- Deployment strategy

**Purpose**: Ensure every feature is well-planned before coding begins.

---

## When to Generate a PRP

### Required for:
- ✅ New features (chat modes, voice features, parent controls)
- ✅ Major refactors (database schema changes, API redesigns)
- ✅ AI model integrations (new Anthropic Claude features)
- ✅ Kids-safety enhancements (content filters, monitoring)

### NOT Required for:
- ❌ Bug fixes (< 1 hour work)
- ❌ Documentation updates
- ❌ Minor UI tweaks
- ❌ Dependency updates

---

## PRP Generation Process

### Step 1: Gather Context (5-10 minutes)
```bash
# Navigate to project
cd /Users/tmkipper/Desktop/tk_projects/robot-brain

# Review existing code
ls -la ui/src/components
cat ui/src/app/api/chat/route.ts

# Check current state
git status
git log --oneline -10
```

### Questions to Answer
1. What problem does this feature solve?
2. Who are the users? (kids, parents, admins)
3. What's the expected behavior?
4. What AI models will be used? (must be Anthropic Claude)
5. What's the kids-safety impact?

---

### Step 2: Create PRP from Template (10-15 minutes)

```bash
# Copy template
cp /Users/tmkipper/Desktop/tk_projects/robot-brain/PRPs/templates/prp_base.md \
   /Users/tmkipper/Desktop/tk_projects/robot-brain/PRPs/active/PRP-XXX-feature-name.md

# Fill in sections
# - Use editor or Claude to populate
```

**Template Sections**:
1. Feature Overview
2. Technical Architecture
3. AI Model Configuration (Anthropic Claude only)
4. Kids-Safety Considerations
5. Implementation Plan
6. Validation Criteria
7. Deployment Strategy

---

### Step 3: Technical Design (15-20 minutes)

#### Define Components
```typescript
// Example: New chat mode component
interface RobotChatModeProps {
  mode: 'friendly' | 'educational' | 'storytelling';
  childAge: number;
  parentControls: ParentSettings;
}

// API route structure
// /app/api/chat/route.ts
async function POST(request: Request) {
  // Use Anthropic Claude (NOT OpenAI)
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    // ...
  });
}
```

#### Database Schema (Supabase)
```sql
-- Example: New table for chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id),
  mode TEXT NOT NULL,
  ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Voice Integration (Cartesia)
```typescript
// Voice synthesis configuration
const voiceConfig = {
  provider: 'cartesia',
  voice_id: 'kid-friendly-voice',
  speed: 1.0,
  emotion: 'cheerful'
};
```

---

### Step 4: Kids-Safety Analysis (CRITICAL - 10 minutes)

#### Content Filtering
- [ ] Input validation for harmful content
- [ ] Output sanitization (remove inappropriate words)
- [ ] Age-appropriate language adjustment
- [ ] Parent-approved topics only

#### Anthropic Claude Safety
```typescript
// Configure Claude with safety settings
const claudeConfig = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  temperature: 0.7,
  system: `You are a friendly robot chatting with a ${childAge}-year-old.
           Keep responses simple, positive, and educational.
           Never discuss: violence, politics, religion, or adult topics.`
};
```

#### Monitoring
- [ ] Log all conversations for parent review
- [ ] Flag suspicious patterns
- [ ] Rate limiting (max 50 messages/hour per child)

---

### Step 5: Validation Plan (10 minutes)

#### Automated Tests
```bash
# Unit tests
npm test -- components/RobotChat.test.tsx

# Integration tests
npm run test:integration -- api/chat

# Kids-safety tests
npm run test:safety
```

#### Manual Testing Checklist
- [ ] Chat with different age groups (5, 8, 12 years)
- [ ] Voice quality and speed
- [ ] Parent dashboard shows conversation
- [ ] Content filter blocks test cases
- [ ] Anthropic Claude API costs within budget

#### Performance Targets
- Response latency: < 2s (p95)
- Voice synthesis: < 3s
- Error rate: < 0.1%

---

### Step 6: Review & Approval (5 minutes)

#### Self-Review Checklist
- [ ] PRP follows template structure
- [ ] NO OpenAI models mentioned
- [ ] Anthropic Claude configured correctly
- [ ] Kids-safety addressed
- [ ] Validation criteria clear
- [ ] Deployment plan defined

#### Peer Review (if applicable)
- Share PRP with team
- Get feedback on technical approach
- Confirm kids-safety measures
- Approve before coding

---

## PRP Template Locations

```
/Users/tmkipper/Desktop/tk_projects/robot-brain/PRPs/
├── templates/
│   └── prp_base.md          # Base template
├── active/
│   └── PRP-XXX-*.md         # In-progress PRPs
├── completed/
│   └── PRP-XXX-*.md         # Finished PRPs
└── archived/
    └── PRP-XXX-*.md         # Old/superseded PRPs
```

---

## Example PRP Naming

| Feature | PRP Filename |
|---------|--------------|
| Voice chat mode | `PRP-001-voice-chat-mode.md` |
| Parent dashboard | `PRP-002-parent-dashboard.md` |
| Educational games | `PRP-003-educational-games.md` |
| Anthropic Claude upgrade | `PRP-004-claude-model-upgrade.md` |

---

## AI Model Requirements (NON-NEGOTIABLE)

### ✅ Approved
- **Anthropic Claude**: claude-3-5-sonnet-20241022, claude-3-opus-20240229
- **OpenRouter**: anthropic/claude-3-5-sonnet (fallback)
- **Cartesia**: Voice synthesis

### ❌ Forbidden
- OpenAI GPT-3.5/4/4o
- OpenAI Whisper
- Any OpenAI product

### Verification in PRP
Every PRP must include:
```markdown
## AI Model Configuration

**Primary Model**: Anthropic Claude 3.5 Sonnet
**Model ID**: claude-3-5-sonnet-20241022
**Fallback**: OpenRouter (anthropic/claude-3-5-sonnet)
**Voice**: Cartesia TTS

**OpenAI Usage**: NONE (forbidden)
```

---

## Quick Start Command

```bash
# Generate new PRP interactively
cd /Users/tmkipper/Desktop/tk_projects/robot-brain
npm run prp:generate

# Or manually
cp PRPs/templates/prp_base.md PRPs/active/PRP-XXX-feature-name.md
code PRPs/active/PRP-XXX-feature-name.md
```

---

## PRP Lifecycle

1. **Draft** → Create from template
2. **Review** → Self/peer review
3. **Approved** → Ready to implement
4. **In Progress** → Active development
5. **Completed** → Move to `completed/`
6. **Archived** → Move to `archived/` if superseded

**Rule**: Never start coding without an approved PRP for major features.

---

## Kids-Safety First Principle

Every PRP must answer:
- What are the kids-safety risks?
- How is harmful content prevented?
- What parental controls exist?
- How are conversations monitored?

**If unsure, ask the parents/product team BEFORE coding.**
