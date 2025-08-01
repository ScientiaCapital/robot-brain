"""
Session management using Neon PostgreSQL JSONB.
Replaces legacy system KV with PostgreSQL.
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
import asyncpg
import asyncpg.pool


class SessionManager:
    """Manage sessions using PostgreSQL JSONB storage."""
    
    def __init__(self, pool: Any):
        """Initialize with a connection pool."""
        self.pool = pool
    
    async def set_session(self, key: str, data: Dict[str, Any], ttl_seconds: int) -> Dict[str, Any]:
        """Store a session with TTL."""
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO robot_memory (key, value, expires_at, created_at)
                    VALUES ($1, $2::jsonb, $3, $4)
                    ON CONFLICT (key) DO UPDATE 
                    SET value = $2::jsonb, expires_at = $3, created_at = $4
                    """,
                    key,
                    json.dumps(data),
                    expires_at,
                    datetime.now(timezone.utc)
                )
            
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_session(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data."""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT value FROM robot_memory 
                    WHERE key = $1 
                    AND (expires_at IS NULL OR expires_at > NOW())
                    """,
                    key
                )
                
                if row:
                    return dict(row["value"]) if row["value"] else None
                return None
        except Exception:
            return None
    
    async def set_robot_state(self, key: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Store robot state."""
        # Robot state doesn't expire
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO robot_memory (key, value, expires_at, created_at)
                    VALUES ($1, $2::jsonb, NULL, $3)
                    ON CONFLICT (key) DO UPDATE 
                    SET value = $2::jsonb, created_at = $3
                    """,
                    key,
                    json.dumps(state),
                    datetime.now(timezone.utc)
                )
            
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def set_user_preferences(self, key: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Store user preferences."""
        return await self.set_robot_state(key, preferences)
    
    async def get_user_preferences(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve user preferences."""
        return await self.get_session(key)
    
    async def list_active_sessions(self) -> List[Dict[str, Any]]:
        """List all active sessions."""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM robot_memory 
                    WHERE key LIKE 'session:%'
                    AND (expires_at IS NULL OR expires_at > NOW())
                    """
                )
                
                return [dict(row) for row in rows]
        except Exception:
            return []
    
    async def delete_session(self, key: str) -> Dict[str, Any]:
        """Delete a session."""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM robot_memory WHERE key = $1",
                    key
                )
                
                deleted = result.split()[-1] != "0"
                return {"success": True, "deleted": deleted}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def batch_get_sessions(self, keys: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """Batch get multiple sessions."""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT key, value FROM robot_memory 
                    WHERE key = ANY($1)
                    AND (expires_at IS NULL OR expires_at > NOW())
                    """,
                    keys
                )
                
                # Build result dict
                result: Dict[str, Optional[Dict[str, Any]]] = {key: None for key in keys}
                for row in rows:
                    result[row["key"]] = row["value"]
                
                return result
        except Exception:
            return {key: None for key in keys}
    
    async def cleanup_expired_sessions(self) -> Dict[str, Any]:
        """Clean up expired sessions."""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM robot_memory WHERE expires_at < NOW()"
                )
                
                # Extract count from result string like "DELETE 5"
                count = int(result.split()[-1])
                return {"success": True, "deleted_count": count}
        except Exception as e:
            return {"success": False, "error": str(e)}