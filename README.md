# 🤖 Robot Brain - One Robot Working Perfectly

**Status**: 🔄 In Development | **Focus**: MVP with one robot assistant

An AI-powered chat system featuring Robot Friend, a cheerful and supportive companion for kids.

## 🎯 MVP Philosophy

> **ONE thing working perfectly** before adding more

- One robot (Robot Friend) fully functional
- Voice and text interaction modes
- Real AI responses
- Production-ready deployment

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/robot-brain.git
cd robot-brain

# Setup environment
cp .env.example .env
# Fill in your API keys in .env

# Install and run
cd ui
npm install
npm run dev
```

Visit `http://localhost:3000` to chat with Robot Friend! 🤖

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15.4.5 + React + TypeScript |
| Database | Supabase (PostgreSQL) |
| AI - Primary | Anthropic Claude |
| AI - Secondary | Google Gemini |
| AI - Chinese LLMs | OpenRouter (DeepSeek, Qwen, Yi) |
| Voice | Cartesia TTS |
| Deployment | Vercel |

## 🎮 Features

### Text Mode
1. Type your message
2. Robot Friend responds with AI-generated text
3. Response is spoken via text-to-speech

### Voice Mode
1. Click the microphone button
2. Speak your message
3. Robot Friend responds with voice

## 🔑 Environment Variables

Create a `.env` file from `.env.example`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
CARTESIA_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...

# Optional (for additional AI providers)
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
```

## 📁 Project Structure

```
robot-brain/
├── ui/                  # Next.js application
│   ├── src/app/
│   │   ├── api/        # API routes
│   │   │   ├── chat/   # Anthropic Claude
│   │   │   └── voice/  # Cartesia TTS
│   │   └── page.tsx    # Main chat UI
├── .env.example        # Environment template
├── CLAUDE.md           # Full project docs
└── README.md           # This file
```

## 🧪 Development

```bash
cd ui

# Development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint check
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Create new Vercel project
2. Import from GitHub
3. Set root directory to `ui/`
4. Add environment variables in Vercel dashboard
5. Deploy!

```bash
# Or deploy via CLI
vercel --prod
```

## 🤖 Robot Friend

```
Name: Robot Friend
Personality: Cheerful, supportive, enthusiastic
Voice: Cartesia TTS
Target: Kids
```

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Full project documentation
- **[.claude/context.md](./.claude/context.md)** - Current sprint context

## 🛠️ AI Providers

| Provider | Use Case | Models |
|----------|----------|--------|
| Anthropic | Primary chat | claude-3-haiku |
| Google Gemini | Alternative | gemini-1.5-flash |
| OpenRouter | Chinese LLMs | DeepSeek, Qwen, Yi |

## 📄 License

MIT
