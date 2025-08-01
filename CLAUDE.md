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
│  │  Email | WebScraping | Database | Puppeteer     │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                   AI Backends                            │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │   Ollama     │  │  Cloudflare    │  │ LangGraph   │  │
│  │  (Local)     │  │  Workers AI    │  │ Supervisor  │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│              Cloudflare Services                         │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │      D1      │  │       KV       │  │  Vectorize  │  │
│  │  (Database)  │  │    (Memory)    │  │    (RAG)    │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

[... rest of the existing content remains the same ...]

## 🎯 TDD (Test-Driven Development) Success

### Current TDD Status
**38/38 tests passing** - 100% success rate!

We've followed strict TDD principles:
1. ❌ RED - Write failing tests first
2. ✅ GREEN - Write minimal code to pass
3. 🔧 REFACTOR - Ready for optimization

### Latest TDD Achievements (August 1, 2025)

#### Tool System Implementation ✅
- **EmailTool**: 4 tests - validation, SMTP integration, error handling
- **WebScrapingTool**: 2 tests - content fetching, error handling  
- **DatabaseTool**: 1 test - key-value storage
- **PuppeteerScrapingTool**: 6 tests - browser automation, screenshots

#### Cloudflare Services Integration ✅
- **D1 Database**: 7 tests - conversations, interactions, batch ops
- **KV Namespace**: 9 tests - sessions, robot state, user preferences
- **Vectorize**: 8 tests - embeddings, RAG pattern, similarity search

#### API Integration ✅
- **FastAPI Endpoints**: 5 tests - tool endpoints, error handling
- **Integration Tests**: 1 test - cross-component functionality

[... rest of the existing content remains the same ...]