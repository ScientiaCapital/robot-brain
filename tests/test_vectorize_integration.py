"""
Tests for Vectorize and Workers AI integration.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime
import uuid


@pytest.fixture
def mock_vectorize_index():
    """Create a mock Vectorize index for testing."""
    index = Mock()
    index.upsert = AsyncMock()
    index.query = AsyncMock()
    index.get = AsyncMock()
    index.delete = AsyncMock()
    return index


@pytest.fixture
def mock_ai_binding():
    """Create a mock AI binding for testing."""
    ai = Mock()
    ai.run = AsyncMock()
    return ai


@pytest.mark.asyncio
class TestVectorizeIntegration:
    """Test Vectorize and Workers AI integration for Robot Brain."""
    
    async def test_generate_embeddings_with_workers_ai(self, mock_ai_binding):
        """Test generating embeddings using Workers AI."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(vectorize_index=None, ai_binding=mock_ai_binding)
        text = "Robots can help with email automation"
        
        # Mock AI response
        mock_ai_binding.run.return_value = {
            "data": [[0.1, 0.2, 0.3, 0.4, 0.5]]  # Mock embedding vector
        }
        
        # Act
        result = await client.generate_embedding(text)
        
        # Assert
        assert result is not None
        assert len(result) == 5  # Vector dimension
        assert all(isinstance(x, (int, float)) for x in result)
        mock_ai_binding.run.assert_called_with(
            "@cf/baai/bge-base-en-v1.5",
            {"text": text}
        )
    
    async def test_store_embeddings_in_vectorize(self, mock_vectorize_index, mock_ai_binding):
        """Test storing embeddings in Vectorize."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, mock_ai_binding)
        
        # Mock AI embedding response
        mock_ai_binding.run.return_value = {
            "data": [[0.1, 0.2, 0.3, 0.4, 0.5]]
        }
        
        knowledge_item = {
            "id": "knowledge_001",
            "content": "Robots can help with email automation",
            "type": "capability",
            "robot": "all",
            "category": "tools"
        }
        
        # Act
        result = await client.store_knowledge(knowledge_item)
        
        # Assert
        assert result["success"] is True
        assert result["id"] == knowledge_item["id"]
        
        # Verify upsert was called correctly
        mock_vectorize_index.upsert.assert_called_once()
        upsert_args = mock_vectorize_index.upsert.call_args[0][0]
        assert len(upsert_args) == 1
        assert upsert_args[0]["id"] == "knowledge_001"
        assert "values" in upsert_args[0]
        assert "metadata" in upsert_args[0]
    
    async def test_vector_similarity_search(self, mock_vectorize_index, mock_ai_binding):
        """Test vector similarity search in Vectorize."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, mock_ai_binding)
        query = "How can robots help with email?"
        
        # Mock AI embedding response for query
        mock_ai_binding.run.return_value = {
            "data": [[0.1, 0.2, 0.3, 0.4, 0.5]]
        }
        
        # Mock Vectorize query response
        mock_vectorize_index.query.return_value = {
            "matches": [
                {
                    "id": "knowledge_001",
                    "score": 0.95,
                    "metadata": {
                        "content": "Robots can help with email automation",
                        "category": "tools",
                        "robot": "all"
                    }
                },
                {
                    "id": "knowledge_002",
                    "score": 0.87,
                    "metadata": {
                        "content": "Friend robot loves sending friendly emails",
                        "category": "personality",
                        "robot": "friend"
                    }
                }
            ]
        }
        
        # Act
        results = await client.search_knowledge(query, top_k=5)
        
        # Assert
        assert len(results) == 2
        assert results[0]["score"] == 0.95
        assert results[0]["content"] == "Robots can help with email automation"
        assert results[1]["score"] == 0.87
        
        # Verify query was called with correct parameters
        mock_vectorize_index.query.assert_called_once()
        query_args = mock_vectorize_index.query.call_args
        assert query_args[1]["topK"] == 5
    
    async def test_rag_pattern_implementation(self, mock_vectorize_index, mock_ai_binding):
        """Test RAG (Retrieval-Augmented Generation) pattern."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, mock_ai_binding)
        user_query = "What tools can the robots use?"
        
        # Mock embedding generation
        mock_ai_binding.run.return_value = {
            "data": [[0.1, 0.2, 0.3, 0.4, 0.5]]
        }
        
        # Mock vector search results
        mock_vectorize_index.query.return_value = {
            "matches": [
                {
                    "id": "tool_001",
                    "score": 0.92,
                    "metadata": {
                        "content": "Robots can use email tool to send messages",
                        "category": "tools"
                    }
                },
                {
                    "id": "tool_002",
                    "score": 0.88,
                    "metadata": {
                        "content": "Robots can use scraping tool to fetch web data",
                        "category": "tools"
                    }
                }
            ]
        }
        
        # Act
        context = await client.get_rag_context(user_query, top_k=3)
        
        # Assert
        assert "context" in context
        assert "sources" in context
        assert len(context["sources"]) == 2
        assert "email tool" in context["context"]
        assert "scraping tool" in context["context"]
    
    async def test_handle_vectorize_errors(self, mock_vectorize_index, mock_ai_binding):
        """Test error handling for Vectorize operations."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, mock_ai_binding)
        
        # Mock Vectorize error
        mock_vectorize_index.upsert.side_effect = Exception("Vectorize index unavailable")
        mock_ai_binding.run.return_value = {"data": [[0.1, 0.2, 0.3]]}
        
        # Act
        result = await client.store_knowledge({
            "id": "error_test",
            "content": "This will fail"
        })
        
        # Assert
        assert result["success"] is False
        assert "error" in result
        assert "Vectorize index unavailable" in result["error"]
    
    async def test_batch_embedding_generation(self, mock_ai_binding):
        """Test batch embedding generation for efficiency."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(vectorize_index=None, ai_binding=mock_ai_binding)
        texts = [
            "Robots love helping people",
            "AI makes robots smarter",
            "Friend robot is always happy"
        ]
        
        # Mock batch AI response
        mock_ai_binding.run.side_effect = [
            {"data": [[0.1, 0.2, 0.3]]},
            {"data": [[0.4, 0.5, 0.6]]},
            {"data": [[0.7, 0.8, 0.9]]}
        ]
        
        # Act
        embeddings = await client.generate_batch_embeddings(texts)
        
        # Assert
        assert len(embeddings) == 3
        assert len(embeddings[0]) == 3
        assert embeddings[0] == [0.1, 0.2, 0.3]
        assert embeddings[2] == [0.7, 0.8, 0.9]
        assert mock_ai_binding.run.call_count == 3
    
    async def test_delete_knowledge(self, mock_vectorize_index):
        """Test deleting knowledge from Vectorize."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, ai_binding=None)
        knowledge_id = "knowledge_to_delete"
        
        # Act
        result = await client.delete_knowledge(knowledge_id)
        
        # Assert
        assert result["success"] is True
        assert result["deleted_id"] == knowledge_id
        mock_vectorize_index.delete.assert_called_with([knowledge_id])
    
    async def test_metadata_filtering(self, mock_vectorize_index, mock_ai_binding):
        """Test vector search with metadata filtering."""
        from src.cloudflare.vectorize_client import VectorizeClient
        
        # Arrange
        client = VectorizeClient(mock_vectorize_index, mock_ai_binding)
        
        # Mock embedding
        mock_ai_binding.run.return_value = {"data": [[0.1, 0.2, 0.3]]}
        
        # Mock filtered results
        mock_vectorize_index.query.return_value = {
            "matches": [
                {
                    "id": "friend_001",
                    "score": 0.90,
                    "metadata": {
                        "content": "Friend robot specific knowledge",
                        "robot": "friend"
                    }
                }
            ]
        }
        
        # Act
        results = await client.search_knowledge(
            query="robot knowledge",
            top_k=5,
            filter={"robot": "friend"}
        )
        
        # Assert
        assert len(results) == 1
        assert results[0]["metadata"]["robot"] == "friend"
        
        # Verify filter was passed
        query_args = mock_vectorize_index.query.call_args
        assert "filter" in query_args[1]
        assert query_args[1]["filter"]["robot"] == "friend"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])