"""
KV Namespace client for Robot Brain.
Minimal implementation to make tests pass (GREEN phase).
"""

import json
from typing import Dict, Any, List, Optional


class KVClient:
    """Client for interacting with Cloudflare KV namespace."""
    
    def __init__(self, kv_namespace):
        """Initialize KV client with namespace binding."""
        self.kv = kv_namespace
    
    async def store_session(self, session_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> Dict[str, Any]:
        """Store session data in KV with optional TTL."""
        try:
            key = f"session:{session_id}"
            value = json.dumps(data)
            
            # Build options
            options = {}
            if ttl:
                options["expirationTtl"] = ttl
            
            await self.kv.put(key, value, **options)
            
            return {
                "success": True,
                "key": key
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data from KV."""
        try:
            key = f"session:{session_id}"
            value = await self.kv.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
        except Exception as e:
            return None
    
    async def store_robot_state(self, robot_name: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Store robot state in KV."""
        try:
            key = f"robot:{robot_name}:state"
            value = json.dumps(state)
            
            await self.kv.put(key, value)
            
            return {
                "success": True,
                "key": key
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_robot_state(self, robot_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve robot state from KV."""
        try:
            key = f"robot:{robot_name}:state"
            value = await self.kv.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
        except Exception as e:
            return None
    
    async def store_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Store user preferences in KV."""
        try:
            key = f"user:{user_id}:prefs"
            value = json.dumps(preferences)
            
            await self.kv.put(key, value)
            
            return {
                "success": True,
                "key": key
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user preferences from KV."""
        try:
            key = f"user:{user_id}:prefs"
            value = await self.kv.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
        except Exception as e:
            return None
    
    async def delete_session(self, session_id: str) -> Dict[str, Any]:
        """Delete a session from KV."""
        try:
            key = f"session:{session_id}"
            await self.kv.delete(key)
            
            return {
                "success": True,
                "deleted_key": key
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def list_active_sessions(self) -> List[str]:
        """List all active sessions."""
        try:
            result = await self.kv.list(prefix="session:")
            keys = result.get("keys", [])
            return [key["name"] for key in keys]
        except Exception as e:
            return []
    
    async def batch_get(self, keys: List[str]) -> List[Optional[Dict[str, Any]]]:
        """Batch get multiple keys for efficiency."""
        results = []
        
        for key in keys:
            try:
                value = await self.kv.get(key)
                if value is None:
                    results.append(None)
                else:
                    results.append(json.loads(value))
            except Exception:
                results.append(None)
        
        return results