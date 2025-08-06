# CLAUDE.md - My-Robot-Brain Strategic Evolution

## 🤖 Project Overview
**My-Robot-Brain** is a proactive agentic "second brain" for developers that intelligently connects and orchestrates their digital life (Gmail, Slack, GitHub, Notion) through voice-first interaction. Built on a foundation of a production-ready AI Voice Agent Template with comprehensive deployment automation and robust error handling.

## 🎯 Current Status: 🚀 STRATEGIC EVOLUTION IN PROGRESS (Phase A Complete)
**Strategic Three-Phase Approach**:
- **✅ Phase A (COMPLETE)**: Template foundation with deployment automation
- **🚧 Phase B (NEXT)**: Core intelligence layer with ElevenLabs Conversational AI + E2B + Context7
- **📋 Phase C (FUTURE)**: Full My-Robot-Brain with 4-agent architecture and Universal Inbox

### Phase A: Template Foundation ✅ COMPLETE
1. **✅ A.1**: Vercel deployment automation with comprehensive validation (22/22 checks passing)
2. **✅ A.2**: Database setup automation with Neon v1.0.1 compatibility fixes  
3. **✅ A.3**: Configuration system with JSON-based agent customization
4. **✅ A.4**: Voice pipeline with dynamic ElevenLabs integration
5. **✅ A.5**: Production-grade error handling and health monitoring

## 🏗️ Evolution Architecture

### Phase A: Current Foundation (✅ Complete)
```
┌─────────────────────────────────────────────────────────┐
│              Production-Ready Template                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Next.js     │  │  API Routes │  │   Neon DB    │   │
│  │  Frontend    │  │ (22/22 ✓)   │  │ (Auto Setup) │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │      Deployment & Health Monitoring (✅)           │ │
│  │  • vercel.json  • pre-deploy validation             │ │
│  │  • env setup    • health endpoints                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

### Phase B: Intelligence Layer (🚧 Next)
┌─────────────────────────────────────────────────────────┐
│                Core Intelligence                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ ElevenLabs   │  │ E2B Sandbox │  │ Context7 SDK │   │
│  │ ConvAI       │  │ Execution   │  │ Real-time    │   │
│  │ Platform     │  │ Environment │  │ Docs         │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘

### Phase C: My-Robot-Brain (📋 Future)
┌─────────────────────────────────────────────────────────┐
│           4-Agent Architecture + Universal Inbox        │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ Orchestrator │  │ Interface   │  │ Knowledge    │   │
│  │ Claude Voice │  │ Professional│  │ Friendly     │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │ Code Agent   │  │ Universal Inbox & Actions       │ │
│  │ Technical    │  │ Gmail│Slack│GitHub│Notion      │ │
│  └──────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Technical Stack

### 🌐 Core Framework
- **Framework**: Next.js 15.4.5 (App Router + API Routes)
- **Frontend**: React 19.1.0 with TypeScript (strict mode)
- **UI**: Radix UI components + Tailwind CSS + Framer Motion
- **Deployment**: Vercel (serverless functions + global CDN)
- **Build**: ✅ Successful production build

### 🗄️ Database
- **Provider**: Neon (Serverless PostgreSQL)
- **Tables**: `sessions`, `conversations`, `agent_interactions`, `tool_usage`, `embeddings`, `analytics`
- **Setup**: ✅ Automated database setup script (`npm run setup:database`)
- **Features**: Generic schema, transaction safety, performance optimization, <5min setup

### 🤖 AI & Voice Services
- **Chat AI**: Anthropic Claude (configurable model and settings)
- **Voice TTS**: ElevenLabs (configurable voices and models)
- **Speech Recognition**: Browser Web Speech API

## 🎛️ Configuration System

### 📁 Configuration Files (`/config/`)

**`agent.json`** - Main agent configuration:
```json
{
  "agentName": "Your Agent Name",
  "personality": "professional", 
  "emoji": "👔",
  "voiceId": "pNInz6obpgDQGcFmaJgB",
  "voiceName": "Adam",
  "welcomeMessage": "Hello! How can I help you today?",
  "industry": "business",
  "modelSettings": {
    "maxTokens": 100,
    "temperature": 0.3,
    "model": "claude-3-haiku-20240307"
  },
  "voiceSettings": {
    "model": "eleven_flash_v2_5",
    "stability": 0.5,
    "similarityBoost": 0.8,
    "style": 0.0,
    "useSpeakerBoost": true
  }
}
```

**`personalities.json`** - Available personality types:
- cheerful, professional, friendly, educational, supportive, energetic

**`voices.json`** - ElevenLabs voice options:
- Rachel (friendly female), Adam (professional male), Bella (educational female)
- Charlie (authoritative British male), Domi (energetic female)

### 🔄 Dynamic Configuration Loading
- Real-time configuration loading via `/src/lib/config.ts`
- Fallback configurations for robustness
- Validation system ensuring configuration integrity

## 🚀 Template Usage

### 🏁 Quick Start (Available Now - Database Ready!)
1. Clone this repository
2. Copy `.env.example` to `.env.local` and add API keys
3. Customize `/config/agent.json` with your agent details
4. Run `npm install && npm run setup:database` (✅ <5 minutes automated setup)
5. Deploy with `npm run dev` (Phase 5 deployment automation coming soon)

### 🎯 Customization Options
- **Agent Name & Personality**: Edit `agent.json`
- **Voice Selection**: Choose from available voices in `voices.json`
- **Industry Vertical**: Customize system prompts and traits
- **AI Model Settings**: Configure Claude model parameters
- **Voice Settings**: Adjust ElevenLabs TTS parameters

## 🔐 Environment Configuration

### 🔑 Required API Keys
```bash
# Database (Neon PostgreSQL)
NEON_DATABASE_URL="postgresql://..."

