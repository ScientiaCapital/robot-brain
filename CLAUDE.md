# CLAUDE.md - Robot Brain Project Context

## 🤖 Project Overview
**Robot Brain** is an AI-powered chat system featuring Robot Friend, built with Next.js 15.4.5 and deployed on Vercel with Neon PostgreSQL backend. The project features an enhanced agent-aware development system with 9 specialized Claude Code agents and sophisticated knowledge preservation hooks.

## 🎯 Project Status: ✅ MVP COMPLETE + ENHANCED AGENT SYSTEM
1. **✅ COMPLETED**: ONE robot (Robot Friend) working perfectly
2. **✅ COMPLETED**: Next.js 15.4.5 app deployed on Vercel  
3. **✅ COMPLETED**: Anthropic Claude integration for chat responses
4. **✅ COMPLETED**: ElevenLabs TTS for voice output
5. **✅ COMPLETED**: Neon PostgreSQL for conversation storage
6. **✅ COMPLETED**: Enhanced agent-aware hook system with 9 specialized agents
7. **✅ COMPLETED**: Claude Code knowledge preservation and context system
8. **🚀 LIVE**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app

## 🚀 Current Deployment

### 🌐 Live Application
- **URL**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app
- **Platform**: Vercel (Next.js)
- **Database**: Neon PostgreSQL
- **Status**: ✅ Production Ready

### 🤖 Robot Friend Configuration
**A cheerful, supportive, and enthusiastic companion for kids:**

```typescript
{
  id: "robot-friend",
  name: "Robot Friend", 
  emoji: "😊",
  traits: ["cheerful", "supportive", "enthusiastic"],
  voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - warm, friendly ElevenLabs voice
  systemPrompt: "You are Robot Friend, a cheerful and supportive robot assistant for kids...",
  welcomeMessage: "Hi there! I'm Robot Friend! 😊..."
}
```

### 🎙️ Interaction Modes
1. **Text Mode**: Type → Anthropic Claude responds → ElevenLabs speaks
2. **Voice Mode**: Browser speech recognition → Claude responds → ElevenLabs speaks
3. **Conversation Storage**: All interactions saved to Neon PostgreSQL

## 🏗️ Enhanced Architecture with Agent System

