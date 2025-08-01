"""
DatabaseTool implementation for Redis operations.
Following TDD - minimal implementation.
"""

import asyncio
import redis
import json
from typing import Dict, Any, Optional

from src.core.base_tool import BaseTool, ToolParameter


class DatabaseTool(BaseTool):
    """Tool for database operations using Redis."""
    
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        """Initialize DatabaseTool."""
        super().__init__(
            name="database",
            description="Store and retrieve data from Redis",
            parameters={
                "operation": ToolParameter(
                    type="string",
                    description="Operation to perform: store, get, delete",
                    required=True
                ),
                "key": ToolParameter(
                    type="string",
                    description="Database key",
                    required=True
                ),
                "value": ToolParameter(
                    type="string",
                    description="Value to store (for store operation)",
                    required=False
                )
            }
        )
        
        self.redis_host = redis_host
        self.redis_port = redis_port
        self._client = None
    
    def _get_client(self) -> Any:
        """Get or create Redis client."""
        if not self._client:
            self._client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=False
            )
        return self._client
    
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute database operation."""
        operation = kwargs.get("operation")
        key = kwargs.get("key")
        
        if not operation:
            raise ValueError("Missing required field: operation")
        if not key:
            raise ValueError("Missing required field: key")
        
        client = self._get_client()
        
        try:
            if operation == "store":
                value = kwargs.get("value")
                if value is None:
                    raise ValueError("Missing value for store operation")
                
                # Serialize value to JSON
                json_value = json.dumps(value)
                client.set(key, json_value)
                
                return {
                    "status": "success",
                    "operation": "store",
                    "key": key
                }
            
            elif operation == "get":
                raw_value = client.get(key)
                if raw_value is None:
                    return {
                        "status": "not_found",
                        "key": key
                    }
                
                # Deserialize from JSON
                value = json.loads(raw_value)
                
                return {
                    "status": "success",
                    "operation": "get",
                    "key": key,
                    "value": value
                }
            
            elif operation == "delete":
                deleted = client.delete(key)
                
                return {
                    "status": "success",
                    "operation": "delete",
                    "key": key,
                    "deleted": deleted > 0
                }
            
            else:
                return {
                    "status": "error",
                    "error": f"Unknown operation: {operation}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }