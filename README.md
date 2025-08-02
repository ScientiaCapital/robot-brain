# 🤖 Robot Brain MVP - One Robot Working Perfectly

**Status: ✅ LIVE & DEPLOYED** - Simple Next.js app with ONE robot assistant.

**🚀 Try it now**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app

Welcome to Robot Brain - an AI-powered chat system featuring Robot Friend, a cheerful and supportive companion for kids.

## 🎯 MVP Focus

- **🤖 ONE Robot Friend**: Cheerful, supportive, enthusiastic personality
- **🎙️ Voice Interaction**: Text mode and voice mode with ElevenLabs TTS
- **⚡ Real AI**: Anthropic Claude for intelligent responses
- **🗄️ Neon PostgreSQL**: Conversation storage
- **🚀 Vercel Deployment**: Simple one-app deployment

## 🚀 Live Demo

**Try Robot Friend now**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app

No setup required - just visit the link and start chatting with Robot Friend! 🤖😊

## 🎮 How to Use

### Text Mode
1. Type your message in the chat input
2. Robot Friend responds with AI-generated text
3. Response is spoken using text-to-speech

### Voice Mode
1. Click the microphone button
2. Speak your message
3. Robot Friend responds with voice

## 🧪 Testing

```bash
# Run all tests
npm test

# Run build checks
npm run build

# Run linting
npm run lint
```

## 🏗️ Architecture

```
Robot Brain MVP (Next.js App)
├── Frontend (React Components)
├── API Routes (/api/*)
│   ├── /api/chat (Anthropic Claude)
│   └── /api/voice/text-to-speech (ElevenLabs)
├── Database (Neon PostgreSQL) 
└── Deployment (Vercel)
```

## 🎯 MVP Features

- **Robot Friend**: Cheerful, supportive companion
- **Voice Modes**: Toggle between text and voice
- **Real AI**: Powered by Google Gemini
- **Clean Code**: Following TDD principles
- **Production Ready**: All tests passing

## 📝 Development Philosophy

1. **ONE thing working perfectly** before adding more
2. **Test-Driven Development** for quality
3. **Clean architecture** without over-engineering
4. **User-focused** design for kids

## 🚀 Vision

Once this MVP is perfect with ONE robot:
1. Add more robots one at a time
2. Each robot fully tested before next
3. Scale to original 16 robots
4. Maintain clean TDD principles

But for now: **ONE ROBOT, WORKING PERFECTLY!** 🤖✨

## 🚀 Deployment

### 🌐 Current Deployment
- **Platform**: Vercel (Next.js serverless)
- **Database**: Neon PostgreSQL (serverless)
- **Domain**: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app
- **Status**: ✅ Production ready

### 📊 Tech Stack
- **Frontend**: Next.js 15.4.5 + React + TypeScript
- **API**: Next.js API routes (serverless functions)
- **Database**: Neon PostgreSQL (5 tables, auto-scaling)
- **AI**: Anthropic Claude (claude-3-haiku-20240307)
- **Voice**: ElevenLabs TTS (Rachel voice)
- **Hosting**: Vercel (global CDN + serverless)

### 🔄 Deployment Process
```bash
# Deploy to Vercel
vercel --prod

# Environment variables managed via:
vercel env add VARIABLE_NAME production
```

**Simple, fast, scalable! 🚀**

## 📄 License

MIT