**Next.js 15.4.5 App on Vercel with Sophisticated Agent Development Framework:**

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Vercel)                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Frontend    │  │  API Routes │  │   Database   │   │
│  │  (React)     │  │ (/api/*)    │  │    (Neon)    │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                  External APIs                           │
│  ┌────────────────┐  ┌─────────────┐                    │
│  │   Anthropic    │  │ ElevenLabs  │                    │
│  │    Claude      │  │  Voice TTS  │                    │
│  │   (Chat AI)    │  │             │                    │
│  └────────────────┘  └─────────────┘                    │
```

**Components:**
- **Frontend**: React components for chat interface
- **API Routes**: Next.js serverless functions
  - `/api/chat` - Anthropic Claude integration
  - `/api/voice/text-to-speech` - ElevenLabs TTS
- **Database**: Neon PostgreSQL for conversation storage
- **Deployment**: Single Vercel deployment


## 🔧 Technical Stack

### 🌐 Frontend & Backend
- **Framework**: Next.js 15.4.5 (App Router + API Routes)
- **Frontend**: React 19.1.0 with TypeScript (strict mode)
- **UI**: Radix UI components + Tailwind CSS + Framer Motion
- **Deployment**: Vercel (serverless functions + global CDN)
- **Build**: ✅ Successful production build

### 🗄️ Database
- **Provider**: Neon (Serverless PostgreSQL)
- **Connection**: `postgresql://neondb_owner:***@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb`
- **Tables**: `conversations`, `sessions`, `embeddings`, `robot_interactions`, `tool_usage`
- **Status**: ✅ Connected and operational

### 🤖 AI & Voice Services
- **Chat AI**: Anthropic Claude (claude-3-haiku-20240307)
- **Voice TTS**: ElevenLabs (Rachel voice - 21m00Tcm4TlvDq8ikWAM)
- **Speech Recognition**: Browser Web Speech API
- **Status**: ✅ All integrations working

### 🎯 Enhanced Agent System
- **Agent Framework**: Claude Code with 9 specialized agents
- **Hook System**: Sophisticated context preservation in `.claude/` directory
- **Knowledge Base**: Agent-specific context and architectural patterns
- **Specializations**: Full-stack development, database architecture, deployment, security, performance

## 🔐 Environment Configuration

### 🔑 Required Environment Variables
```bash
# Database
NEON_DATABASE_URL=postgresql://neondb_owner:***@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# AI Services  
ANTHROPIC_API_KEY=sk-ant-api03-***
ELEVENLABS_API_KEY=sk_***

# Frontend (optional - defaults to same origin)
NEXT_PUBLIC_API_URL=
```

### 🛣️ API Routes
```
/api/chat                    - Anthropic Claude integration
  POST: { message, personality, sessionId }
  
/api/voice/text-to-speech   - ElevenLabs TTS
  POST: { text, personality }
  
/api/signed-url             - File upload (legacy)
```

## 📋 Current Project Status

### ✅ MVP Complete & Deployed
- **Frontend**: Next.js app with React components for chat interface
- **Backend**: Next.js API routes (`/api/chat`, `/api/voice/text-to-speech`)
- **Database**: Neon PostgreSQL with conversation storage
- **Deployment**: Vercel serverless platform
- **Status**: ✅ Production ready and live

### 🗂️ Database Schema (Neon PostgreSQL)
```sql
-- Conversations table (primary storage)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_personality varchar NOT NULL,
  user_message text NOT NULL,
  robot_response text NOT NULL,
  session_id varchar,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Additional tables for future features
CREATE TABLE sessions (...);
CREATE TABLE embeddings (...);
CREATE TABLE robot_interactions (...);
CREATE TABLE tool_usage (...);
```

## 🎯 Enhanced Agent Development System

### 🤖 Specialized Agent Team (9 Agents)
1. **general-purpose** - Versatile development tasks and coordination
2. **project-docs-curator** - Documentation excellence and maintenance
3. **fullstack-tdd-architect** - Test-driven development and architecture
4. **bug-hunter-specialist** - Issue identification and resolution
5. **vercel-deployment-specialist** - Deployment optimization and monitoring
6. **neon-database-architect** - Database design and performance
7. **nextjs-performance-optimizer** - Frontend performance and optimization
8. **api-integration-specialist** - External API integration and management
9. **security-auditor-expert** - Security analysis and compliance

### 🔗 Sophisticated Hook System

**Directory Structure: `.claude/knowledge/`**
```
.claude/knowledge/
├── agents/                    # Agent-specific knowledge
│   ├── project-docs-curator/
│   ├── fullstack-tdd-architect/
│   ├── vercel-deployment-specialist/
│   └── [7 other specialized agents]
├── shared/                    # Cross-agent knowledge
│   ├── architecture/          # Current system architecture
│   ├── patterns/             # Successful implementation patterns
│   └── deprecated/           # Outdated approaches to avoid
└── successful_pattern/        # Proven solutions and approaches
```

**Hook Features:**
- **Context Preservation**: Maintains project knowledge across sessions
- **Agent Specialization**: Each agent has domain-specific context
- **Pattern Recognition**: Tracks successful vs. deprecated approaches
- **Knowledge Sharing**: Cross-agent collaboration and learning
- **Architecture Awareness**: Deep understanding of NEON + Vercel stack

### 🎯 Next Steps
1. **Performance**: Optimize response times and caching with performance agent
2. **Features**: Add conversation history UI with fullstack architect
3. **Security**: Comprehensive security audit with security specialist
4. **Database**: Query optimization with database architect
5. **Documentation**: Continuous updates with docs curator

**Enhanced development system with agent specialization and sophisticated knowledge management! 🚀**