# Project Context Engineering - Robot Brain

## 🎯 System Design Philosophy

### Core Principles
1. **Modularity**: Each component (personality, tool, model) is independently configurable
2. **Extensibility**: Easy to add new robots, tools, or AI backends
3. **Cloud-Native**: Built for scalable deployment on Neon PostgreSQL
4. **Progressive Enhancement**: Basic features work everywhere, advanced features when available
5. **Developer Experience**: Clear debugging, easy configuration, helpful error messages

## 🏗️ Technical Architecture

### Component Hierarchy
```
Robot Brain System
├── Core Abstraction Layer ✅
│   ├── BaseAgent abstract class
│   ├── BaseTool abstract class
│   ├── ToolRegistry system
│   └── Tool validation framework
├── Tool System Layer ✅
│   ├── EmailTool (SMTP integration)
│   ├── DatabaseTool (key-value storage)
│   └── Calculator (simple math operations)
├── Neon PostgreSQL Integration Layer ✅
│   ├── NeonClient (conversations, interactions)
│   ├── SessionManager (JSONB sessions, state management)
│   ├── VectorManager (pgvector embeddings, RAG)
│   └── Connection Pool (asyncpg connection management)
├── Orchestration Layer
│   ├── LangGraph Supervisor
│   ├── Multi-agent coordination
│   ├── Parallel execution
│   └── Timeout handling
├── Personality Layer
│   ├── Base RobotPersonality class
│   ├── 5 Personality implementations
│   └── Personality-specific prompts
├── AI Backend Layer
│   ├── Ollama integration (local)
│   ├── Future AI providers
│   └── Model selection logic
└── Interface Layer
    ├── FastAPI endpoints ✅
    ├── Tool API endpoints (/api/tools/*) ✅
    ├── WebSocket support (planned)
    ├── Web UI (HTML/JS)
    ├── React UI (Next.js/TypeScript)
    └── CLI tools
```

### Data Flow
```
User Input → Interface Layer → Personality Selection → Tool Execution → AI Backend → Response Processing → User Output
```

## 🔧 Technical Components

### 1. Robot Personality System

**Base Class Structure**:
```python
class RobotPersonality:
    - name: str
    - emoji: str
    - traits: List[str]
    - model: str
    - tools: List[str]
    - system_prompt: str
    - vocabulary: Dict[str, List[str]]
```

**Personality Inheritance**:
- Each personality extends base class
- Overrides: `get_greeting()`, `process_response()`
- Custom response processing per personality

### 2. Tool System Implementation ✅

**BaseTool Structure**:
```python
class BaseTool(ABC):
    - name: str
    - description: str
    - parameters: Dict[str, ToolParameter]
    
    @abstractmethod
    async def _execute_impl(**kwargs) -> Dict[str, Any]
    
    def validate_parameters(**kwargs) -> None
    async def execute(**kwargs) -> Dict[str, Any]
```

**Implemented Tools**:
- **EmailTool**: SMTP email sending with validation
- **DatabaseTool**: Key-value storage operations
- **Calculator**: Simple math calculations (no external dependencies)

### 3. Neon PostgreSQL Integration ✅

**NeonClient**:
- Store/retrieve conversations
- Query by robot personality
- Track tool usage
- Batch operations
- Full SQL capabilities

**SessionManager**:
- JSONB-based session storage
- TTL support for expiration
- Robot state persistence
- User preferences storage

**VectorManager**:
- pgvector for embeddings
- Vector similarity search
- RAG context retrieval
- Mock embedding generation

### 3. Tool System Architecture

**Tool Registry**:
```python
class ToolRegistry:
    @classmethod
    def register(name: str, tool: BaseTool) -> None
    def get(name: str) -> Optional[BaseTool]
    def exists(name: str) -> bool
    def list_tools() -> List[str]
```

**Implemented Tools**:
- **EmailTool**: Send emails via SMTP (4 tests)
- **DatabaseTool**: Key-value storage (1 test)
- **Calculator**: Math operations (integrated)

