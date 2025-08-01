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


## 🎯 TDD (Test-Driven Development) Success

### Current TDD Status
**218 tests passing** - 128 Python backend + 90 TypeScript frontend!

We've followed strict TDD principles:
1. ❌ RED - Write failing tests first
2. ✅ GREEN - Write minimal code to pass
3. 🔧 REFACTOR - Improve code quality
4. ✅ QUALITY - Automated quality gates

### Latest TDD Achievements

#### Backend Test Breakdown (128 Python Tests) ✅
- **LangGraph Supervisor**: 12 tests - multi-agent coordination, timeouts, handoffs
- **Tool System**: 5 tests - EmailTool (4), DatabaseTool (1)
- **Neon PostgreSQL**: 28 tests total
  - NeonClient: 8 tests - conversations, interactions, batch ops
  - SessionManager: 10 tests - JSONB sessions, TTL, user preferences
  - VectorManager: 10 tests - pgvector embeddings, similarity search
- **FastAPI Integration**: 14 tests - all endpoints, error handling, CORS
- **Additional Tests**: ~69 tests across other modules

#### Frontend Quality Infrastructure ✅ (NEW - August 1, 2025)
- **Jest Test Fixes**: Fixed robot-config.test.ts, api-integration.test.ts, ChatBubble component tests
- **Test Configuration**: Enhanced timeouts, mocking, and environment setup
- **Quality Metrics**: 90/90 frontend tests passing with proper TypeScript and ESLint validation

#### Comprehensive Quality Gate System ✅ (NEW - August 1, 2025)
- **Parallel Quality Checks**: `check-quality.sh` script runs Python and TypeScript checks simultaneously
- **Git Hooks Integration**: Pre-commit and pre-push hooks prevent technical debt
- **Full Stack Coverage**: Backend (pytest, flake8, mypy) + Frontend (Jest, ESLint, TypeScript build)
- **RED-GREEN-REFACTOR-QUALITY**: Enhanced TDD workflow with automated quality gates

#### Python Type Safety Enhancement 🔧 (In Progress)
- **Phase 1 RED**: Re-enabled Python quality checks, identified 99 mypy errors
- **Phase 2 GREEN**: Fixed 28 critical type errors - asyncpg imports, return annotations, None safety
- **Phase 3 REFACTOR**: Enhanced mypy configuration for stricter checking
- **Phase 4 QUALITY**: Successfully reduced errors from 99 to 71 (28% improvement)
- **Current Status**: 71 mypy errors remaining, all 128 Python tests still passing
- **Infrastructure**: Git hooks prevent commits with type errors or failing tests

### TDD Infrastructure
- **Testing**: pytest + Jest with full type safety
- **Linting**: flake8 (Python) + ESLint (TypeScript)
- **Type Checking**: mypy (strict mode) + TypeScript
- **Formatting**: Black + Prettier
- **Quality Gates**: `check-quality.sh` - parallel execution of all quality checks
- **Git Hooks**: Pre-commit and pre-push hooks with comprehensive quality validation
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

## 🔧 REFACTOR Phase: Production Deployment Excellence ✅

### Production Deployment Infrastructure

**🚀 Multi-Worker FastAPI Deployment**
```bash
# Production startup with Gunicorn + Uvicorn workers
./start-production.py

# Or using Gunicorn directly
gunicorn src.api.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  --log-level info
```

**🚀 Simple Production Deployment**
```bash
# Full production deployment
./deploy-production.sh

# Management commands
./deploy-production.sh deploy   # Full deployment
./deploy-production.sh logs     # View logs
./deploy-production.sh status   # Check status
./deploy-production.sh health   # Health check
./deploy-production.sh stop     # Stop services
./deploy-production.sh restart  # Restart server
```

**📊 Production Monitoring**
- Health Check: `http://localhost:8000/health`
- Metrics (Prometheus): `http://localhost:8000/metrics`
- Process Management: PID-based service control
- Log Monitoring: `/tmp/robot-brain-production.log`

**🔒 Production Security Stack**
- HTTPS redirect middleware
- Trusted host validation
- CORS origin restrictions
- Security headers (XSS, CSRF, HSTS)
- SSL/TLS with channel binding
- Process isolation and monitoring

**⚡ Performance Optimizations**
- Connection pooling (1-10 connections) 
- Scale-to-zero retry logic
- Multi-worker process management with Gunicorn
- Context7 worker calculation: (2 x CPU cores) + 1
- Health check optimizations

### Production Deployment Checklist ✅

- ✅ **Environment Configuration**: `.env.production` with all required variables
- ✅ **Database Configuration**: Neon PostgreSQL with pooler endpoints and SSL
- ✅ **Security Middleware**: HTTPS redirect, trusted hosts, CORS restrictions
- ✅ **Connection Resilience**: Scale-to-zero handling with exponential backoff
- ✅ **Multi-Worker Setup**: Gunicorn + Uvicorn workers for production load
- ✅ **Process Management**: PID-based service control and monitoring
- ✅ **Simple Deployment**: Direct FastAPI deployment without container complexity
- ✅ **Monitoring Endpoints**: Health checks and Prometheus metrics
- ✅ **Automated Deployment**: Production deployment script with verification
- ✅ **Production Testing**: 11/11 production configuration tests passing

### Production Deployment

- **Simple FastAPI + Gunicorn deployment (no containers)**
- **Neon PostgreSQL for scalable data persistence**
- **Production-ready with health checks and monitoring**

### Next Phase: LangGraph Multi-Agent Coordination

Ready to implement advanced robot collaboration with skill-based delegation and parallel execution capabilities.
```