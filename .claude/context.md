# Robot Brain - Project Context

**Last Updated**: 2025-11-25

## Current Status: CLEANUP COMPLETE

### Stack (Current)
| Service | Provider | Status |
|---------|----------|--------|
| Database | **Supabase** | ✅ Configured |
| TTS Voice | **Cartesia** (sonic-2) | ✅ Integrated |
| Chat AI | **Anthropic Claude** | ✅ Working |
| Chinese LLMs | **OpenRouter** | ✅ Available |
| Framework | **Next.js 15.4.5** | ✅ Building |

### API Routes (4 total - cleaned from 21)
- `/api/chat` - Anthropic Claude conversations
- `/api/health` - System health monitoring
- `/api/openrouter` - DeepSeek, Qwen, Yi Chinese LLMs
- `/api/voice/text-to-speech` - Cartesia TTS

## Recent Major Cleanup (2025-11-25)

### Fixed
- Supabase type interface (added Relationships, Views, Functions, Enums, CompositeTypes)
- All type assertions for Supabase query returns
- Speech Recognition type declarations
- Component imports (removed deleted ConversationalAIChat)

### Deleted (Dead Code)
- 8 unused API routes (agents, teams, conversational-ai, deployment, docs, health/database, signed-url, code-execution)
- 1 unused component (conversational-ai-chat.tsx)
- 4 old documentation files

### Migrated
- TTS: ElevenLabs → Cartesia
- Database: Neon → Supabase

## Environment Variables Required

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
| `ui/src/app/api/chat/route.ts` | Anthropic Claude chat |
| `ui/src/app/api/voice/text-to-speech/route.ts` | Cartesia TTS |
| `ui/src/app/api/openrouter/route.ts` | Chinese LLM models |
| `ui/src/lib/database/supabase-client.ts` | Supabase connection |
| `ui/src/lib/database/enhanced-schema-service.ts` | CRUD operations |

## Development Commands

```bash
cd ui
npm run dev     # Development server
npm run build   # Production build (passes!)
npm test        # Run tests
```

## Notes

- **NO OpenAI** - Project policy prohibits OpenAI usage
- **MVP Focus** - Robot Friend for kids
- **Build Status** - ✅ Passing with minor warnings only
