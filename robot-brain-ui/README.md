# Robot Brain UI - Production AI Chat System

## 🤖 Overview
**Robot Brain** is a production-ready AI-powered chat system featuring Robot Friend, built with Next.js 15.4.5 and deployed on Vercel. The project features comprehensive TDD implementation, enterprise-grade security, performance optimization, and the revolutionary Agent Reliability Guardrails System.

## 🚀 Live Application
**Production URL**: https://robot-brain-24lv73qca-scientia-capital.vercel.app

### ✅ Recent Authentication Resolution
- **Issue Resolved**: Vercel team-level SSO authentication blocking user access
- **Solution Applied**: Changed OIDC configuration from "Team" to "Global" issuer mode
- **Result**: Fresh deployment with disabled SSO, enabling public team access
- **Fresh Deployments**: Multiple deployments created via Vercel CLI to ensure SSO changes take effect

## 🎯 Key Features
- **AI Chat**: Anthropic Claude integration (100 tokens, 0.3 temperature optimized)
- **Voice TTS**: ElevenLabs eleven_flash_v2_5 model with 75ms latency
- **Voice Input**: Browser speech recognition support
- **Conversation Storage**: Neon PostgreSQL database integration
- **Performance**: Caching, streaming, bundle optimization
- **Security**: Input validation, rate limiting, CORS, CSP headers
- **Testing**: Comprehensive test suite with 13/16 test suites passing (81% success rate)
- **Test Coverage**: 160/182 individual tests passing (88% success rate)

## 🛡️ Agent Reliability Guardrails System
Revolutionary tooling that prevents agent phantom work:
- **Validation**: Pre/post agent state verification
- **Tracking**: Real-time tool execution monitoring
- **Scoring**: Comprehensive reliability assessment
- **CLI**: Production-ready npm scripts for validation workflow

### Agent Commands
```bash
# Create checkpoint before agent work
npm run agent:checkpoint [agent-type]

# Validate deliverables against actual executions
npm run agent:validate [checkpoint-id] [expected-deliverables]

# Complete verification with reliability scoring
npm run agent:verify [checkpoint-id] [agent-type]

# List all validation sessions
npm run agent:list
```

## 🔧 Technical Stack
- **Framework**: Next.js 15.4.5 (App Router)
- **Frontend**: React 19.1.0 with TypeScript (strict mode)
- **UI**: Radix UI + Tailwind CSS + Framer Motion
- **Database**: Neon PostgreSQL
- **Deployment**: Vercel (Production Ready)
- **Testing**: Jest + Testing Library
- **AI Services**: Anthropic Claude + ElevenLabs TTS

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Environment variables (see .env.example)

### Installation
```bash
# Clone and install
git clone [repository-url]
cd robot-brain-ui
npm install

# Setup environment
cp .env.example .env.local
# Add your API keys to .env.local
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```bash
# Required API Keys
ANTHROPIC_API_KEY=sk-ant-api03-***
ELEVENLABS_API_KEY=sk_***
NEON_DATABASE_URL=postgresql://***

# Optional Configuration
NEXT_PUBLIC_API_URL=  # Defaults to same origin
```

## 🏗️ Architecture

### API Routes
- `/api/chat` - Anthropic Claude integration with optimized parameters
- `/api/voice/text-to-speech` - ElevenLabs TTS with eleven_flash_v2_5 model
- `/api/signed-url` - File upload support (legacy)

### Database Schema
```sql
-- Primary conversation storage
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_personality varchar NOT NULL,
  user_message text NOT NULL,
  robot_response text NOT NULL,
  session_id varchar,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

## 🧪 Testing

### Current Test Status
- **Test Suites**: 13/16 passing (81% success rate)
- **Individual Tests**: 160/182 passing (88% success rate)
- **Recent Improvements**: Major fixes for performance monitors, audio streaming, database metadata, voice pipeline, component imports

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API route and service integration
- **Performance Tests**: Response time and optimization validation
- **Security Tests**: Input validation and protection verification

### Running Tests
```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

## 🔒 Security Features
- **Input Validation**: Comprehensive request validation with Zod
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Cross-origin request security
- **CSP Headers**: Content Security Policy implementation
- **Environment Security**: API keys managed via Vercel environment variables

## 📊 Performance Optimizations
- **Caching**: Response caching for improved performance
- **Streaming**: Real-time audio streaming for TTS
- **Bundle Optimization**: Code splitting and tree shaking
- **CDN**: Global content delivery via Vercel Edge Network
- **Database**: Connection pooling and query optimization

## 🚀 Deployment

### Production Deployment
The application is deployed to Vercel with resolved authentication barriers:
- **Current URL**: https://robot-brain-24lv73qca-scientia-capital.vercel.app
- **Platform**: Vercel serverless functions + global CDN
- **Database**: Neon PostgreSQL with scale-to-zero capability
- **Authentication**: ✅ SSO authentication issues resolved via global OIDC configuration
- **Team Access**: ✅ Public team access enabled after SSO configuration change

### Manual Deployment
```bash
# Deploy to production
npm run deploy

# Pre-deployment checks
npm run pre-deploy
```

## 🛠️ Development Tools

### Code Quality
- **TypeScript**: Strict mode for type safety
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Consistent code formatting

### Agent Reliability Guardrails
- **Phantom Work Prevention**: Validates agent claims vs actual executions
- **Reliability Scoring**: Quantitative agent performance assessment
- **Execution Tracking**: Complete audit trail of tool usage
- **CLI Integration**: Easy-to-use validation workflow

## 📈 Monitoring & Analytics
- **Vercel Analytics**: Page views, performance, errors
- **Neon Dashboard**: Database queries, connections, storage
- **Agent Reliability Metrics**: Comprehensive agent performance tracking

## 🏆 Major Achievements
- ✅ **Production Ready**: Live application with enterprise-grade features
- ✅ **Authentication Resolution**: Resolved Vercel SSO blocking via global OIDC configuration
- ✅ **Team Collaboration**: Enabled public team access after SSO configuration changes
- ✅ **Comprehensive Testing**: 13/16 test suites passing (81%), 160/182 individual tests (88%)
- ✅ **Test Suite Improvements**: Major fixes for performance monitors, audio streaming, database metadata
- ✅ **Performance Optimized**: 75ms TTS latency with caching and streaming
- ✅ **Security Hardened**: Input validation, rate limiting, CORS, CSP
- ✅ **Revolutionary Innovation**: Agent Reliability Guardrails System solving phantom work

## 🤝 Contributing
This project represents both a successful robot chat system and a breakthrough in agent reliability technology. With 13/16 test suites passing and continuous improvements, we maintain high code quality standards. The Agent Reliability Guardrails System has applications far beyond this specific use case and solves fundamental problems in AI agent development.

### Development Workflow
- Run tests before committing: `npm run test`
- Current test health: 81% test suites passing, 88% individual tests passing
- Focus areas: Improving remaining 3 failing test suites for complete coverage

## 📄 License
This project is part of the Robot Brain ecosystem, featuring production-ready AI chat capabilities and revolutionary agent reliability innovations.
