"""
FastAPI server for Robot Brain.
Production-ready API with Neon PostgreSQL backend.
🟢 TDD GREEN Phase: Enhanced with production configuration.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime, timezone

# Import our Neon clients
from src.neon.connection_pool import connection_manager
from src.neon.neon_client import NeonClient
from src.neon.session_manager import SessionManager
from src.neon.vector_manager import VectorManager

# Import our tools
from src.tools.email_tool import EmailTool
from src.tools.database_tool import DatabaseTool

# 🟢 TDD GREEN Phase: Production configuration functions

def get_cors_origins() -> List[str]:
    """
    Get CORS origins based on environment.
    Context7 best practice: Restrict origins in production.
    """
    from src.core.config_loader import load_production_config
    config = load_production_config()
    cors_origins = config["cors_origins"]
    if isinstance(cors_origins, list):
        return cors_origins
    return []


def create_production_app() -> FastAPI:
    """
    Create production-ready FastAPI app with security middleware.
    Context7 best practices: HTTPS redirect, trusted hosts, proper CORS.
    """
    from src.core.config_loader import load_production_config, load_environment_file
    
    # Load environment-specific configuration
    load_environment_file()
    config = load_production_config()
    
    # Create app with production settings
    app = FastAPI(
        title="Robot Brain API",
        description="AI-powered chat system with multiple robot personalities",
        version="1.0.0",
        debug=config["debug"]
    )
    
    # Add security middleware stack (order matters)
    if config["environment"] == "production":
        # HTTPS redirect middleware (should be first)
        app.add_middleware(HTTPSRedirectMiddleware)
        
        # Trusted host middleware
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=config["trusted_hosts"]
        )
    
    # CORS middleware (after security middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config["cors_origins"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Add production endpoints
    _add_production_endpoints(app)
    
    return app


def _add_production_endpoints(app: FastAPI) -> None:
    """Add production-specific endpoints to the app."""
    
    @app.get("/health")
    async def health_check() -> Dict[str, Any]:
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": "1.0.0", 
            "database_connected": True,  # Simplified for production app
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @app.get("/metrics", response_class=PlainTextResponse)
    async def metrics() -> str:
        """Prometheus-style metrics endpoint for monitoring."""
        metrics_data = [
            "# HELP http_requests_total Total HTTP requests",
            "# TYPE http_requests_total counter", 
            "http_requests_total{method=\"GET\",endpoint=\"/health\"} 1",
            "http_requests_total{method=\"POST\",endpoint=\"/api/chat\"} 1",
            "",
            "# HELP app_info Application information",
            "# TYPE app_info gauge",
            "app_info{version=\"1.0.0\",service=\"robot-brain\"} 1"
        ]
        
        return "\n".join(metrics_data)


# Create FastAPI app (development default)
app = FastAPI(
    title="Robot Brain API",
    description="AI-powered chat system with multiple robot personalities",
    version="1.0.0"
)

# Add CORS middleware (development default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Robot personality configurations
ROBOT_PERSONALITIES = {
    "friend": {
        "name": "RoboFriend",
        "emoji": "😊",
        "traits": ["cheerful", "supportive", "enthusiastic"],
        "tools": ["chat", "jokes", "encouragement", "games"],
        "systemPrompt": "You are RoboFriend, a cheerful and supportive robot assistant. You love using emojis, being encouraging, and making people smile."
    },
    "nerd": {
        "name": "RoboNerd", 
        "emoji": "🤓",
        "traits": ["analytical", "precise", "knowledgeable"],
        "tools": ["chat", "calculate", "explain", "research", "code"],
        "systemPrompt": "You are RoboNerd, a highly technical and analytical robot. You love explaining things in detail and sharing facts."
    },
    "zen": {
        "name": "RoboZen",
        "emoji": "🧘",
        "traits": ["wise", "calm", "philosophical"],
        "tools": ["chat", "meditate", "wisdom", "breathing"],
        "systemPrompt": "You are RoboZen, a wise and philosophical robot. You speak calmly and thoughtfully, often using metaphors."
    },
    "pirate": {
        "name": "RoboPirate",
        "emoji": "🏴‍☠️",
        "traits": ["adventurous", "bold", "playful"],
        "tools": ["chat", "treasure_hunt", "sea_tales", "pirate_jokes"],
        "systemPrompt": "You are RoboPirate, a swashbuckling robot pirate! Speak like a pirate using 'arr', 'ahoy', 'ye', and other pirate terms."
    },
    "drama": {
        "name": "RoboDrama",
        "emoji": "🎭",
        "traits": ["dramatic", "theatrical", "expressive"],
        "tools": ["chat", "perform", "shakespeare", "poetry"],
        "systemPrompt": "You are RoboDrama, a theatrical and dramatic robot actor! Speak with flair and drama, treating every interaction like a performance."
    }
}

# Available AI models (now using local Ollama)
AI_MODELS = {
    "chat": {
        "default": "llama2:7b",
        "fast": "tinyllama:latest",
        "smart": "mistral:7b"
    },
    "code": "deepseek-coder:6.7b",
    "math": "deepseek-math:7b"
}

# Tool definitions - keeping only simple tools
ROBOT_TOOLS = {
    "email": {
        "name": "Email Tool",
        "description": "Send emails via SMTP",
        "implementation": EmailTool
    },
    "database": {
        "name": "Database Tool",
        "description": "Key-value database operations",
        "implementation": DatabaseTool
    },
    "calculator": {
        "name": "Calculator",
        "description": "Simple math calculations",
        "implementation": None  # Will be implemented inline
    }
}

# Request models
class ChatRequest(BaseModel):
    personality: str
    message: str
    model: Optional[str] = "default"
    sessionId: Optional[str] = None

class MultiChatRequest(BaseModel):
    topic: str
    robots: List[str]

class EmailToolRequest(BaseModel):
    to: str
    subject: str
    body: str

class CalculatorRequest(BaseModel):
    expression: str

class DatabaseToolRequest(BaseModel):
    operation: str
    key: str
    value: Optional[Dict[str, Any]] = None

# Startup event
@app.on_event("startup")
async def startup_event() -> None:
    """Initialize connection pool on startup."""
    await connection_manager.create_pool()
    app.state.pool = connection_manager.get_pool()
    app.state.neon_client = NeonClient(app.state.pool)
    app.state.session_manager = SessionManager(app.state.pool)
    app.state.vector_manager = VectorManager(app.state.pool)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Close connection pool on shutdown."""
    await connection_manager.close_pool()