**Neon PostgreSQL Services**:
- **NeonClient**: Conversation storage (8 tests)
- **SessionManager**: JSONB state management (10 tests)
- **VectorManager**: pgvector implementation (10 tests)
- **LangGraph Supervisor**: Multi-agent coordination (12 tests)
- **FastAPI Integration**: Complete API layer (14 tests)

**Total Backend Tests**: 128 Python tests passing

### 3. AI Model Management

**Model Selection Strategy**:
```
1. Check if custom model specified in request
2. Use robot's default model
3. Fallback to base model if unavailable
4. Return cached/static response if all fail
```

**Available Models**:
- **Ollama** (Local):
  - codestral (coding)
  - minicpm:3b-v2.5 (efficient)
  - qwen2.5:14b (analytical)
  - internlm2:7b (general)

- **Future AI Providers**:
  - Support for various cloud AI services
  - Flexible model selection
  - Easy integration of new providers

### 4. API Design

**RESTful Endpoints**:
```
GET  /                     # Web UI
GET  /api/robots           # List all robots
GET  /api/models           # List available models
GET  /api/tools            # List available tools
POST /api/chat             # Send message to robot
GET  /health               # Health check

# Tool Endpoints ✅
POST /api/tools/email      # Send email
POST /api/tools/scrape     # Scrape website
POST /api/tools/database   # Database operations
```

**Request/Response Schema**:
```typescript
// Chat Request
{
  personality: string,
  message: string,
  model?: string,
  tools?: string[]
}

// Chat Response
{
  personality: string,
  response: string,
  emoji: string,
  name: string,
  model: string,
  tools: string[]
}
```

**TypeScript Types** (robot-brain-ui):
```typescript
export type RobotId = keyof typeof ROBOT_PERSONALITIES;
export type ToolId = keyof typeof ROBOT_TOOLS;

// Type-safe robot personality access
const robot = ROBOT_PERSONALITIES[robotId];

// Type-safe tool checking
const robotHasTool = (robot, toolId) => robot?.tools.includes(toolId)
```

### 5. Deployment Architecture

**Neon PostgreSQL Deployment**:
```
┌─────────────────┐
│  FastAPI Server │ Port 8000
└────────┬────────┘
         │
┌────────▼────────┐
│  Connection Pool│
│    (asyncpg)    │
└────────┬────────┘
         │
┌────────▼────────┐
│ Neon PostgreSQL │
│  - Conversations│
│  - Sessions     │
│  - Vectors      │
└─────────────────┘
```

### 6. Production Configuration Patterns

**Connection Pool Management**:
```python
# Production-ready connection configuration
from src.neon.connection_pool import ConnectionManager

class NeonConnectionManager:
    def __init__(self):
        self.pool_config = {
            'min_size': 1,
            'max_size': 10,
            'command_timeout': 60,
            'server_settings': {
                'application_name': 'robot-brain-prod'
            }
        }
    
    async def create_optimized_pool(self):
        # Pooled connection string for high concurrency
        connection_string = os.getenv('DATABASE_URL')  # Contains -pooler
        return await asyncpg.create_pool(connection_string, **self.pool_config)
```

**Environment-Specific Deployment**:
```bash
# Development
DATABASE_URL="postgresql://user:pass@endpoint.region.aws.neon.tech/db"

# Production (with pooler for high concurrency)
DATABASE_URL="postgresql://user:pass@endpoint-pooler.region.aws.neon.tech/db?sslmode=require&connect_timeout=10"
```

**Scale-to-Zero Handling**:
```python
async def handle_compute_wakeup(func):
    """Decorator to handle Neon compute scale-to-zero scenarios"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except (ConnectionDoesNotExistError, InterfaceError):
            # Wait for compute to wake up, then retry
            await asyncio.sleep(2)
            return await func(*args, **kwargs)
    return wrapper
```

## 🔐 Security Considerations

### Input Validation
- Sanitize user messages
- Validate personality selection
- Check tool permissions
- Rate limiting on API endpoints

### Model Safety
- System prompts enforce helpful behavior
- Response filtering for inappropriate content
- Token limits prevent abuse
- No execution of generated code

