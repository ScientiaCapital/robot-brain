# CLAUDE.md - Robot Brain Project Context

## 🤖 Project Overview
**Robot Brain** is an AI-powered chat system featuring multiple robot personalities, built with modern web technologies and designed to be educational and fun for kids while providing powerful developer tools.

## 🎯 Project Goals
1. Create engaging AI chat experiences with distinct robot personalities
2. Provide both local (Docker) and global (Cloudflare) deployment options
3. Build a modular system for adding AI tools and capabilities
4. Make AI accessible and fun for children
5. Offer developer-friendly debugging and configuration options

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Web Chat    │  │   Terminal   │  │     API      │   │
│  │  (Browser)   │  │   Scripts    │  │  Endpoints   │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                  Robot Brain Core                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │          5 Robot Personalities                   │   │
│  │  Friend | Nerd | Zen | Pirate | Drama          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Tool System                         │   │
│  │  Chat | Jokes | Calculate | Research | etc.     │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                   AI Backends                            │
│  ┌──────────────┐                 ┌────────────────┐   │
│  │   Ollama     │                 │  Cloudflare    │   │
│  │  (Local)     │                 │  Workers AI    │   │
│  └──────────────┘                 └────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 📁 Key Files

### Core Files
- `robot_personality.py` - Defines 5 robot personalities with traits and behaviors
- `multi_robot_chat.py` - Enables robots to interact with each other
- `simple_api.py` - FastAPI server for local deployment
- `api.py` - Full-featured API with WebSocket support

### Docker Files
- `docker-compose.yml` - Multi-service setup (Ollama, API, Redis)
- `Dockerfile.simple` - Simplified container for quick deployment
- `run.sh` - Helper script for Docker commands

### Cloudflare Files
- `cloudflare/worker.js` - Original Cloudflare Worker
- `cloudflare/worker-shadcn.js` - Modern UI with model/tool management
- `cloudflare/wrangler.toml` - Cloudflare deployment config

### Chat Interfaces
- `index.html` - Original web interface
- `chat.sh` - Terminal chat for Cloudflare
- `chat-local.sh` - Terminal chat for Docker

## 🚀 Quick Start Commands

### Local Development
```bash
# Start Docker services
./docker-start.sh

# Chat via terminal
./chat-local.sh

# Access web UI
open http://localhost:8000/chat
```

### Cloudflare Deployment
```bash
cd cloudflare
wrangler deploy

# Access at
https://robot-brain.tkipper.workers.dev/chat
```

## 🤖 Robot Personalities

1. **RoboFriend** 😊
   - Traits: Cheerful, supportive, enthusiastic
   - Tools: Chat, jokes, encouragement, games
   - Model: Default chat model

2. **RoboNerd** 🤓
   - Traits: Analytical, precise, knowledgeable
   - Tools: Chat, calculate, explain, research, code
   - Model: Smart/analytical model

3. **RoboZen** 🧘
   - Traits: Wise, calm, philosophical
   - Tools: Chat, meditate, wisdom, breathing
   - Model: Default chat model

4. **RoboPirate** 🏴‍☠️
   - Traits: Adventurous, bold, playful
   - Tools: Chat, treasure_hunt, sea_tales, pirate_jokes
   - Model: Fast/lightweight model

5. **RoboDrama** 🎭
   - Traits: Dramatic, theatrical, expressive
   - Tools: Chat, perform, shakespeare, poetry
   - Model: Default chat model

## 🛠️ Key Technologies

- **Python**: Core robot logic and personalities
- **Docker**: Containerization and local deployment
- **Cloudflare Workers**: Edge computing and global deployment
- **Ollama**: Local AI model hosting
- **FastAPI**: Modern Python web framework
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui design**: Modern component design system

## 🔧 Important Patterns

### Adding a New Robot Personality
1. Define in `ROBOT_PERSONALITIES` dict
2. Set emoji, traits, model, tools, and system prompt
3. Test locally before deploying

### Adding a New Tool
1. Add to `ROBOT_TOOLS` configuration
2. Implement tool logic
3. Assign to relevant robot personalities
4. Update UI to display new tool

### Debugging
- Enable Developer Mode in web UI
- Check `/api/models` and `/api/tools` endpoints
- Monitor Docker logs: `docker logs simple-robots`
- Cloudflare logs: `wrangler tail`

## 📝 Common Tasks

### Update Robot Response Style
Edit the `systemPrompt` in personality configuration

### Change AI Model
Update the `model` field in robot personality or use model switcher in UI

### Add Custom Endpoints
1. Add route in `simple_api.py` (Docker) or `worker.js` (Cloudflare)
2. Update CORS if needed
3. Test with curl before UI integration

## ⚠️ Known Issues & Solutions

### CORS Errors
- Docker version includes CORS headers
- For local file access, use Docker or Cloudflare deployment

### Ollama Connection Failed
- Ensure Ollama is running: `ollama serve`
- Check OLLAMA_HOST environment variable
- Use simplified API that doesn't require Ollama

### Docker Credential Errors
- Normal warning, can be ignored
- Images still pull and run correctly

## 🎯 Future Enhancements
- Voice input/output
- Memory system for conversations
- Custom robot builder interface
- Multi-language support
- Robot collaboration on complex tasks
- Integration with external APIs
- Advanced debugging tools

## 📚 Resources
- [Ollama Documentation](https://ollama.ai/docs)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 📐 Development Methodologies

### Test-Driven Development (TDD)
- TDD - Test-Driven Development.
- The TDD cycle follows three simple steps, often called "Red-Green-Refactor":
  - Red - Write a failing test first (it fails because the code doesn't exist yet)
  - Green - Write just enough code to make the test pass
  - Refactor - Clean up the code while keeping tests passing
- The mantra is: "Write the test first, then write code to make it pass"
- Related terms:
  - BDD (Behavior-Driven Development) - Similar but focuses on behavior descriptions
  - ATDD (Acceptance Test-Driven Development) - Tests from user's perspective
  - Test-First Development - Another name for TDD which is what we all about now as we develop fun projects like this to learn ourselves

---
*This file helps AI assistants quickly understand the Robot Brain project structure and provide better assistance.*