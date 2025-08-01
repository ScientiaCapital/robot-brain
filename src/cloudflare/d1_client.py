"""
D1 Database client for Robot Brain.
Minimal implementation to make tests pass (GREEN phase).
"""

import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime


class D1Client:
    """Client for interacting with Cloudflare D1 database."""
    
    def __init__(self, d1_binding):
        """Initialize D1 client with database binding."""
        self.db = d1_binding
    
    async def store_conversation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a conversation in D1."""
        try:
            conversation_id = str(uuid.uuid4())
            metadata_json = json.dumps(data.get("metadata", {}))
            
            statement = self.db.prepare(
                """
                INSERT INTO conversations 
                (id, robot_personality, user_message, robot_response, session_id, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                """
            )
            
            result = await statement.bind(
                conversation_id,
                data.get("robot_personality"),
                data.get("user_message"),
                data.get("robot_response"),
                data.get("session_id"),
                metadata_json
            ).run()
            
            return {
                "success": True,
                "id": conversation_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a conversation by ID."""
        try:
            statement = self.db.prepare(
                "SELECT * FROM conversations WHERE id = ?"
            )
            
            result = await statement.bind(conversation_id).first()
            
            if result and "metadata" in result:
                # Parse JSON metadata
                result["metadata"] = json.loads(result["metadata"])
            
            return result
        except Exception as e:
            return None
    
    async def query_by_robot(self, robot_personality: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Query conversations by robot personality."""
        try:
            statement = self.db.prepare(
                "SELECT * FROM conversations WHERE robot_personality = ? ORDER BY created_at DESC LIMIT ?"
            )
            
            result = await statement.bind(robot_personality, limit).all()
            
            return result.get("results", [])
        except Exception as e:
            return []
    
    async def store_robot_interaction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a multi-robot chat interaction."""
        try:
            interaction_id = str(uuid.uuid4())
            participants_json = json.dumps(data.get("participants", []))
            responses_json = json.dumps(data.get("responses", []))
            
            statement = self.db.prepare(
                """
                INSERT INTO robot_interactions 
                (id, topic, interaction_type, participants, responses)
                VALUES (?, ?, ?, ?, ?)
                """
            )
            
            result = await statement.bind(
                interaction_id,
                data.get("topic"),
                data.get("interaction_type"),
                participants_json,
                responses_json
            ).run()
            
            return {
                "success": True,
                "id": interaction_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_tool_usage(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Track tool usage in the database."""
        try:
            usage_id = str(uuid.uuid4())
            input_params_json = json.dumps(data.get("input_params", {}))
            output_result_json = json.dumps(data.get("output_result", {}))
            
            statement = self.db.prepare(
                """
                INSERT INTO tool_usage 
                (id, tool_name, robot_personality, input_params, output_result, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """
            )
            
            result = await statement.bind(
                usage_id,
                data.get("tool_name"),
                data.get("robot_personality"),
                input_params_json,
                output_result_json,
                data.get("status")
            ).run()
            
            return {
                "success": True,
                "id": usage_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def batch_store_conversations(self, conversations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch insert multiple conversations."""
        try:
            statements = []
            conversation_ids = []
            
            for conv in conversations:
                conversation_id = str(uuid.uuid4())
                conversation_ids.append(conversation_id)
                metadata_json = json.dumps(conv.get("metadata", {}))
                
                statement = self.db.prepare(
                    """
                    INSERT INTO conversations 
                    (id, robot_personality, user_message, robot_response, session_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """
                ).bind(
                    conversation_id,
                    conv.get("robot_personality"),
                    conv.get("user_message"),
                    conv.get("robot_response"),
                    conv.get("session_id"),
                    metadata_json
                )
                
                statements.append(statement)
            
            # Call the batch method properly
            results = await self.db.batch(statements)
            
            # Return success with ids for each result
            return [
                {"success": True, "id": conversation_ids[i]} 
                for i in range(len(results))
            ]
        except Exception as e:
            return [
                {"success": False, "error": str(e)} 
                for _ in conversations
            ]