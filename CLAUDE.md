# CLAUDE.md - Robot Brain Project Context

## 🤖 Project Overview
**Robot Brain** is an AI-powered chat system featuring multiple robot personalities, built with modern web technologies and designed to be educational and fun for kids while providing powerful developer tools.

## 🎯 Project Goals
1. Create engaging AI chat experiences with distinct robot personalities
2. Enable multi-robot conversations so kids can see how AI agents collaborate
3. Provide both local (Docker) and global (Cloudflare) deployment options
4. Build a modular system for adding AI tools and capabilities
5. Make AI accessible and fun for children
6. Offer developer-friendly debugging and configuration options

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
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │   Ollama     │  │  Cloudflare    │  │ LangGraph   │  │
│  │  (Local)     │  │  Workers AI    │  │ Supervisor  │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
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
- `cloudflare/worker-shadcn.js` - Modern UI with model/tool management (✅ Fixed template literal issues)
- `cloudflare/wrangler.toml` - Cloudflare deployment config

### Chat Interfaces
- `index.html` - Original web interface
- `chat.sh` - Terminal chat for Cloudflare
- `chat-local.sh` - Terminal chat for Docker
- `robot-brain-ui/` - Modern React UI with multi-robot chat capabilities

### Multi-Agent Examples
- `examples/crewAI/` - CrewAI framework and examples
- `examples/crewAI-examples/` - Official CrewAI templates and patterns
- `examples/Multi-AI-Agent-Systems-with-crewAI/` - Advanced multi-agent workflows
- `examples/langgraph/` - Core LangGraph framework
- `examples/langgraph-supervisor-py/` - Hierarchical supervisor pattern ⭐ (Selected)
- `examples/langgraph-swarm-py/` - Peer-to-peer swarm pattern
- `examples/generative-ai/` - Google Cloud Gemini multi-agent examples
- `examples/gemini-fullstack-langgraph-quickstart/` - Gemini + LangGraph integration

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

### Multi-Robot Chat (React UI)
```bash
cd robot-brain-ui
npm install
npm run dev

# Access modern UI at
http://localhost:3000
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
- **LangGraph Supervisor**: Multi-agent orchestration framework ⭐ (Selected)
- **Ollama**: Local AI model hosting
- **FastAPI**: Modern Python web framework
- **React + Vite**: Modern frontend with multi-robot chat UI
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui design**: Modern component design system

## 🔬 Multi-Agent Framework Research & Selection

### Problem Identified: Cloudflare Workers Timeout Limitations
Our initial Cloudflare Workers implementation for multi-robot conversations hit fundamental timeout limits (10-30 seconds), even with optimizations:
- ✅ Parallel AI calls with `Promise.all()`
- ✅ Reduced conversation rounds to 1
- ✅ Added timeout protection per AI call (8 seconds)
- ❌ Still experienced hanging and timeouts during multi-robot discussions

### Frameworks Evaluated

#### 1. **CrewAI** - Role-Playing Collaborative Agents
- **Pattern**: Sequential task-based collaboration with roles, goals, and backstories
- **Strengths**: Very educational (easy role understanding), built-in memory/delegation, natural conversation flow
- **Educational Value**: ⭐⭐⭐⭐ (Kids understand "Customer Support Agent" vs "Quality Assurance Agent")

#### 2. **LangGraph Supervisor** - Hierarchical Management ⭐ **SELECTED**
- **Pattern**: Central supervisor manages specialized worker agents  
- **Strengths**: Clear management structure, excellent timeout handling, enterprise-grade reliability
- **Educational Value**: ⭐⭐⭐⭐⭐ (Kids understand "robot supervisor assigns tasks to robot specialists")

#### 3. **LangGraph Swarm** - Peer-to-Peer Dynamic Handoffs
- **Pattern**: Agents dynamically hand off control to each other
- **Strengths**: Most flexible, maintains context across switches, remembers last active agent
- **Educational Value**: ⭐⭐⭐ (More complex for kids to understand peer relationships)

#### 4. **Google Gemini + LangGraph** - Research-Focused
- **Pattern**: Single agent with iterative research loops
- **Strengths**: Latest Gemini 2.0 models, excellent research capabilities, enterprise deployment
- **Educational Value**: ⭐⭐ (Single agent, not multi-robot conversations)

### Selected Solution: LangGraph Supervisor

**Why LangGraph Supervisor was chosen:**

🎓 **Educational Benefits**
- Kids easily understand "robot supervisor coordinates robot specialists"
- Clear hierarchy: supervisor decides which robot expert to call for each topic
- Visible delegation and collaboration patterns

🔧 **Technical Benefits**  
- **Solves Timeout Issues**: Built-in robust timeout handling and parallel execution
- **Enterprise-Grade**: Production-ready with streaming, memory, and error handling
- **Personality Mapping**: Each robot becomes a specialist agent:
  - RoboNerd → Math & Research Expert
  - RoboPirate → Storytelling & Adventure Expert  
  - RoboZen → Philosophy & Wisdom Expert
  - RoboFriend → Social & Emotional Support Expert
  - RoboDrama → Performance & Creative Expert

🚀 **Implementation Plan**
- Python FastAPI backend with LangGraph Supervisor
- Supervisor orchestrates multi-robot discussions
- Maintains existing React UI components
- Gradual migration alongside Cloudflare Workers

### Educational Value: Teaching Kids About AI Collaboration

The supervisor pattern is perfect for demonstrating AI teamwork to children:

```
👑 Robot Supervisor: "We need to solve a math problem and make it fun!"
                      ↓
