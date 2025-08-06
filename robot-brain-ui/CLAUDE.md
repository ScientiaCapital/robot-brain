# CLAUDE.md - AI Voice Agent Template

## 🤖 Project Overview
**AI Voice Agent Template** is a cloneable GitHub repository that allows anyone to rapidly deploy custom AI voice agents for any industry vertical (BDR, Construction, Operations, etc.). Built with Next.js 15.4.5, the template features a dynamic JSON configuration system enabling users to create personalized AI agents without writing code.

## 🎯 Current Status: 🚧 TEMPLATE TRANSFORMATION IN PROGRESS
1. **✅ PHASE 1**: TypeScript compilation errors fixed - Clean template foundation
2. **✅ PHASE 2**: Configuration system created - JSON-based agent customization  
3. **✅ PHASE 3**: Voice pipeline made configurable - Dynamic ElevenLabs integration
4. **🚧 PHASE 4**: Database setup script and generic schema (IN PROGRESS)
5. **📋 PHASE 5**: Vercel deployment automation (PENDING)
6. **📋 PHASE 6**: Template documentation and setup guides (PENDING)

## 🏗️ Template Architecture

**Next.js 15.4.5 App with Configuration-Driven AI Voice Agent:**

```
┌─────────────────────────────────────────────────────────┐
│                 AI Voice Agent Template                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Frontend    │  │  API Routes │  │   Database   │   │
│  │  (React)     │  │ (/api/*)    │  │    (Neon)    │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │         Configuration System (JSON)                 │ │
│  │  • agent.json       • voices.json                   │ │
│  │  • personalities.json                               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                  External APIs                           │
│  ┌────────────────┐  ┌─────────────┐                    │
│  │   Anthropic    │  │ ElevenLabs  │                    │
│  │    Claude      │  │  Voice TTS  │                    │
│  └────────────────┘  └─────────────┘                    │
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
- **Tables**: `conversations`, `sessions`, `embeddings`, `robot_interactions`, `tool_usage`
- **Setup**: Automated database setup script (npm run setup:database)

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

### 🏁 Quick Start (Future - Phase 6)
1. Clone this repository
2. Copy `.env.example` to `.env.local` and add API keys
3. Customize `/config/agent.json` with your agent details
4. Run `npm install && npm run setup:database`
5. Deploy with `npm run dev`

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

### ✅ Completed Features
1. **Clean Template Foundation**: TypeScript compilation errors resolved
2. **Configuration System**: JSON-based agent customization system
3. **Configurable Voice Pipeline**: Dynamic ElevenLabs integration with voice settings
4. **API Integration**: Anthropic Claude with configurable model settings
5. **UI Components**: React components that adapt to configuration

### 🚧 Current Work (Phase 4)
- Database setup automation script
- Generic database schema for any agent type
- Template-ready database configuration

### 📋 Upcoming Features (Phases 5-6)
- Vercel deployment automation (`vercel.json` configuration)
- Comprehensive template documentation
- Setup guides and tutorials
- Template validation and testing

## 🎯 Template Goals

**Primary Objective**: Create a plug-and-play template where users can:
1. Clone the repository
2. Configure their agent via JSON files (no coding required)
3. Deploy their custom AI voice agent with minimal setup

**Target Users**: 
- Business owners wanting AI agents for their industry
- Developers needing rapid AI agent prototyping  
- Companies requiring custom voice assistants
- Anyone wanting to create "my-robot-brain" or similar AI agents

## 🔄 Configuration-First Architecture

Unlike traditional hard-coded applications, this template uses a **configuration-first approach**:
- All agent behavior defined in JSON configuration files
- Dynamic loading of agent personalities, voices, and settings
- No code changes required for customization
- Template ready for immediate cloning and deployment

**This AI Voice Agent Template transforms the original Robot Brain project into a universal, configurable template for creating custom AI voice agents across any industry! 🚀**