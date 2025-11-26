# CLAUDE.md - Robot Brain Project Context

## Project Overview
**Robot Brain** is an AI-powered chat system featuring Robot Friend, built with Next.js 15.4.5 and deployed on Vercel with Supabase PostgreSQL backend.

## Current Status: PRODUCTION READY

### Stack (Current - Updated 2025-11-25)
| Service | Provider | Status |
|---------|----------|--------|
| **Framework** | Next.js 15.4.5 | Building |
| **Database** | Supabase | Configured |
| **TTS Voice** | Cartesia (sonic-2) | Integrated |
| **Chat AI** | Anthropic Claude | Working |
| **Chinese LLMs** | OpenRouter | Available |

### API Routes (4 total)
- `/api/chat` - Anthropic Claude conversations
- `/api/health` - System health monitoring (DB, Anthropic, Cartesia)
- `/api/openrouter` - DeepSeek, Qwen, Yi Chinese LLMs
- `/api/voice/text-to-speech` - Cartesia TTS

## Technical Architecture

```
ui/
├── src/app/api/           # Next.js API routes
│   ├── chat/              # Anthropic Claude integration
│   ├── health/            # System health check
│   ├── openrouter/        # Chinese LLM access
│   └── voice/text-to-speech/  # Cartesia TTS
├── src/components/        # React components
│   ├── ui/               # UI components (enhanced-voice-interface, etc.)
│   ├── voice-first-chat.tsx
│   └── bubble-chat-widget.tsx
├── src/lib/              # Core libraries
│   ├── database/         # Supabase client & services
│   │   ├── supabase-client.ts
│   │   ├── enhanced-schema-service.ts
│   │   └── health-check-service.ts
│   └── simple-audio-player.ts  # HTML5 Audio for TTS
└── src/types/            # TypeScript definitions
```

## Environment Variables

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxx
CARTESIA_API_KEY=your-cartesia-key
OPENROUTER_API_KEY=sk-or-v1-xxx  # Optional - for Chinese LLMs

# Optional
GOOGLE_API_KEY=your-google-key
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Anthropic Claude chat |
| `src/app/api/voice/text-to-speech/route.ts` | Cartesia TTS |
| `src/app/api/openrouter/route.ts` | Chinese LLM models |
| `src/lib/database/supabase-client.ts` | Supabase connection |
| `src/lib/database/enhanced-schema-service.ts` | CRUD operations |
| `src/lib/simple-audio-player.ts` | TTS audio playback |

## Development Commands

```bash
cd ui
npm run dev     # Development server
npm run build   # Production build
npm test        # Run tests
npm run lint    # Lint check
```

## Service Integrations

### Cartesia TTS
- API: `https://api.cartesia.ai/tts/bytes`
- Model: `sonic-2`
- Voice: Configurable per robot personality
- Returns: base64-encoded audio

### Supabase Database
- Tables: `conversations`, `sessions`, `agents`
- Auth: Row Level Security (RLS)
- SDK: @supabase/supabase-js v2.47+

### Anthropic Claude
- Model: `claude-3-haiku-20240307` (default)
- Optimized: 100 tokens, 0.3 temperature
- Kid-friendly system prompts

### OpenRouter (Optional)
- DeepSeek models
- Qwen models
- Yi models
- Useful for Chinese language support

## Project Rules

- **NO OpenAI** - Project policy prohibits OpenAI usage
- **MVP Focus** - Robot Friend for kids
- **API keys in .env only** - Never hardcoded

## Recent Cleanup (2025-11-25)

### Deleted (Dead Code)
- 8 unused API routes
- 1 unused component
- Old documentation files

### Migrated
- TTS: ElevenLabs Cartesia
- Database: Neon Supabase

### Fixed
- Supabase type interface (SDK v2.47 requirements)
- All type assertions for query returns
- Speech Recognition type declarations
- Component imports

## Health Check

The `/api/health` endpoint tests:
1. Supabase database connectivity
2. Anthropic API access
3. Cartesia API access

Returns overall status: `healthy`, `degraded`, or `unhealthy`
