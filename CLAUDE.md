# CLAUDE.md - Robot Brain Project Context

## 🤖 Project Overview
**Robot Brain** is an AI-powered chat system featuring multiple robot personalities, built with modern web technologies and designed to be educational and fun for kids while providing powerful developer tools.

## 🎯 Project Goals
1. Create engaging AI chat experiences with distinct robot personalities
2. Enable multi-robot conversations so kids can see how AI agents collaborate
3. Provide scalable cloud deployment with Neon PostgreSQL
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
│  │      Email | Calculator | Database              │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                 FastAPI Server                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │        RESTful API Endpoints                     │   │
│  │    /api/chat | /api/robots | /api/tools        │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                   AI Backends                            │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │   Ollama     │  │   Future AI    │  │ LangGraph   │  │
│  │  (Local)     │  │   Providers    │  │ Supervisor  │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│              Neon PostgreSQL Services                    │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │  NeonClient  │  │SessionManager  │  │VectorManager│  │
│  │(Conversations)│  │  (JSONB State) │  │  (pgvector) │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

[... rest of the existing content remains the same ...]

## 🎯 TDD (Test-Driven Development) Success

### Current TDD Status
**42/42 tests passing** - 100% success rate!

We've followed strict TDD principles:
1. ❌ RED - Write failing tests first
2. ✅ GREEN - Write minimal code to pass
3. 🔧 REFACTOR - Ready for optimization

### Latest TDD Achievements (August 1, 2025)

#### Tool System Implementation ✅
- **EmailTool**: 4 tests - validation, SMTP integration, error handling
- **DatabaseTool**: 1 test - key-value storage
- **Calculator**: Integrated as simple tool (no external dependencies)

#### Neon PostgreSQL Migration ✅ 
- **NeonClient**: 8 tests - conversations, interactions, batch ops
- **SessionManager**: 10 tests - JSONB sessions, TTL, user preferences
- **VectorManager**: 10 tests - pgvector embeddings, similarity search

#### API Integration ✅
- **FastAPI Endpoints**: 14 tests - all endpoints, error handling, CORS
- **Integration Tests**: Complete end-to-end testing

#### Code Quality Standards (Full TDD Cycle) ✅
- **RED Phase**: Identified 90 flake8 + 21 mypy errors
- **GREEN Phase**: Fixed all issues - 0 type errors, 1 acceptable warning
- **REFACTOR Phase**: Integrated into CI/CD, pre-commit hooks, Makefile
- **CI/CD**: GitHub Actions workflow for automated quality checks
- **Developer Tools**: Makefile commands for easy quality verification

### TDD Infrastructure
- **Testing**: pytest + Jest with full type safety
- **Linting**: flake8 (Python) + ESLint (TypeScript)
- **Type Checking**: mypy (strict mode) + TypeScript
- **Formatting**: Black + Prettier
- **Pre-commit**: Automated hooks prevent bad commits
- **CI/CD**: Every push verified automatically

## 🚀 Production-Ready Neon Configuration

### Connection Pooling Best Practices
Based on Neon's production guidelines and Context7 patterns:

```python
# Connection Pool Configuration
import asyncpg
import os

async def create_neon_pool():
    """Create optimized connection pool for production"""
    return await asyncpg.create_pool(
        os.getenv('DATABASE_URL'),
        min_size=1,           # Minimum connections
        max_size=10,          # Maximum connections  
        command_timeout=60,   # Query timeout
        server_settings={
            'application_name': 'robot-brain',
        }
    )

# Usage with proper resource management
async with pool.acquire() as conn:
    result = await conn.fetchval('SELECT NOW();')
```

### Environment Configuration
```bash
# Production .env setup
DATABASE_URL="postgresql://user:pass@ep-example-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require&connect_timeout=10"
NEON_API_KEY="napi_your_api_key_here"
NEON_PROJECT_ID="your-project-id"
```

### Error Handling Patterns
```python
# Robust error handling for Neon connections
async def safe_db_operation(pool, query, *args):
    """Execute database operations with proper error handling"""
    try:
        async with pool.acquire() as conn:
            return await conn.fetchval(query, *args)
    except asyncpg.exceptions.ConnectionDoesNotExistError:
        # Handle compute scale-to-zero
        await asyncio.sleep(2)  # Wait for compute to wake
        async with pool.acquire() as conn:
            return await conn.fetchval(query, *args)
    except asyncpg.exceptions.InterfaceError as e:
        logger.error(f"Database interface error: {e}")
        raise
```

[... rest of the existing content remains the same ...]