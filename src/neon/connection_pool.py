"""
Connection pool management for Neon PostgreSQL.
🟢 TDD GREEN Phase: Enhanced with Context7 best practices.
"""

import os
import asyncio
import asyncpg
import asyncpg.pool
from typing import Optional, Dict, Any


class ConnectionManager:
    """Manage PostgreSQL connection pool."""
    
    def __init__(self) -> None:
        self.pool: Optional[Any] = None
        self.connection_string = os.getenv("NEON_DATABASE_URL")
    
    async def create_pool(self, min_size: int = 1, max_size: int = 10) -> Any:
        """Create connection pool."""
        if not self.connection_string:
            raise ValueError("NEON_DATABASE_URL not set in environment")
        
        self.pool = await asyncpg.create_pool(
            self.connection_string,
            min_size=min_size,
            max_size=max_size,
            command_timeout=60
        )
        
        return self.pool
    
    async def close_pool(self) -> None:
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    def get_pool(self) -> Any:
        """Get existing pool."""
        if not self.pool:
            raise RuntimeError("Connection pool not initialized")
        return self.pool


# Global connection manager instance
connection_manager = ConnectionManager()


# 🟢 TDD GREEN Phase: Production functions based on Context7 best practices

def get_production_pool_config() -> Dict[str, Any]:
    """
    Get production connection pool configuration.
    Based on Context7 Neon best practices research.
    """
    return {
        "min_size": int(os.getenv("MIN_CONNECTIONS", "1")),
        "max_size": int(os.getenv("MAX_CONNECTIONS", "10")),
        "command_timeout": int(os.getenv("CONNECTION_TIMEOUT", "60")),
        "server_settings": {
            "application_name": "robot-brain-prod",
            "timezone": "UTC"
        }
    }


async def create_resilient_connection(connection_string: str, max_retries: int = 3) -> Any:
    """
    Create resilient connection with retry logic for scale-to-zero scenarios.
    Context7 best practice: Handle Neon compute scale-to-zero gracefully.
    """
    config = get_production_pool_config()
    
    for attempt in range(max_retries):
        try:
            pool = await asyncpg.create_pool(connection_string, **config)
            return pool
        except (asyncpg.exceptions.ConnectionDoesNotExistError, 
                asyncpg.exceptions.InterfaceError) as e:
            if attempt == max_retries - 1:
                raise e
            
            # Wait for Neon compute to wake up (Context7 pattern)
            wait_time = 2 ** attempt  # Exponential backoff
            await asyncio.sleep(wait_time)
            continue
        except Exception as e:
            # For other exceptions, don't retry
            raise e
    
    raise Exception("Failed to create connection after all retries")


def validate_ssl_config(ssl_config: Dict[str, str]) -> bool:
    """
    Validate SSL configuration follows Context7 security best practices.
    """
    required_ssl_mode = ssl_config.get("sslmode")
    channel_binding = ssl_config.get("channel_binding")
    
    # Context7 security requirements
    if required_ssl_mode != "require":
        return False
    
    # Enhanced security with channel binding
    if channel_binding == "require":
        return True
    
    # Basic SSL is acceptable but not optimal
    return True


async def get_production_pool() -> Any:
    """
    Get production database connection pool.
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    return await create_resilient_connection(database_url)


async def test_connection_health(pool: Any) -> bool:
    """
    Test database connection health for monitoring.
    """
    try:
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return bool(result == 1)
    except Exception:
        return False