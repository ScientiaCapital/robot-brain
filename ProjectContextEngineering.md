# ProjectContextEngineering.md - Robot Brain Technical Context

## 🏗️ Current Architecture Overview

**Status**: ✅ MVP Complete & Live + Enhanced Agent System  
**URL**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app  
**Last Updated**: August 2, 2025

### 🎯 Simplified Architecture with Enhanced Development Framework
After extensive development, we simplified from a complex FastAPI + Next.js architecture to a single Next.js 15.4.5 application with API routes, while simultaneously building a sophisticated Claude Code agent system for enhanced development capabilities. This eliminated:
- Separate backend server management (FastAPI removed)
- Complex deployment pipelines (Docker removed)
- Multi-service orchestration (Cloudflare Workers removed)
- Multiple environment configurations

While adding:
- 9 specialized Claude Code agents with domain expertise
- Sophisticated hook system for knowledge preservation
- Agent-aware context management in `.claude/` directory
- Cross-agent collaboration and pattern recognition

**Result**: One app, one deployment, maximum simplicity with enhanced development intelligence.

## 🔧 Technical Stack

### 🌐 Frontend & API
- **Framework**: Next.js 15.4.5 (App Router)
- **Frontend**: React 19.1.0 with TypeScript (strict mode)
- **UI Components**: Radix UI + Tailwind CSS + Framer Motion
- **API Routes**: Serverless functions in `/api/*`
- **Build Tool**: Next.js built-in (Webpack + SWC)
- **Deployment**: Vercel (automatic from git push)
- **Testing**: Jest with Testing Library for comprehensive coverage

### 🗄️ Database Layer (Neon PostgreSQL)
```bash
# Connection String Format
postgresql://neondb_owner:PASSWORD@ENDPOINT-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require

# Current Production Database
Project ID: dry-hall-96285777
Endpoint: ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech  
Database: neondb
Schema: public
```

**Key Tables**:
- `conversations` - Primary storage for chat interactions
- `sessions` - User session management  
- `embeddings` - Vector storage for semantic search
- `robot_interactions` - Multi-robot conversation logs
- `tool_usage` - Analytics and usage tracking

### 🤖 AI & Voice Integration

**Chat AI**: Anthropic Claude API
- Model: `claude-3-haiku-20240307`
- Max Tokens: 150 (optimized for quick responses)
- Temperature: 0.7 (balanced creativity)
- System Prompt: Robot Friend personality

**Voice TTS**: ElevenLabs API  
- Voice: Rachel (ID: `21m00Tcm4TlvDq8ikWAM`)
- Model: `eleven_multilingual_v2`
- Settings: Stability 0.75, Similarity 0.85

**Speech Recognition**: Browser Web Speech API
- Language: English (en-US)
- Continuous: false (single utterance)
- Interim Results: false (final only)

## 🔐 Environment & Security

### 🔑 Environment Variables (Production)
```bash
# Database Connection
NEON_DATABASE_URL=postgresql://neondb_owner:***@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# AI Service APIs
ANTHROPIC_API_KEY=sk-ant-api03-***
ELEVENLABS_API_KEY=sk_***

# Frontend Configuration
NEXT_PUBLIC_API_URL=  # Empty = same-origin requests
```

### 🛡️ Security Features
- **SSL/TLS**: All connections encrypted (database and APIs)
- **API Keys**: Stored as Vercel environment variables (never in code)
- **CORS**: Configured for same-origin requests
- **Input Validation**: Pydantic models for API requests
- **Rate Limiting**: Inherent through Vercel serverless limits

## 🚀 Deployment Pipeline

### 📦 Vercel Deployment
```bash
# Automatic deployment on git push to main
git push origin main

# Manual deployment  
vercel --prod

# Environment management
vercel env add VARIABLE_NAME production
vercel env ls
```

**Build Process**:
1. Install dependencies (`npm install`)
2. Type checking (TypeScript strict mode)
3. Build Next.js app (`npm run build`)
4. Deploy to Vercel CDN
5. Serverless functions deployed to regions

### 🌍 Global Distribution
- **CDN**: Vercel Edge Network (global)
- **Serverless Functions**: Auto-deployed to optimal regions
- **Database**: Neon (AWS us-west-2, scale-to-zero)
- **Performance**: < 2s cold start, ~200ms warm responses

## 🔄 Development Workflow