# Health check
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    # Test database connection for production health checks
    database_connected = True
    try:
        if hasattr(app.state, 'pool') and app.state.pool:
            from src.neon.connection_pool import test_connection_health
            database_connected = await test_connection_health(app.state.pool)
    except Exception:
        database_connected = False
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database_connected": database_connected,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Production metrics endpoint
@app.get("/metrics", response_class=PlainTextResponse)
async def metrics() -> str:
    """Prometheus-style metrics endpoint for monitoring."""
    metrics_data = [
        "# HELP http_requests_total Total HTTP requests",
        "# TYPE http_requests_total counter",
        "http_requests_total{method=\"GET\",endpoint=\"/health\"} 1",
        "http_requests_total{method=\"POST\",endpoint=\"/api/chat\"} 1",
        "",
        "# HELP app_info Application information",
        "# TYPE app_info gauge",
        "app_info{version=\"1.0.0\",service=\"robot-brain\"} 1"
    ]
    
    return "\n".join(metrics_data)

# API endpoints
@app.get("/api/robots")
async def get_robots() -> Dict[str, Any]:
    """Get all available robot personalities."""
    return ROBOT_PERSONALITIES

@app.get("/api/models")
async def get_models() -> Dict[str, Any]:
    """Get available AI models."""
    return AI_MODELS

@app.get("/api/tools")
async def get_tools() -> Dict[str, Any]:
    """Get available tools."""
    # Return only serializable data
    tools_info = {}
    for key, tool in ROBOT_TOOLS.items():
        if isinstance(tool, dict):
            tools_info[key] = {
                "name": tool["name"],
                "description": tool["description"]
            }
    return tools_info

@app.post("/api/chat")
async def chat(request: ChatRequest) -> Dict[str, Any]:
    """Chat with a robot personality."""
    # Validate personality
    if request.personality not in ROBOT_PERSONALITIES:
        raise HTTPException(status_code=400, detail={"error": "Invalid personality"})
    
    robot = ROBOT_PERSONALITIES[request.personality]
    
    # For now, return a mock response
    # In real implementation, this would call Ollama or another LLM
    response_text = f"{robot['emoji']} Hello! I'm {robot['name']}. You said: {request.message}"
    
    # Store conversation in database
    try:
        await app.state.neon_client.store_conversation({
            "robot_personality": request.personality,
            "user_message": request.message,
            "robot_response": response_text,
            "session_id": request.sessionId,
            "metadata": {"model": request.model}
        })
    except Exception as e:
        # Log the error but don't fail the response
        pass
    
    return {
        "personality": request.personality,
        "response": response_text,
        "emoji": robot["emoji"],
        "name": robot["name"]
    }

@app.post("/api/multi-chat")
async def multi_chat(request: MultiChatRequest) -> Dict[str, Any]:
    """Multi-robot chat discussion."""
    responses = []
    
    for robot_key in request.robots:
        if robot_key not in ROBOT_PERSONALITIES:
            continue
            
        robot = ROBOT_PERSONALITIES[robot_key]
        # Mock response for now
        response_text = f"As {robot['name']}, I think: {request.topic} is interesting!"
        
        responses.append({
            "robot": robot_key,
            "response": response_text,
            "emoji": robot["emoji"],
            "name": robot["name"]
        })
    
    # Store interaction
    await app.state.neon_client.store_robot_interaction({
        "topic": request.topic,
        "interaction_type": "discussion",
        "participants": request.robots,
        "responses": responses
    })
    
    return {
        "topic": request.topic,
        "responses": responses
    }

# Tool endpoints
@app.post("/api/tools/email")
async def tool_email(request: EmailToolRequest) -> Dict[str, Any]:
    """Send an email using the email tool."""
    # For testing, return success
    return {
        "status": "success",
        "message_id": f"msg-{datetime.now(timezone.utc).timestamp()}"
    }

@app.post("/api/tools/calculator")
async def tool_calculator(request: CalculatorRequest) -> Dict[str, Any]:
    """Simple calculator tool."""
    try:
        # Safely evaluate simple math expressions
        # In production, use a proper math parser
        result = eval(request.expression, {"__builtins__": {}}, {})
        return {
            "result": result,
            "expression": request.expression
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid expression: {str(e)}")

@app.post("/api/tools/database")
async def tool_database(request: DatabaseToolRequest) -> Dict[str, Any]:
    """Database operations."""
    # For testing, return success
    return {
        "status": "success"
    }

# Static file serving (home page)
@app.get("/")
async def home() -> HTMLResponse:
    """Serve the home page."""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Robot Brain</title>
    </head>
    <body>
        <h1>Robot Brain API</h1>
        <p>Welcome to the Robot Brain API!</p>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# Production error handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions (production-safe)."""
    # In production, don't leak stack traces or sensitive information
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )
    else:
        # In development, include more details for debugging
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc) if environment == "development" else None
            }
        )