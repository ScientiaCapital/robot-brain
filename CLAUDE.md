# Robot Brain - Project Instructions

## Critical Rules

- **NO OpenAI** - Do not use OpenAI or any OpenAI models in this project
- **API keys ONLY in .env files** - Never hardcode credentials
- Use **Anthropic Claude**, **Google Gemini**, or **OpenRouter** for AI features

## Project Overview

**Robot Brain** is an AI-powered chat system featuring Robot Friend, a cheerful and supportive companion for kids. Built with Next.js and deployed on Vercel.

### Current Status
- **Phase**: Landing Page Complete
- **Focus**: One robot working perfectly + marketing page
- **Stack**: Supabase + Cartesia + Anthropic Claude

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15.4.5 |
| Frontend | React + TypeScript |
| Database | Supabase (PostgreSQL) |
| AI - Primary | Anthropic Claude |
| AI - Secondary | Google Gemini |
| AI - Chinese LLMs | OpenRouter (DeepSeek, Qwen, Yi) |
| Voice TTS | Cartesia |
| Deployment | Vercel |

## Project Structure

```
robot-brain/
├── ui/                      # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/        # API routes
│   │   │   │   ├── chat/   # Anthropic Claude integration
│   │   │   │   └── voice/  # Cartesia TTS
│   │   │   ├── chat/       # /chat route (VoiceFirstChat)
│   │   │   └── page.tsx    # Landing page
│   │   └── components/
│   │       ├── landing/    # Landing page components
│   │       │   ├── HeroSection.tsx
│   │       │   ├── FeaturesGrid.tsx
│   │       │   ├── DemoWidget.tsx
│   │       │   ├── CTASection.tsx
│   │       │   └── LandingFooter.tsx
│   │       └── voice-first-chat.tsx
│   └── package.json
├── .claude/                 # Claude Code configuration
│   ├── context.md          # Current sprint context
│   └── agents/             # Agent configurations
├── .env.example            # Environment template
├── .mcp.json               # MCP server config (Context7)
└── README.md               # Quick start guide
```

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-xxx    # Primary AI
GOOGLE_API_KEY=your-key               # Google Gemini
OPENROUTER_API_KEY=sk-or-v1-xxx       # Chinese LLMs

# Voice
CARTESIA_API_KEY=your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Commands

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## AI Provider Configuration

### Anthropic Claude (Primary)
- Model: `claude-3-haiku-20240307`
- Use for: General chat interactions
- Config: 100 max tokens, 0.3 temperature

### Google Gemini
- Model: `gemini-1.5-flash`
- Use for: Alternative responses, specialized tasks

### OpenRouter (Chinese LLMs)
Available models:
- `deepseek/deepseek-chat` - General purpose
- `deepseek/deepseek-coder` - Code tasks
- `qwen/qwen-2.5-72b-instruct` - Alibaba's flagship
- `01-ai/yi-large` - Yi large model

## Robot Friend Configuration

```typescript
{
  id: "robot-friend",
  name: "Robot Friend",
  emoji: "😊",
  traits: ["cheerful", "supportive", "enthusiastic"],
  voice_id: "a0e99841-438c-4a64-b679-ae501e7d6091", // Barbershop Man - Cartesia
  systemPrompt: "You are Robot Friend, a cheerful companion for kids..."
}
```

## Database Schema (Supabase)

```sql
-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id varchar,
  robot_personality varchar NOT NULL,
  user_message text NOT NULL,
  robot_response text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar,
  started_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);
```

## MCP Configuration

Currently using **Context7** only for documentation lookups:

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## Development Philosophy

1. **ONE thing working perfectly** before adding more
2. **Test-Driven Development** for quality
3. **Clean architecture** without over-engineering
4. **User-focused** design for kids

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Chat with Anthropic Claude |
| `/api/voice/text-to-speech` | POST | Cartesia TTS |
| `/api/openrouter` | POST | Chinese LLM access |

## Troubleshooting

### Common Issues

**AI responses failing?**
- Check API key in `.env`
- Verify API key format (sk-ant-... for Anthropic)
- Check rate limits

**Database connection issues?**
- Verify Supabase project is active
- Check `SUPABASE_URL` and keys
- Test connection in Supabase dashboard

**Voice not working?**
- Check browser microphone permissions
- Verify Cartesia API key
- Test in different browser

## Status (2025-11-27)

### Completed
- ✅ Supabase migration complete
- ✅ Cartesia TTS integration working
- ✅ OpenRouter Chinese LLMs available
- ✅ Build passes successfully
- ✅ Dead code cleanup (reduced from 21 to 4 API routes)
- ✅ **Landing page with interactive demo** (Onyx-inspired)
- ✅ **Playful Tailwind theme** (animations, colors)

### Tomorrow
- Deploy landing page to Vercel production
- Test demo widget in production
- Mobile responsive testing
- Optional: Add testimonials section
