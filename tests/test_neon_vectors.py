"""
Tests for Neon pgvector integration.
Replacing legacy system Vectorize with PostgreSQL pgvector.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import numpy as np
from datetime import datetime
import uuid
import asyncpg


@pytest.fixture
def mock_neon_pool():
    """Create a mock Neon connection pool for testing."""
    pool = AsyncMock(spec=asyncpg.Pool)
    return pool


@pytest.fixture
def mock_embedding():
    """Create a mock embedding vector."""
    return np.random.rand(768).tolist()  # 768-dimensional vector


@pytest.mark.asyncio
class TestNeonVectors:
    """Test pgvector operations for Robot Brain RAG system."""
    
    async def test_generate_embeddings(self, mock_neon_pool, mock_embedding):
        """Test generating embeddings (mocked for MVP)."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        text = "Robot Brain is an AI-powered chat system"
        
        # Mock embedding generation (for MVP, we'll use mock embeddings)
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            # Act
            embedding = await manager.generate_embedding(text)
            
            # Assert
            assert isinstance(embedding, list)
            assert len(embedding) == 768
            assert all(isinstance(x, (int, float)) for x in embedding)
    
    async def test_store_embedding(self, mock_neon_pool, mock_embedding):
        """Test storing embeddings in pgvector."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        content = "Robot personalities include Friend, Nerd, Zen, Pirate, and Drama"
        metadata = {
            "source": "documentation",
            "category": "personalities",
            "robot": "all"
        }
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": str(uuid.uuid4())})
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            result = await manager.store_embedding(content, metadata)
        
        # Assert
        assert result["success"] is True
        assert "id" in result
        query = mock_conn.fetchrow.call_args[0][0]
        assert "INSERT INTO knowledge_vectors" in query
        assert "(id, content, embedding, metadata, created_at)" in query
    
    async def test_vector_similarity_search(self, mock_neon_pool, mock_embedding):
        """Test vector similarity search using pgvector."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        query_text = "Tell me about robot personalities"
        top_k = 5
        
        # Mock search results
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {
                "id": "vec1",
                "content": "Robot personalities include Friend, Nerd, Zen",
                "metadata": {"category": "personalities"},
                "similarity": 0.95
            },
            {
                "id": "vec2",
                "content": "Friend robot is cheerful and supportive",
                "metadata": {"robot": "friend"},
                "similarity": 0.87
            }
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            results = await manager.similarity_search(query_text, top_k)
        
        # Assert
        assert len(results) == 2
        assert results[0]["similarity"] > results[1]["similarity"]  # Ordered by similarity
        query = mock_conn.fetch.call_args[0][0]
        assert "SELECT" in query
        assert "ORDER BY embedding <=> $1" in query  # pgvector distance operator
        assert "LIMIT $2" in query
    
    async def test_rag_pattern_implementation(self, mock_neon_pool, mock_embedding):
        """Test RAG pattern - retrieve relevant context for queries."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        user_query = "How do I use the email tool?"
        
        # Mock relevant documents
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {
                "content": "EmailTool allows robots to send emails via SMTP",
                "metadata": {"tool": "email", "category": "tools"},
                "similarity": 0.92
            },
            {
                "content": "Email tool requires to, subject, and body parameters",
                "metadata": {"tool": "email", "category": "usage"},
                "similarity": 0.88
            }
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            context = await manager.get_rag_context(user_query, max_results=3)
        
        # Assert
        assert len(context) == 2
        assert all("content" in doc for doc in context)
        assert context[0]["metadata"]["tool"] == "email"
    
    async def test_handle_vector_errors(self, mock_neon_pool):
        """Test error handling for vector operations."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        
        # Mock connection error
        mock_neon_pool.acquire.side_effect = asyncpg.PostgresConnectionError("Connection failed")
        
        # Act
        result = await manager.store_embedding("test content", {})
        
        # Assert
        assert result["success"] is False
        assert "error" in result
    
    async def test_batch_embedding_generation(self, mock_neon_pool, mock_embedding):
        """Test batch generation of embeddings."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        texts = [
            "Robot Brain uses multiple AI models",
            "Nerd robot loves technical explanations",
            "Zen robot speaks calmly and thoughtfully"
        ]
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            embeddings = await manager.batch_generate_embeddings(texts)
        
        # Assert
        assert len(embeddings) == 3
        assert all(len(emb) == 768 for emb in embeddings)
    
    async def test_delete_knowledge_vectors(self, mock_neon_pool):
        """Test deleting knowledge vectors."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        vector_id = str(uuid.uuid4())
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(return_value="DELETE 1")
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.delete_vector(vector_id)
        
        # Assert
        assert result["success"] is True
        assert result["deleted"] is True
        query = mock_conn.execute.call_args[0][0]
        assert "DELETE FROM knowledge_vectors WHERE id = $1" in query
    
    async def test_metadata_filtering_search(self, mock_neon_pool, mock_embedding):
        """Test vector search with metadata filtering."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        query_text = "How to send emails"
        metadata_filter = {"category": "tools", "tool": "email"}
        
        # Mock filtered results
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {
                "content": "EmailTool configuration and usage",
                "metadata": {"category": "tools", "tool": "email"},
                "similarity": 0.90
            }
        ])
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            results = await manager.similarity_search(
                query_text, 
                top_k=5, 
                metadata_filter=metadata_filter
            )
        
        # Assert
        assert len(results) == 1
        assert results[0]["metadata"]["tool"] == "email"
        query = mock_conn.fetch.call_args[0][0]
        assert "WHERE metadata @> $3" in query  # JSONB containment operator
    
    async def test_index_performance(self, mock_neon_pool):
        """Test that vector operations use indexes efficiently."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={
            "index_used": True,
            "index_name": "knowledge_vectors_embedding_idx"
        })
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        result = await manager.check_index_usage()
        
        # Assert
        assert result["index_used"] is True
        assert "embedding_idx" in result["index_name"]
    
    async def test_update_embedding(self, mock_neon_pool, mock_embedding):
        """Test updating an existing embedding."""
        from src.neon.vector_manager import VectorManager
        
        # Arrange
        manager = VectorManager(pool=mock_neon_pool)
        vector_id = str(uuid.uuid4())
        new_content = "Updated robot documentation"
        new_metadata = {"version": "2.0", "updated": True}
        
        # Mock the connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(return_value="UPDATE 1")
        mock_neon_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Act
        with patch.object(manager, '_generate_mock_embedding', return_value=mock_embedding):
            result = await manager.update_embedding(vector_id, new_content, new_metadata)
        
        # Assert
        assert result["success"] is True
        assert result["updated"] is True
        query = mock_conn.execute.call_args[0][0]
        assert "UPDATE knowledge_vectors" in query
        assert "SET content = $2, embedding = $3::vector, metadata = $4::jsonb" in query
        assert "WHERE id = $1" in query


if __name__ == "__main__":
    pytest.main([__file__, "-v"])