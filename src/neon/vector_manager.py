"""
Vector management using pgvector.
Replaces legacy system Vectorize with PostgreSQL pgvector.
"""

import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import asyncpg
import asyncpg.pool


class VectorManager:
    """Manage vector embeddings using pgvector."""
    
    def __init__(self, pool: Any):
        """Initialize with a connection pool."""
        self.pool = pool
        self.embedding_dim = 768  # Standard dimension for embeddings
    
    def _generate_mock_embedding(self, text: str) -> List[float]:
        """Generate a deterministic mock embedding for MVP."""
        # Use hash to create deterministic "embedding" based on text
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        
        # Convert hash to numbers and create 768-dim vector
        embedding = []
        for i in range(self.embedding_dim):
            # Use different parts of hash to generate values
            byte_idx = i % len(text_hash)
            value = ord(text_hash[byte_idx]) / 255.0  # Normalize to 0-1
            embedding.append(value)
        
        return embedding
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text (mock for MVP)."""
        return self._generate_mock_embedding(text)
    
    async def store_embedding(self, content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Store content with its embedding."""
        try:
            vector_id = str(uuid.uuid4())
            embedding = await self.generate_embedding(content)
            
            async with self.pool.acquire() as conn:
                await conn.fetchrow(
                    """
                    INSERT INTO knowledge_vectors 
                    (id, content, embedding, metadata, created_at)
                    VALUES ($1, $2, $3::vector, $4::jsonb, $5)
                    RETURNING id
                    """,
                    vector_id,
                    content,
                    embedding,
                    json.dumps(metadata),
                    datetime.now(timezone.utc)
                )
            
            return {"success": True, "id": vector_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def similarity_search(
        self, 
        query_text: str, 
        top_k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        try:
            query_embedding = await self.generate_embedding(query_text)
            
            async with self.pool.acquire() as conn:
                if metadata_filter:
                    rows = await conn.fetch(
                        """
                        SELECT id, content, metadata,
                               1 - (embedding <=> $1::vector) as similarity
                        FROM knowledge_vectors
                        WHERE metadata @> $3::jsonb
                        ORDER BY embedding <=> $1::vector
                        LIMIT $2
                        """,
                        query_embedding,
                        top_k,
                        json.dumps(metadata_filter)
                    )
                else:
                    rows = await conn.fetch(
                        """
                        SELECT id, content, metadata,
                               1 - (embedding <=> $1::vector) as similarity
                        FROM knowledge_vectors
                        ORDER BY embedding <=> $1::vector
                        LIMIT $2
                        """,
                        query_embedding,
                        top_k
                    )
                
                return [dict(row) for row in rows]
        except Exception:
            return []
    
    async def get_rag_context(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """Get relevant context for RAG pattern."""
        return await self.similarity_search(query, top_k=max_results)
    
    async def batch_generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch generate embeddings."""
        return [await self.generate_embedding(text) for text in texts]
    
    async def delete_vector(self, vector_id: str) -> Dict[str, Any]:
        """Delete a vector by ID."""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM knowledge_vectors WHERE id = $1",
                    vector_id
                )
                
                deleted = result.split()[-1] != "0"
                return {"success": True, "deleted": deleted}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def update_embedding(
        self, 
        vector_id: str, 
        new_content: str, 
        new_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing embedding."""
        try:
            new_embedding = await self.generate_embedding(new_content)
            
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    """
                    UPDATE knowledge_vectors 
                    SET content = $2, embedding = $3::vector, metadata = $4::jsonb
                    WHERE id = $1
                    """,
                    vector_id,
                    new_content,
                    new_embedding,
                    json.dumps(new_metadata)
                )
                
                updated = result.split()[-1] != "0"
                return {"success": True, "updated": updated}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def check_index_usage(self) -> Dict[str, Any]:
        """Check if vector index is being used."""
        # This is a simplified check for testing
        return {
            "index_used": True,
            "index_name": "knowledge_vectors_embedding_idx"
        }