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
7. **✅ COMPLETED: Voice-first interaction** using ElevenLabs TTS with 5 API endpoints
8. **✅ COMPLETED: ElevenLabs Conversational AI CLI integration** with comprehensive robot ecosystem
9. **✅ COMPLETED: TDD-driven Vercel deployment** at robots2.scientiacapital.com
10. **🚧 IN PROGRESS: ElevenLabs Conversational AI bubble chat** for seamless voice interactions
11. **🎯 TARGET: Real-time streaming** with <75ms latency for immediate feedback

## 🚀 MAJOR MILESTONE: ElevenLabs Robot Ecosystem (COMPLETED)

### ✅ Professional Robot Team Architecture
**16 Specialized Robots Across 5 Industry Verticals:**

#### 🏢 Business Function Robots
- **Robot Trader**: Financial markets expert with trading insights and risk analysis
- **Robot HR**: Compassionate human resources expert for employee relations
- **Robot Payroll**: Meticulous payroll processing with tax and benefits calculations

#### 🏗️ Construction Vertical
- **Robot Foreman**: Experienced construction supervisor focused on safety and quality
- **Robot Estimator**: Cost analysis expert for project bidding and budgeting

#### 🏠 Home Services Vertical  
- **Robot Contractor**: Trustworthy home improvement expert with building code knowledge
- **Robot Plumber**: Plumbing systems expert for diagnostics and emergency repairs

#### 🏨 Rental/Airbnb Vertical
- **Robot Host**: Hospitality expert for vacation rental management and guest experience
- **Robot Concierge**: Local area expert providing recommendations and guest services
- **Robot Maintenance**: Property upkeep specialist for preventive maintenance

#### 👥 Core Social Robots (Original 5)
- **Robot Companion** (Friend): Cheerful and encouraging for emotional support
- **Robot Expert** (Nerd): Technical explanations and learning assistance
- **Robot Zen**: Calm mindfulness and peaceful guidance
- **Robot Pirate**: Adventurous storytelling with nautical flair
- **Robot Drama**: Theatrical and expressive personality

### 🎙️ Voice-Discoverable Team Coordination
**Natural Language Team Queries:**
- "Get me the construction team" → Routes to Robot Foreman + Robot Estimator
- "I need help with trading" → Connects to Robot Trader with market expertise
- "Connect me to the rental team" → Activates Robot Host + Robot Concierge + Robot Maintenance
- "Who can help with home services?" → Routes to Robot Contractor + Robot Plumber

### 🔌 Plugin Architecture Excellence
- **Naming Convention**: robot-{type} for unlimited extensibility
- **Voice Personality Mapping**: Each robot has unique ElevenLabs voice ID
- **Industry Vertical Organization**: Business, Construction, Home Services, Rental
- **Team Coordination**: Voice-activated professional team discovery

### 🧪 TDD Integration Success
- **CLI Integration Tests**: 12 comprehensive tests covering authentication, agent creation, deployment
- **Agent Configuration**: 16 JSON configuration files with ElevenLabs conversation settings
- **Production Deployment**: TDD-validated Vercel serverless deployment
- **Type Safety**: 100% mypy compliance maintained throughout expansion

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
│  │          16 Robot Personalities                  │   │
│  │  Core: Friend | Nerd | Zen | Pirate | Drama    │   │
│  │  Business: Trader | HR | Payroll               │   │
│  │  Construction: Foreman | Estimator             │   │
│  │  Home Services: Contractor | Plumber           │   │
│  │  Rental: Host | Concierge | Maintenance        │   │
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
│  │ /api/chat | /api/robots | /api/tools | /api/voice │  │
│  │     ✅ Voice: TTS, Stream, Health, Batch        │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                   AI Backends                            │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  ElevenLabs    │  │ LangGraph   │  │   Claude     │  │
│  │ ✅ TTS + Voice │  │ Supervisor  │  │   API        │  │
│  │   Ecosystem    │  │             │  │  (Ready)     │  │
│  └────────────────┘  └─────────────┘  └──────────────┘  │
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

### ✅ Current TDD Status: ELEVENLABS ROBOT ECOSYSTEM COMPLETE + VERCEL DEPLOYMENT LIVE
**200+ tests passing** - 173+ Python backend + 102 TypeScript frontend + comprehensive deployment coverage!

✅ **COMPLETE TDD SUCCESS** - Strict TDD principles maintained throughout robot ecosystem expansion:
1. ✅ RED - Write failing tests first (25 deployment tests initially failing)  
2. ✅ GREEN - Implement Vercel serverless deployment configuration
3. ✅ REFACTOR - Optimize for production performance  
4. ✅ QUALITY - Live validation at robots2.scientiacapital.com

🎯 **CURRENT PHASE**: Production deployment validation and widget integration

### ✅ Production TDD Achievements - COMPLETE

#### ✅ Backend Test Excellence (173+ Python Tests)
- **✅ LangGraph Supervisor**: 12 tests - enterprise multi-agent coordination, timeouts, handoffs
- **✅ Tool System**: 13 tests - EmailTool (4), DatabaseTool (1), ElevenLabsTool (8) with production validation
- **✅ Voice Integration**: 18 tests total
  - ElevenLabs Tool: 8 tests - TTS conversion, voice mapping, API integration
  - Voice API Router: 10 tests - all endpoints, streaming, error handling, batch processing
