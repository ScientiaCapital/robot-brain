# 🤖 Robot Brain Project

A multi-personality robot chat system with Docker support and Cloudflare deployment.

## Features

- **5 Robot Personalities**: Friend, Nerd, Zen, Pirate, Drama
- **Multi-Robot Chat**: Watch robots discuss, debate, and brainstorm
- **Docker Support**: Fully containerized with Ollama
- **Cloudflare Workers**: Deploy globally with edge computing
- **Real-time Chat**: WebSocket support for live conversations
- **Modern React UI**: Built with Next.js, TypeScript, and shadcn/ui
- **Type Safety**: Full TypeScript support with zero type errors
- **Code Quality**: ESLint configured with strict rules

## Quick Start

### 1. Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- Ollama server with AI models
- Robot API on http://localhost:8000
- Redis for caching

### 2. Run Locally (without Docker)

```bash
# Install dependencies
python3 -m pip install -r requirements.txt

# Make sure Ollama is running
ollama serve

# Run the API
python3 api.py

# Or run individual scripts
python3 robot_personality.py
python3 multi_robot_chat.py
```

### 3. Deploy to Cloudflare

```bash
cd cloudflare

# Install wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

Your worker will be available at: `https://robot-brain.tkipper.workers.dev`

### 4. Run Modern React UI

```bash
cd robot-brain-ui

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

Access the UI at: http://localhost:3000

## Usage

### Web Interface
Open `index.html` in your browser to chat with robots.

### API Endpoints

- `GET /` - Welcome message
- `GET /robots` - List all robot personalities
- `POST /chat` - Chat with a specific robot
- `POST /multi-chat` - Have robots discuss topics
- `WS /ws` - WebSocket for real-time chat

### Example API Calls

```bash
# Chat with RoboFriend
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"personality": "friend", "message": "Hello!"}'

# Multi-robot discussion
curl -X POST http://localhost:8000/multi-chat \
  -H "Content-Type: application/json" \
  -d '{"topic": "the future of AI", "interaction_type": "discussion"}'
```

## Robot Personalities

1. **RoboFriend** 😊 - Cheerful and supportive
2. **RoboNerd** 🤓 - Technical and analytical
3. **RoboZen** 🧘 - Wise and philosophical
4. **RoboPirate** 🏴‍☠️ - Adventurous and playful
5. **RoboDrama** 🎭 - Theatrical and expressive

## Project Structure

```
my-robot-project/
├── robot_personality.py    # Robot personality definitions
├── multi_robot_chat.py     # Multi-robot chat system
├── api.py                  # FastAPI server
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Container image
├── requirements.txt        # Python dependencies
├── index.html             # Web interface
├── cloudflare/            # Cloudflare Worker files
│   ├── worker.js          # Edge worker code
│   └── wrangler.toml      # Deployment config
├── crypto-research-agent/  # Crypto analysis bot
├── robot-brain-ui/        # React frontend with shadcn UI
│   ├── src/               # TypeScript source code
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # React components for multi-robot chat
│   │   └── lib/          # Utility functions and configurations
│   ├── __tests__/        # Jest test suites
│   ├── package.json      # Frontend dependencies
│   ├── tsconfig.json     # TypeScript configuration
│   ├── jest.config.js    # Jest test configuration
│   └── .eslintrc.json    # ESLint configuration
└── examples/              # Multi-agent framework examples
    ├── crewai/           # CrewAI framework and examples
    ├── gemini-fullstack-langgraph-quickstart/  # Google Gemini + LangGraph
    ├── langgraph-supervisor-py/  # LangGraph supervisor pattern
    ├── langgraph-swarm-py/      # LangGraph swarm pattern
    └── langgraph-agent-template/  # Basic LangGraph template
```

## Environment Variables

- `OLLAMA_HOST` - Ollama server host (default: localhost)
- `OLLAMA_PORT` - Ollama server port (default: 11434)

## Troubleshooting

1. **Ollama not connecting**: Make sure Ollama is running and models are downloaded
2. **Docker issues**: Check logs with `docker-compose logs`
3. **Cloudflare deployment**: Ensure you're logged in with `wrangler login`

## Multi-Agent Framework Research

The `examples/` directory contains comprehensive research into multi-agent AI frameworks:

### Frameworks Analyzed
- **CrewAI**: Role-based agent teams with built-in collaboration
- **LangGraph Supervisor**: Hierarchical agent coordination (SELECTED)
- **LangGraph Swarm**: Peer-to-peer agent handoffs
- **Google Gemini**: Fullstack research agent with web search

### Framework Selection
We selected **LangGraph Supervisor** for implementing multi-robot conversations because:
- **Educational Value**: Kids understand "supervisor assigns tasks to specialists"
- **Reliability**: Well-tested hierarchical pattern with clear control flow
- **Production Ready**: Built on LangGraph with enterprise features
- **Timeout Handling**: Better suited for complex multi-agent conversations than Cloudflare Workers

### Implementation Plan
1. Create Python FastAPI backend using LangGraph Supervisor
2. Convert each robot personality into a specialized agent
3. Build supervisor agent to coordinate multi-robot discussions
4. Integrate with existing React UI components

## Development Status

### Code Quality Metrics (as of latest update)
- **TypeScript Errors**: 0 (down from 337)
- **ESLint Errors**: 0 
- **Test Suite**: All tests compile successfully
- **Type Safety**: Full null safety implemented
- **Code Standards**: Strict ESLint rules enforced

### Recent Improvements
- ✅ Fixed all TypeScript type errors
- ✅ Implemented proper null safety patterns
- ✅ Configured ESLint with Next.js strict rules
- ✅ Added Jest type definitions
- ✅ Improved code organization and patterns

## Next Steps

- **HIGH PRIORITY**: Implement LangGraph Supervisor backend
- Fix failing behavior tests in the test suite
- Add conversation memory and context management  
- Implement voice synthesis for robot personalities
- Create robot memory/learning capabilities
- Build mobile app version
- Add more interactive educational features

## Contributing

When contributing to this project:
1. Run `npx tsc --noEmit` to ensure no TypeScript errors
2. Run `npm run lint` to check code style
3. Follow TDD practices - write tests first
4. Maintain the zero-error policy for TypeScript and ESLint

Enjoy chatting with your robot friends! 🤖✨