🤓 RoboNerd: "I'll handle the calculations and explain the logic"
🏴‍☠️ RoboPirate: "Arr! I'll turn it into a treasure hunt adventure!"
                      ↓  
👑 Robot Supervisor: "Perfect! Nerd, calculate. Pirate, make it exciting!"
```

This mirrors how humans collaborate in teams - with clear roles, coordination, and shared goals.

## 🔧 Important Patterns

### Adding a New Robot Personality
1. Define in `ROBOT_PERSONALITIES` dict in `src/lib/robot-config.ts`
2. Set emoji, traits, model, tools, and system prompt
3. Test locally before deploying
4. Ensure TypeScript types are properly defined

### Adding a New Tool
1. Add to `ROBOT_TOOLS` configuration in `src/lib/robot-config.ts`
2. Implement tool logic
3. Assign to relevant robot personalities
4. Update UI to display new tool
5. Use the `robotHasTool()` helper function for type-safe tool checks

### Debugging
- Enable Developer Mode in web UI
- Check `/api/models` and `/api/tools` endpoints
- Monitor Docker logs: `docker logs simple-robots`
- Cloudflare logs: `wrangler tail`
- TypeScript errors: `npx tsc --noEmit`
- ESLint issues: `npm run lint`
- Test failures: `npm test`

## 📝 Common Tasks

### Update Robot Response Style
Edit the `systemPrompt` in personality configuration

### Change AI Model
Update the `model` field in robot personality or use model switcher in UI

### Add Custom Endpoints
1. Add route in `simple_api.py` (Docker) or `worker.js` (Cloudflare)
2. Update CORS if needed
3. Test with curl before UI integration

## ✅ Recently Resolved Issues (July 31, 2025)

### Template Literal Escaping in Cloudflare Worker ✅
- **Issue**: Broken template literals prevented Cloudflare deployment
- **Solution**: Consolidated worker-shadcn.js files using the properly escaped version
- **Status**: RESOLVED - Cloudflare deployment ready

### Test Infrastructure Issues ✅
- **Issue**: Tests failed with "fetch is not defined" errors
- **Solution**: Added whatwg-fetch polyfill to Jest setup
- **Status**: RESOLVED - All tests compile and run successfully

## ⚠️ Known Issues & Solutions

### Cloudflare Workers Multi-Robot Chat Timeouts ⚠️
- **Issue**: Multi-robot conversations timeout after 10-30 seconds even with optimizations
- **Root Cause**: Cloudflare Workers execution time limits insufficient for multiple sequential AI calls
- **Current Status**: Functional for simple single-robot chat, problematic for multi-robot discussions
- **Solution**: Migrating to Python FastAPI backend with LangGraph Supervisor (in progress)

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

## 🎯 Recent Achievements (July 31, 2025)

### Code Quality Improvements
- ✅ **TypeScript**: Reduced errors from 337 to 0
- ✅ **ESLint**: Configured and fixed all linting issues
- ✅ **Type Safety**: Implemented comprehensive null safety
- ✅ **Test Infrastructure**: All tests now compile and run successfully
- ✅ **TDD Process**: Established test-driven development workflow

### Latest Bug Fixes (Using TDD Approach)
- ✅ **Template Literal Issue**: Fixed escaping in worker-shadcn.js
- ✅ **Fetch Polyfill**: Added whatwg-fetch for Node.js test environment
- ✅ **Test Compilation**: Resolved all import and type errors
- ✅ **WebSocket Clarification**: Confirmed WebSocket only in FastAPI, not Cloudflare

### Technical Debt Resolved
- Fixed missing `@types/jest` package
- Resolved `window.matchMedia` mock for tests
- Implemented type-safe helper functions
- Fixed Tailwind configuration type issues
- Cleaned up unused imports and variables
- Added fetch polyfill to jest.setup.js

## 🎯 Next Steps (Following TDD Approach)

### Immediate Priorities
1. **Deploy to Cloudflare** - Template literal issue is fixed, ready to deploy
2. **Implement LangGraph Supervisor** - Multi-robot conversations with proper timeout handling
3. **Fix Remaining Test Failures** - Minor test expectation mismatches

### Future Enhancements (All Using TDD)
- Voice input/output (Write tests first!)  
- Memory system for conversations (Test the interface before implementation)
- Custom robot builder interface (TDD from the start)
- Multi-language support (Test-driven i18n)
- Advanced debugging tools for supervisor/agent interactions
- Integration with external APIs (Mock first, implement second)
- Educational insights showing AI decision-making process

## 📚 Resources

### Core Technologies
- [Ollama Documentation](https://ollama.ai/docs)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Multi-Agent Frameworks
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) ⭐ (Selected)
- [LangGraph Supervisor Pattern](https://github.com/langchain-ai/langgraph-supervisor-py)
- [CrewAI Documentation](https://docs.crewai.com/)
- [Google Gemini Multi-Agent Examples](https://github.com/GoogleCloudPlatform/generative-ai)

## 📐 Development Methodologies

### **Test-Driven Development (TDD) - MANDATORY**

**⚠️ ULTRA IMPORTANT: We use TDD principles and process EVERY step of the way. This is an ULTRA must for our success.**

- **TDD is NON-NEGOTIABLE** - Every feature, fix, or change MUST follow TDD
- The TDD cycle follows three simple steps, often called "Red-Green-Refactor":
  - **RED** - Write a failing test first (it fails because the code doesn't exist yet)
  - **GREEN** - Write just enough code to make the test pass
  - **REFACTOR** - Clean up the code while keeping tests passing
- The mantra is: "Write the test first, then write code to make it pass"
- Related terms:
  - BDD (Behavior-Driven Development) - Similar but focuses on behavior descriptions
  - ATDD (Acceptance Test-Driven Development) - Tests from user's perspective
  - Test-First Development - Another name for TDD

### **Current Code Quality Standards (Strictly Enforced)**
- **TypeScript Errors**: 0 (run `npx tsc --noEmit` before ANY commit)
- **ESLint Errors**: 0 (run `npm run lint` before ANY commit)
- **Test Status**: All tests MUST compile and run
- **Jest Configuration**: Properly configured with React Testing Library
- **Fetch Polyfill**: Implemented for Node.js test environment
- **Null Safety**: Use optional chaining and null checks throughout
- **Type Safety**: NO `any` types allowed without explicit justification

---
*This file helps AI assistants quickly understand the Robot Brain project structure and provide better assistance.*