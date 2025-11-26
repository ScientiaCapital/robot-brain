# CLAUDE.md - Robot Brain Project Guide

## Project Status & Overview

**🤖 Robot Brain MVP - One Robot Working Perfectly**

**Status**: ✅ LIVE & DEPLOYED  
**Live URL**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app

Robot Brain is an AI-powered chat system featuring Robot Friend, a cheerful and supportive companion for kids. The current MVP focuses on delivering ONE robot assistant working perfectly before expanding functionality.

## Technology Stack

### Core Framework
- **Frontend**: Next.js 13+ with React
- **Language**: TypeScript (inferred from Next.js patterns)
- **Styling**: Tailwind CSS (common with Next.js)
- **Deployment**: Vercel

### AI & Voice Services
- **AI Provider**: Anthropic Claude (primary), Google Gemini (mentioned in README)
- **Text-to-Speech**: ElevenLabs API
- **Speech Recognition**: Web Speech API (browser-based)

### Database & Storage
- **Database**: Neon PostgreSQL (serverless Postgres)
- **ORM/Query Builder**: Likely Prisma or Drizzle (common with Next.js + Postgres)

### Development Tools
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Package Manager**: npm

## Development Workflow

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- API keys for AI services

### Initial Setup
```bash
# Clone and install
git clone <repository>
cd robot-brain
npm install

# Environment setup
cp .env.example .env.local
# Fill in required environment variables
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Type checking (if TypeScript)
npm run type-check
```

## Environment Variables

Create a `.env.local` file with:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db"

# AI Services
ANTHROPIC_API_KEY="your_anthropic_key"
GOOGLE_GEMINI_API_KEY="your_gemini_key"
ELEVENLABS_API_KEY="your_elevenlabs_key"

# Next.js
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

## Key Files & Structure

```
robot-brain/
├── app/                    # Next.js 13+ app directory
│   ├── api/
│   │   ├── chat/          # Anthropic Claude API route
│   │   └── voice/         # ElevenLabs TTS API route
│   ├── globals.css        # Tailwind styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat component
│   ├── VoiceToggle.tsx    # Voice mode toggle
│   └── RobotAvatar.tsx    # Robot visual element
├── lib/                   # Utility functions
│   ├── database.ts        # Database connection
│   ├── ai.ts             # AI service wrappers
│   └── voice.ts          # Voice processing utilities
├── types/                 # TypeScript definitions
└── public/               # Static assets
```

### Critical Files Explained

- `app/api/chat/route.ts` - Handles Claude AI conversations
- `app/api/voice/text-to-speech/route.ts` - Manages ElevenLabs TTS
- `components/ChatInterface.tsx` - Main chat UI with text/voice modes
- `lib/database.ts` - Neon PostgreSQL connection and conversation storage

## Testing Approach

### Current Test Structure
```bash
# Run all tests
npm test

# Test categories (if available)
npm run test:unit        # Unit tests
npm run test:integration # API tests
npm run test:e2e         # End-to-end tests
```

### Testing Philosophy
- **Test-Driven Development** emphasized but tests currently minimal
- Focus on **ONE robot working perfectly** before comprehensive test coverage
- Priority: Core chat functionality and voice interactions

## Deployment Strategy

### Vercel Deployment
```bash
# Automatic deployments on main branch
git push origin main

# Manual deployment
npx vercel --prod
```

### Deployment Checklist
- [ ] All environment variables set in Vercel dashboard
- [ ] Database connections verified
- [ ] AI API keys configured
- [ ] Build passes without errors
- [ ] Voice features tested post-deployment

## Coding Standards

### React/Next.js Conventions
```typescript
// Component structure
export default function ComponentName({ prop }: Props) {
  // Hooks at top
  const [state, setState] = useState()
  
  // Handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependencies])
  
  return (
    // JSX with proper accessibility
  )
}
```

### API Route Patterns
```typescript
// API routes use Next.js 13+ route handlers
export async function POST(request: Request) {
  try {
    const data = await request.json()
    // Process request
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ error: 'Message' }, { status: 500 })
  }
}
```

### Voice Feature Standards
- Graceful fallback when voice APIs unavailable
- Clear user feedback during voice recording/playback
- Browser compatibility checks for Web Speech API

## Common Tasks & Commands

### Development Tasks
```bash
# Start fresh development
npm run dev

# Check for build errors
npm run build

# Run linting and formatting
npm run lint
npm run format  # if available

# Database operations
npx prisma generate    # if using Prisma
npx prisma db push     # schema updates
```

### Debugging Tasks
```bash
# Check API routes locally
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Database connection test
npx prisma studio      # if using Prisma
```

### Production Tasks
```bash
# Check deployment health
curl https://robot-brain.vercel.app/api/health

# View deployment logs
npx vercel logs
```

## Troubleshooting Guide

### Common Issues

**Voice Not Working**
- Check browser microphone permissions
- Verify ElevenLabs API key in environment
- Test Web Speech API support in browser console: `'SpeechRecognition' in window`

**AI Responses Failing**
- Verify Anthropic/Gemini API keys
- Check API rate limits and billing
- Test API endpoint directly with curl

**Database Connection Issues**
- Verify DATABASE_URL in environment
- Check Neon PostgreSQL instance status
- Confirm database schema is current

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

### Performance Optimization
- Monitor Vercel function execution times
- Implement response caching where appropriate
- Optimize database queries for conversation history
- Use streaming responses for better UX

## Project Evolution

### Current MVP Focus
- ✅ One robot (Robot Friend) working perfectly
- ✅ Text and voice modes functional
- ✅ Production deployment stable

### Next Phase Considerations
- Additional robot personalities
- Enhanced conversation memory
- Improved error handling and user feedback
- Comprehensive test coverage expansion

---

*This CLAUDE.md will evolve as the project grows beyond the MVP phase. Last updated for Robot Brain MVP v1.0*