# AI Services
ANTHROPIC_API_KEY="sk-ant-api03-..."
ELEVENLABS_API_KEY="sk_..."
```

### 🛣️ API Endpoints
- `/api/chat` - Anthropic Claude integration with configurable settings
- `/api/voice/text-to-speech` - ElevenLabs TTS with voice configuration
- `/api/health` - System health monitoring

## 📋 Development Status

### ✅ Phase A Achievements (Complete)
1. **Production Deployment Automation**: Complete Vercel deployment pipeline with 22/22 validation checks
2. **Database Infrastructure**: Neon PostgreSQL with automated setup, compatibility fixes for v1.0.1
3. **Health Monitoring**: Comprehensive health endpoints and error validation systems  
4. **Configuration System**: Dynamic JSON-based agent customization (agent.json, voices.json, personalities.json)
5. **Voice Pipeline**: ElevenLabs TTS integration with configurable models and settings
6. **Error Handling**: Production-grade error handling with detailed logging and recovery

### 🚧 Phase B: Next Steps (Intelligence Layer)
- **ElevenLabs Conversational AI**: Replace basic TTS with full conversation platform
- **E2B Sandbox Integration**: Secure code execution environment with voice narration
- **Context7 Integration**: Real-time documentation retrieval preventing LLM hallucinations  
- **Multi-Agent Foundation**: Orchestrator + Code agent coordination patterns

### 📋 Phase C: My-Robot-Brain Vision (Future)
- **4-Agent Architecture**: Orchestrator, Interface, Knowledge, Code specialists
- **Universal Inbox**: Gmail, Slack, GitHub, Notion unified interface
- **Proactive Knowledge Curator**: Automatic learning and organization
- **Advanced Workflow Automation**: Natural language multi-step task execution

## 🎯 Strategic Goals

### Current Foundation (Phase A ✅)
**Achieved**: Production-ready template with comprehensive deployment automation
- Complete Vercel deployment pipeline (22/22 validation checks passing)
- Automated database setup with Neon PostgreSQL
- Production-grade health monitoring and error handling
- Configuration-driven agent customization system

### Intelligence Evolution (Phase B 🚧)
**Objective**: Transform basic TTS into intelligent conversational AI
- ElevenLabs Conversational AI platform integration (full conversation vs simple TTS)
- E2B sandbox for secure AI-generated code execution with voice narration
- Context7 integration for real-time documentation retrieval
- Foundation for multi-agent architecture

### My-Robot-Brain Vision (Phase C 📋)
**Vision**: Proactive agentic "second brain" for developers
- 4 specialized AI agents with distinct voices and personalities
- Universal Inbox connecting Gmail, Slack, GitHub, Notion
- Proactive knowledge curation and workflow automation
- Natural language interface for complex multi-step developer tasks

## 🚀 Current Technical Status

### ✅ Production Ready Systems
- **Database**: Neon PostgreSQL with automated schema creation and health monitoring
- **Deployment**: Comprehensive Vercel automation with 22-point validation system
- **APIs**: Health monitoring endpoints, configuration-driven chat and TTS
- **Error Handling**: Robust error recovery, detailed logging, graceful degradation

### 🔧 Key Technical Achievements
- Fixed critical Neon v1.0.1 syntax compatibility issues
- Resolved Next.js metadata warnings and TypeScript compilation
- Created simplified database setup script bypassing complex SQL parsing
- Comprehensive pre-deployment validation covering all system components

**This strategic evolution builds a production-ready foundation in Phase A, then layers on advanced intelligence in Phase B, ultimately becoming the comprehensive My-Robot-Brain system in Phase C! 🚀**