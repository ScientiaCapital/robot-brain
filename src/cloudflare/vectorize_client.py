"""
Vectorize and Workers AI client for Robot Brain.
Minimal implementation to make tests pass (GREEN phase).
"""

import json
from typing import Dict, Any, List, Optional


class VectorizeClient:
    """Client for interacting with Cloudflare Vectorize and Workers AI."""
    
    def __init__(self, vectorize_index=None, ai_binding=None):
        """Initialize Vectorize client with index and AI bindings."""
        self.vectorize = vectorize_index
        self.ai = ai_binding
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector using Workers AI."""
        try:
            result = await self.ai.run(
                "@cf/baai/bge-base-en-v1.5",
                {"text": text}
            )
            
            # Extract the embedding vector from response
            if "data" in result and len(result["data"]) > 0:
                return result["data"][0]
            
            return []
        except Exception as e:
            return []
    
    async def store_knowledge(self, knowledge_item: Dict[str, Any]) -> Dict[str, Any]:
        """Store knowledge item with embedding in Vectorize."""
        try:
            # Generate embedding for the content
            embedding = await self.generate_embedding(knowledge_item.get("content", ""))
            
            if not embedding:
                return {
                    "success": False,
                    "error": "Failed to generate embedding"
                }
            
            # Prepare vector data for upsert
            vector_data = [{
                "id": knowledge_item.get("id"),
                "values": embedding,
                "metadata": {
                    "content": knowledge_item.get("content"),
                    "type": knowledge_item.get("type"),
                    "robot": knowledge_item.get("robot"),
                    "category": knowledge_item.get("category")
                }
            }]
            
            # Store in Vectorize
            await self.vectorize.upsert(vector_data)
            
            return {
                "success": True,
                "id": knowledge_item.get("id")
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def search_knowledge(self, query: str, top_k: int = 5, filter: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Search for similar knowledge using vector similarity."""
        try:
            # Generate embedding for query
            query_embedding = await self.generate_embedding(query)
            
            if not query_embedding:
                return []
            
            # Build query options
            query_options = {"topK": top_k}
            if filter:
                query_options["filter"] = filter
            
            # Query Vectorize
            result = await self.vectorize.query(query_embedding, **query_options)
            
            # Extract and format results
            matches = result.get("matches", [])
            return [
                {
                    "id": match["id"],
                    "score": match["score"],
                    "content": match["metadata"].get("content", ""),
                    "category": match["metadata"].get("category", ""),
                    "robot": match["metadata"].get("robot", ""),
                    "metadata": match["metadata"]
                }
                for match in matches
            ]
        except Exception as e:
            return []
    
    async def get_rag_context(self, user_query: str, top_k: int = 3) -> Dict[str, Any]:
        """Get RAG context by retrieving relevant knowledge."""
        try:
            # Search for relevant knowledge
            results = await self.search_knowledge(user_query, top_k=top_k)
            
            if not results:
                return {
                    "context": "",
                    "sources": []
                }
            
            # Build context from results
            context_parts = []
            sources = []
            
            for result in results:
                context_parts.append(result["content"])
                sources.append({
                    "id": result["id"],
                    "content": result["content"],
                    "score": result["score"]
                })
            
            return {
                "context": "\n".join(context_parts),
                "sources": sources
            }
        except Exception as e:
            return {
                "context": "",
                "sources": [],
                "error": str(e)
            }
    
    async def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        embeddings = []
        
        for text in texts:
            embedding = await self.generate_embedding(text)
            embeddings.append(embedding)
        
        return embeddings
    
    async def delete_knowledge(self, knowledge_id: str) -> Dict[str, Any]:
        """Delete knowledge item from Vectorize."""
        try:
            await self.vectorize.delete([knowledge_id])
            
            return {
                "success": True,
                "deleted_id": knowledge_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }