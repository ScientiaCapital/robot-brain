# robot-brain

**Branch**: master | **Updated**: 2025-11-30

## Status
Live and deployed MVP featuring Robot Friend, a cheerful and supportive AI companion for kids. Focus on ONE robot working perfectly before expanding functionality. Recent migration to Cartesia TTS + Supabase with dead code cleanup.

## Today's Focus
1. [ ] Test voice mode functionality (now default conversation mode)
2. [ ] Verify Cartesia TTS integration
3. [ ] Test playful landing page interactive demo
4. [ ] Monitor conversation storage in Supabase

## Done (This Session)
- (none yet)

## Critical Rules
- **NO OpenAI models** - Use Anthropic Claude, Google Gemini via OpenRouter
- API keys in `.env` only, never hardcoded
- Graceful fallback when voice APIs unavailable
- Clear user feedback during voice recording/playback
- Browser compatibility checks for Web Speech API

## Blockers
- Test suite minimal (TDD emphasized but not comprehensive yet)

## Quick Commands
```bash
# Setup (ui or robot-brain-ui directory)
cd ui  # or cd robot-brain-ui
npm install
cp .env.example .env.local        # Add API keys

# Development
npm run dev                       # http://localhost:3000
npm run build
npm start

# Testing
npm test                          # Currently minimal
npm run lint

# Type checking
npm run type-check

# Deployment
npx vercel --prod

# Database (if using Prisma)
npx prisma generate
npx prisma db push
npx prisma studio
```

## Tech Stack
- **Framework**: Next.js 13+ with React
- **Language**: TypeScript
- **Database**: Neon PostgreSQL (serverless) + Supabase
- **AI**: Anthropic Claude (primary), Google Gemini
- **Voice**: Cartesia TTS, Web Speech API (browser)
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel
- **Production**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app