### Deployment Security
- CORS properly configured
- No sensitive data in responses
- Environment variables for secrets
- Secure WebSocket connections

## 🚀 Performance Optimization

### Caching Strategy
- Model responses cached for common queries
- Static assets cached with long TTL
- Robot configurations loaded once

### Resource Management
- Lazy loading of models
- Connection pooling for Ollama
- Efficient message queuing
- WebSocket connection reuse

### Scalability
- Stateless API design
- Horizontal scaling ready
- Edge deployment for global reach
- CDN for static assets

## 🔄 Integration Points

### External Services
1. **Ollama API**
   - HTTP REST interface
   - Streaming support
   - Model management

2. **Neon PostgreSQL**
   - Serverless PostgreSQL
   - Auto-scaling compute
   - pgvector extension
   - JSONB for flexible storage

3. **LangGraph Supervisor**
   - Multi-agent orchestration with skill-based delegation
   - Robust timeout handling (per-agent and overall)
   - Parallel execution support
   - Agent handoff capabilities
   - Context preservation across queries

4. **Neon Services** ✅ IMPLEMENTED
   - PostgreSQL for conversation storage
   - JSONB for session management
   - pgvector for RAG implementation
   - Mock embeddings for MVP

5. **Future Integrations** (Using TDD)
   - Anthropic Claude API (Test interface before integration)
   - Google Gemini/Vertex AI (TDD from the start)
   - Custom model endpoints (Test-driven approach)

### Extension Mechanisms
1. **Plugin System** (planned)
   - Drop-in tool modules
   - Custom personality packs
   - Model adapters

2. **Webhook Support** (planned)
   - Event notifications
   - Custom integrations
   - Audit logging

## 📊 Monitoring & Debugging

### Logging Strategy
```
INFO:  API requests, model selections
DEBUG: Full prompts, responses
ERROR: Connection failures, model errors
```

### Metrics to Track
- Response times per model
- Token usage per robot
- Popular tools/features
- Error rates by type

### Debug Tools
- Developer mode in UI
- Request/response logging
- Model comparison mode
- Performance profiler

## 🏭 Build & Deployment Pipeline

### Local Development
```bash
# Python Backend
pip install -r requirements.txt
pytest tests/
python -m uvicorn src.api.main:app --reload

# React Frontend
cd robot-brain-ui
npm install
npm run dev
npm test
npx tsc --noEmit  # TypeScript check
npm run lint      # ESLint check
```

### Production Deployment
```bash
# Deploy FastAPI to production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.api.main:app

# Build React app
cd robot-brain-ui
npm run build

# Health check
curl https://your-api-domain.com/health
```

### Code Quality Gates ✅ ENHANCED (August 1, 2025)
- **TypeScript**: 0 errors policy ✅
- **ESLint**: 0 warnings/errors policy ✅
- **Backend Tests**: 128/128 Python tests passing ✅
- **Frontend Tests**: 90/90 TypeScript tests passing ✅
- **Total Tests**: 218 tests across full stack ✅
- **TDD**: Strict Red-Green-Refactor-Quality cycle ✅
- **Type Safety**: Python mypy errors reduced from 99 to 71 🔧
- **Test Coverage**: Comprehensive coverage across all modules ✅
- **Quality Gates**: `check-quality.sh` parallel execution ✅ (NEW)
- **Git Hooks**: Pre-commit and pre-push quality validation ✅ (NEW)

## 🔮 Future Architecture Considerations

### Planned Enhancements
1. **Conversation Memory**
   - Redis for session storage
   - Context window management
   - User preference learning

2. **Multi-Modal Support**
   - Voice input/output
   - Image understanding
   - Video generation

3. **Collaborative Robots**
   - Inter-robot communication protocol
   - Shared task execution
   - Consensus mechanisms

4. **Advanced Tools**
   - External API integrations
   - File processing
   - Real-time data analysis

### Scaling Considerations
- Database for conversation history
- Message queue for async processing
- Load balancer for multiple instances
- Geographic distribution

---
*This document provides the technical foundation for understanding and extending the Robot Brain system.*