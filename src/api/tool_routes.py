"""
FastAPI routes for tool endpoints.
Provides HTTP API access to EmailTool, WebScrapingTool, and DatabaseTool.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Union
import os

# Import our tools
from src.tools.email_tool import EmailTool
from src.tools.web_scraping_tool import WebScrapingTool
from src.tools.database_tool import DatabaseTool

# Create router
router = APIRouter(prefix="/api/tools", tags=["tools"])

# Initialize tools (in production, use dependency injection)
email_tool = EmailTool(
    smtp_host=os.getenv("SMTP_HOST", "localhost"),
    smtp_port=int(os.getenv("SMTP_PORT", "1025")),
    from_address=os.getenv("EMAIL_FROM", "robots@robot-brain.test")
)

web_scraping_tool = WebScrapingTool()

database_tool = DatabaseTool(
    redis_host=os.getenv("REDIS_HOST", "localhost"),
    redis_port=int(os.getenv("REDIS_PORT", "6379"))
)


# Request/Response models
class EmailRequest(BaseModel):
    to: Union[str, List[str]] = Field(..., description="Recipient email address(es)")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")
    cc: Optional[Union[str, List[str]]] = Field(None, description="CC recipients")
    bcc: Optional[Union[str, List[str]]] = Field(None, description="BCC recipients")


class WebScrapingRequest(BaseModel):
    url: str = Field(..., description="URL to scrape")
    selector: Optional[str] = Field(None, description="CSS selector for content extraction")


class DatabaseRequest(BaseModel):
    operation: str = Field(..., description="Operation: store, get, or delete")
    key: str = Field(..., description="Database key")
    value: Optional[Any] = Field(None, description="Value to store (for store operation)")


class ToolResponse(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# Email endpoint
@router.post("/email", response_model=ToolResponse)
async def send_email(request: EmailRequest) -> Dict[str, Any]:
    """Send an email using the EmailTool."""
    try:
        result = await email_tool.execute(
            to=request.to,
            subject=request.subject,
            body=request.body,
            cc=request.cc,
            bcc=request.bcc
        )
        
        return ToolResponse(
            status=result.get("status", "unknown"),
            data=result,
            error=result.get("error") if result.get("status") == "error" else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Web scraping endpoint
@router.post("/scrape", response_model=ToolResponse)
async def scrape_website(request: WebScrapingRequest) -> Dict[str, Any]:
    """Scrape a website using the WebScrapingTool."""
    try:
        result = await web_scraping_tool.execute(
            url=request.url,
            selector=request.selector
        )
        
        return ToolResponse(
            status=result.get("status", "unknown"),
            data=result,
            error=result.get("error") if result.get("status") == "error" else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Database endpoints
@router.post("/database", response_model=ToolResponse)
async def database_operation(request: DatabaseRequest) -> Dict[str, Any]:
    """Perform a database operation using the DatabaseTool."""
    try:
        # Validate operation
        if request.operation not in ["store", "get", "delete"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid operation. Must be 'store', 'get', or 'delete'"
            )
        
        # Build kwargs for tool execution
        kwargs = {
            "operation": request.operation,
            "key": request.key
        }
        
        if request.operation == "store":
            if request.value is None:
                raise HTTPException(
                    status_code=400,
                    detail="Value is required for store operation"
                )
            kwargs["value"] = request.value
        
        result = await database_tool.execute(**kwargs)
        
        return ToolResponse(
            status=result.get("status", "unknown"),
            data=result,
            error=result.get("error") if result.get("status") == "error" else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# List available tools
@router.get("/", response_model=Dict[str, Any])
async def list_tools() -> Dict[str, List[Dict[str, str]]]:
    """List all available tools and their capabilities."""
    return {
        "tools": {
            "email": {
                "description": "Send emails via SMTP",
                "endpoint": "/api/tools/email",
                "method": "POST",
                "parameters": {
                    "to": "string or array (required)",
                    "subject": "string (required)",
                    "body": "string (required)",
                    "cc": "string or array (optional)",
                    "bcc": "string or array (optional)"
                }
            },
            "scrape": {
                "description": "Scrape content from websites",
                "endpoint": "/api/tools/scrape",
                "method": "POST",
                "parameters": {
                    "url": "string (required)",
                    "selector": "string (optional)"
                }
            },
            "database": {
                "description": "Store and retrieve data from Redis",
                "endpoint": "/api/tools/database",
                "method": "POST",
                "parameters": {
                    "operation": "string - store|get|delete (required)",
                    "key": "string (required)",
                    "value": "any (required for store)"
                }
            }
        }
    }


# Health check for tools
@router.get("/health")
async def tools_health() -> Dict[str, Any]:
    """Check health status of all tools."""
    health_status = {
        "email": {
            "available": True,
            "config": {
                "smtp_host": email_tool.smtp_host,
                "smtp_port": email_tool.smtp_port,
                "from_address": email_tool.from_address
            }
        },
        "scraping": {
            "available": True
        },
        "database": {
            "available": True,
            "config": {
                "redis_host": database_tool.redis_host,
                "redis_port": database_tool.redis_port
            }
        }
    }
    
    # Try to ping Redis
    try:
        client = database_tool._get_client()
        client.ping()
        health_status["database"]["connected"] = True
    except Exception as e:
        health_status["database"]["connected"] = False
        health_status["database"]["error"] = str(e)
    
    return health_status