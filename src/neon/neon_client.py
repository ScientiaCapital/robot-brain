"""
Neon PostgreSQL client for Robot Brain.
Production-ready PostgreSQL client with connection pooling and Context7 best practices.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import asyncpg
from asyncpg import Pool


class NeonClient:
    """Client for interacting with Neon PostgreSQL database."""
    
    def __init__(self, pool: Pool):
        """Initialize with a connection pool."""
        self.pool = pool
    
    async def store_conversation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a conversation in the database."""
        try:
            conversation_id = str(uuid.uuid4())
            metadata_json = json.dumps(data.get("metadata", {}))
            
            async with self.pool.acquire() as conn:
                await conn.fetchrow(
                    """
                    INSERT INTO conversations 
                    (id, robot_personality, user_message, robot_response, session_id, metadata, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
                    RETURNING id
                    """,
                    conversation_id,
                    data["robot_personality"],
                    data["user_message"],
                    data["robot_response"],
                    data.get("session_id"),
                    metadata_json,
                    datetime.now(timezone.utc)
                )
            
            return {"success": True, "id": conversation_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a conversation by ID."""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT * FROM conversations WHERE id = $1",
                    conversation_id
                )
                
                if row:
                    return dict(row)
                return None
        except Exception:
            return None
    
    async def query_by_robot(self, robot_personality: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Query conversations by robot personality."""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM conversations 
                    WHERE robot_personality = $1 
                    ORDER BY created_at DESC 
                    LIMIT $2
                    """,
                    robot_personality,
                    limit
                )
                
                return [dict(row) for row in rows]
        except Exception:
            return []
    
    async def store_robot_interaction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a multi-robot interaction."""
        try:
            interaction_id = str(uuid.uuid4())
            
            async with self.pool.acquire() as conn:
                await conn.fetchrow(
                    """
                    INSERT INTO robot_interactions 
                    (id, topic, interaction_type, participants, responses, created_at)
                    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
                    RETURNING id
                    """,
                    interaction_id,
                    data["topic"],
                    data["interaction_type"],
                    json.dumps(data["participants"]),
                    json.dumps(data["responses"]),
                    datetime.now(timezone.utc)
                )
            
            return {"success": True, "id": interaction_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def track_tool_usage(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Track tool usage."""
        try:
            usage_id = str(uuid.uuid4())
            
            async with self.pool.acquire() as conn:
                await conn.fetchrow(
                    """
                    INSERT INTO tool_usage 
                    (id, tool_name, robot_personality, input_params, output_result, status, created_at)
                    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
                    RETURNING id
                    """,
                    usage_id,
                    data["tool_name"],
                    data["robot_personality"],
                    json.dumps(data["input_params"]),
                    json.dumps(data["output_result"]),
                    data["status"],
                    datetime.now(timezone.utc)
                )
            
            return {"success": True, "id": usage_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def batch_store_conversations(self, conversations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch store multiple conversations."""
        results = []
        
        try:
            async with self.pool.acquire() as conn:
                # Use a transaction for batch operations
                async with conn.transaction():
                    for conv in conversations:
                        conv_id = str(uuid.uuid4())
                        metadata_json = json.dumps(conv.get("metadata", {}))
                        
                        await conn.execute(
                            """
                            INSERT INTO conversations 
                            (id, robot_personality, user_message, robot_response, session_id, metadata, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
                            """,
                            conv_id,
                            conv["robot_personality"],
                            conv["user_message"],
                            conv["robot_response"],
                            conv.get("session_id"),
                            metadata_json,
                            datetime.now(timezone.utc)
                        )
                        
                        results.append({"success": True, "id": conv_id})
            
            return results
        except Exception as e:
            # If batch fails, return error for all
            return [{"success": False, "error": str(e)} for _ in conversations]