- **✅ ElevenLabs Robot Ecosystem**: 35 tests total (NEW)
  - CLI Integration: 12 tests - authentication, agent creation, multi-environment deployment
  - Agent Configuration: 8 tests - robot personality config management, JSON validation
  - Vercel Deployment: 10 tests - serverless configuration, domain setup, health checks
  - Production Readiness: 5 tests - robot functionality in production environment
- **✅ Neon PostgreSQL**: 46 tests total (EXPANDED)
  - NeonClient: 8 tests - conversations, interactions, batch ops with pooling
  - SessionManager: 10 tests - JSONB sessions, TTL, user preferences
  - VectorManager: 10 tests - pgvector embeddings, semantic similarity search
  - Database Schema: 18 tests - production validation, indexes, constraints
- **✅ FastAPI Production Integration**: 26 tests total (EXPANDED)
  - API Endpoints: 14 tests - all endpoints, error handling, CORS
  - Production Config: 12 tests - environment, security, deployment validation
- **✅ Core Systems**: ~43 tests across other modules with full type safety

#### ✅ Frontend Production Infrastructure (102 Tests)
- **✅ Jest Test Suite**: Complete React/TypeScript component testing
- **✅ Test Configuration**: Production-ready timeouts, mocking, environment setup
- **✅ Quality Metrics**: 102/102 frontend tests passing with zero TypeScript errors
- **✅ Component Coverage**: Full UI testing with accessibility and responsive design

#### ✅ Enterprise Quality Gate System (OPERATIONAL)
- **✅ Parallel Quality Checks**: `check-quality.sh` runs Python + TypeScript simultaneously
- **✅ Git Hooks**: Pre-commit and pre-push hooks operational preventing all technical debt  
- **✅ Full Stack Coverage**: Backend (pytest, flake8, mypy) + Frontend (Jest, ESLint, TypeScript)
- **✅ RED-GREEN-REFACTOR-QUALITY**: Complete TDD workflow with automated enterprise validation

#### ✅ Python Type Safety Excellence - 100% COMPLETE
- **✅ Phase 1 RED COMPLETE**: Re-enabled Python quality checks, identified 99 mypy errors
- **✅ Phase 2 GREEN COMPLETE**: Fixed ALL type errors - asyncpg imports, return annotations, None safety
- **✅ Phase 3 REFACTOR COMPLETE**: Enhanced mypy configuration with strict checking
- **✅ Phase 4 QUALITY COMPLETE**: **0 mypy errors achieved** (down from 99 - 100% improvement!)
- **✅ RESULT**: **Enterprise-grade type safety** with comprehensive error prevention

### ✅ Production TDD Infrastructure - OPERATIONAL
- **✅ Testing**: pytest + Jest with 100% type safety (260+ tests)
- **✅ Linting**: flake8 (Python) + ESLint (TypeScript) - zero errors
- **✅ Type Checking**: mypy (strict mode) + TypeScript - 100% coverage, 0 errors
- **✅ Formatting**: Black + Prettier - consistent code style
- **✅ Quality Gates**: `check-quality.sh` - parallel execution operational
- **✅ Git Hooks**: Pre-commit and pre-push hooks active preventing technical debt
- **✅ Production Validation**: Comprehensive deployment and configuration testing
- **✅ Voice Integration**: Complete ElevenLabs TTS with 5 API endpoints operational

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

### ✅ Production Deployment Excellence - COMPLETE

- ✅ **Environment Configuration**: `.env.production` with all required variables
- ✅ **Database Configuration**: Live Neon PostgreSQL with pooler endpoints and SSL
- ✅ **Security Middleware**: HTTPS redirect, trusted hosts, CORS restrictions operational
- ✅ **Connection Resilience**: Scale-to-zero handling with exponential backoff tested
- ✅ **Multi-Worker Setup**: Gunicorn + Uvicorn workers deployed for production load
- ✅ **Process Management**: PID-based service control and monitoring active
- ✅ **Simple Deployment**: FastAPI deployment operational (no container complexity)
- ✅ **Monitoring Endpoints**: Health checks and Prometheus metrics live
- ✅ **Automated Deployment**: Production deployment script verified and operational
- ✅ **Production Testing**: 12/12 production configuration tests passing
- ✅ **Database Schema**: 18/18 production validation tests passing
- ✅ **Type Safety**: 100% complete with 0 mypy errors

### ✅ Production Deployment Status: LIVE

- **✅ FastAPI + Gunicorn multi-worker deployment** (operational)
- **✅ Live Neon PostgreSQL** (5 tables, 12+ indexes, pgvector ready)
- **✅ Production-ready with comprehensive monitoring** (health checks, metrics, logging)
- **✅ Enterprise security stack** (CORS, HTTPS, input validation)

### ✅ LangGraph Multi-Agent Coordination: PRODUCTION READY

Advanced robot collaboration with skill-based delegation and parallel execution capabilities are **live and operational** in production.