### 🧑‍💻 Local Development
```bash
# Setup
cd robot-brain-ui
npm install
cp .env.example .env.local  # Add API keys

# Development
npm run dev      # Start dev server
npm run build    # Test production build  
npm run lint     # Check code quality
```

### 🔍 Code Quality
- **TypeScript**: Strict mode, zero `any` types goal
- **ESLint**: Standard React/Next.js rules
- **Prettier**: Consistent formatting
- **Build Checks**: Type checking on every build

## 📊 Monitoring & Observability

### 📈 Built-in Monitoring
- **Vercel Analytics**: Page views, performance, errors
- **Neon Dashboard**: Database queries, connections, storage
- **Browser DevTools**: Client-side performance and errors

### 🚨 Error Handling
- **API Routes**: Try-catch with proper HTTP status codes
- **Database**: Connection retry logic for scale-to-zero
- **Frontend**: Error boundaries and user-friendly messages
- **Voice**: Graceful fallback when TTS/STT fails

## 🎯 Current Capabilities

### ✅ Working Features
1. **Text Chat**: Type → Claude responds → ElevenLabs speaks
2. **Voice Chat**: Speak → Browser STT → Claude → ElevenLabs  
3. **Conversation Storage**: All interactions saved to Neon
4. **Robot Personality**: Consistent "Robot Friend" character
5. **Responsive UI**: Works on desktop and mobile
6. **Real-time**: Immediate responses with loading states

### 🔄 Architecture Benefits
- **Simplicity**: One codebase, one deployment
- **Scalability**: Vercel auto-scales serverless functions
- **Reliability**: Neon handles database scaling automatically  
- **Performance**: CDN + serverless = fast global delivery
- **Cost**: Pay-per-use model, scales from $0

## 🤖 Enhanced Agent Development System

### 🎯 Claude Code Agent Framework
The project utilizes a sophisticated 9-agent system with specialized domains:

**Agent Specializations:**
1. **general-purpose** - Versatile coordination and development tasks
2. **project-docs-curator** - Documentation maintenance and technical writing
3. **fullstack-tdd-architect** - Test-driven development and system architecture
4. **bug-hunter-specialist** - Issue identification, debugging, and resolution
5. **vercel-deployment-specialist** - Deployment optimization and CI/CD
6. **neon-database-architect** - Database design, optimization, and scaling
7. **nextjs-performance-optimizer** - Frontend performance and user experience
8. **api-integration-specialist** - External service integration and management
9. **security-auditor-expert** - Security analysis, compliance, and best practices

### 🔗 Sophisticated Hook System

**Knowledge Preservation Architecture:**
```
.claude/knowledge/
├── agents/                    # Agent-specific expertise and context
│   ├── project-docs-curator/  # Documentation patterns and standards
│   ├── vercel-deployment-specialist/  # Deployment configurations
│   ├── neon-database-architect/       # Database schemas and queries
│   └── [6 other specialized domains]
├── shared/                    # Cross-cutting concerns
│   ├── architecture/          # System design patterns
│   │   ├── current_architecture_database.json
│   │   ├── current_architecture_frontend.json
│   │   └── current_architecture_hosting.json
│   ├── patterns/             # Successful implementation patterns
│   │   ├── pattern_neon_vercel_stack.json
│   │   └── pattern_single_robot_mvp.json
│   └── deprecated/           # Outdated approaches to avoid
│       ├── outdated_FastAPI_backend.json
│       ├── outdated_Docker_containers.json
│       └── outdated_Cloudflare_Workers.json
└── successful_pattern/        # Proven architectural decisions
```

**Hook System Features:**
- **Context Continuity**: Preserves project knowledge across development sessions
- **Agent Specialization**: Domain-specific expertise and decision-making context
- **Pattern Recognition**: Tracks successful vs. deprecated implementation approaches
- **Cross-Agent Collaboration**: Shared knowledge base for coordinated development
- **Architectural Memory**: Deep understanding of NEON + Vercel stack evolution

### 🚀 Development Workflow Enhancement

**Agent-Driven Development Process:**
1. **Context-Aware Task Assignment**: Agents automatically receive relevant project context
2. **Specialized Knowledge Application**: Domain experts apply specific best practices
3. **Pattern-Based Decision Making**: Leverage proven architectural patterns
4. **Collaborative Problem Solving**: Cross-agent consultation for complex issues
5. **Knowledge Preservation**: Successful patterns captured for future reference

**This enhanced architecture delivers the MVP with maximum simplicity and minimum operational overhead, while providing sophisticated development intelligence and knowledge management.**