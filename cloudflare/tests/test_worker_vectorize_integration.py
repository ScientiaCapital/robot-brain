"""
Vectorize Worker Integration Tests
Following TDD RED Phase - Write failing tests FIRST
Tests for Cloudflare Worker Vectorize integration with RAG pattern
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import uuid

# Import the Worker handler (to be implemented)
from cloudflare.worker import handle_request


class TestWorkerVectorizeIntegration:
    """Test Vectorize integration in Cloudflare Worker for RAG pattern"""
    
    @pytest.fixture
    def mock_env(self):
        """Mock Cloudflare Worker environment with Vectorize and AI bindings"""
        env = Mock()
        
        # Mock Vectorize
        env.VECTORIZE = Mock()
        env.VECTORIZE.upsert = AsyncMock()
        env.VECTORIZE.query = AsyncMock()
        env.VECTORIZE.delete = AsyncMock()
        
        # Mock Workers AI for embeddings
        env.AI = Mock()
        env.AI.run = AsyncMock()
        
        # Mock other bindings for complete env
        env.DB = Mock()
        env.ROBOT_MEMORY = Mock()
        
        return env
    
    @pytest.fixture
    def mock_request(self):
        """Mock incoming request"""
        request = Mock()
        request.method = "POST"
        request.headers = {"Content-Type": "application/json"}
        request.json = AsyncMock()
        return request
    
    @pytest.mark.asyncio
    async def test_worker_can_generate_and_store_embeddings(self, mock_env, mock_request):
        """Test that worker can generate embeddings and store in Vectorize"""
        # Arrange
        knowledge_data = {
            "action": "store_knowledge",
            "data": {
                "knowledge_id": "robot-cap-001",
                "content": "Robots can help with email automation using SMTP integration",
                "metadata": {
                    "type": "capability",
                    "robot": "all",
                    "category": "tools",
                    "tool": "email"
                }
            }
        }
        mock_request.json.return_value = knowledge_data
        
        # Mock AI embedding generation
        mock_embedding = {"data": [[0.1, 0.2, 0.3, 0.4, 0.5]]}  # Simplified embedding
        mock_env.AI.run.return_value = mock_embedding
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["knowledge_id"] == "robot-cap-001"
        
        # Verify AI was called to generate embedding
        mock_env.AI.run.assert_called_once_with(
            "@cf/baai/bge-base-en-v1.5",
            {"text": "Robots can help with email automation using SMTP integration"}
        )
        
        # Verify Vectorize upsert was called
        mock_env.VECTORIZE.upsert.assert_called_once()
        upsert_args = mock_env.VECTORIZE.upsert.call_args[0][0]
        assert len(upsert_args) == 1
        assert upsert_args[0]["id"] == "robot-cap-001"
        assert upsert_args[0]["values"] == [0.1, 0.2, 0.3, 0.4, 0.5]
        assert upsert_args[0]["metadata"]["type"] == "capability"
    
    @pytest.mark.asyncio
    async def test_worker_can_search_knowledge_with_rag(self, mock_env, mock_request):
        """Test that worker can search knowledge using RAG pattern"""
        # Arrange
        search_data = {
            "action": "search_knowledge",
            "data": {
                "query": "How can robots help with emails?",
                "top_k": 3,
                "filter": {"category": "tools"}
            }
        }
        mock_request.json.return_value = search_data
        
        # Mock AI embedding for query
        mock_query_embedding = {"data": [[0.12, 0.22, 0.32, 0.42, 0.52]]}
        mock_env.AI.run.return_value = mock_query_embedding
        
        # Mock Vectorize query results
        mock_env.VECTORIZE.query.return_value = {
            "matches": [
                {
                    "id": "robot-cap-001",
                    "score": 0.95,
                    "metadata": {
                        "type": "capability",
                        "content": "Robots can help with email automation using SMTP integration",
                        "category": "tools"
                    }
                },
                {
                    "id": "robot-cap-002",
                    "score": 0.87,
                    "metadata": {
                        "type": "capability",
                        "content": "Email tool allows sending messages programmatically",
                        "category": "tools"
                    }
                }
            ]
        }
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert len(response_data["results"]) == 2
        assert response_data["results"][0]["score"] == 0.95
        assert "email automation" in response_data["results"][0]["content"]
        
        # Verify embedding generation for query
        mock_env.AI.run.assert_called_once_with(
            "@cf/baai/bge-base-en-v1.5",
            {"text": "How can robots help with emails?"}
        )
        
        # Verify Vectorize query
        mock_env.VECTORIZE.query.assert_called_once()
        query_args = mock_env.VECTORIZE.query.call_args
        assert query_args[0][0] == [0.12, 0.22, 0.32, 0.42, 0.52]
        assert query_args[1]["topK"] == 3
    
    @pytest.mark.asyncio
    async def test_worker_can_implement_rag_for_robot_responses(self, mock_env, mock_request):
        """Test that worker implements RAG pattern for enhanced robot responses"""
        # Arrange
        rag_chat_data = {
            "action": "rag_enhanced_chat",
            "data": {
                "robot_personality": "nerd",
                "user_message": "Tell me about web scraping capabilities",
                "use_rag": True
            }
        }
        mock_request.json.return_value = rag_chat_data
        
        # Mock embedding generation
        mock_env.AI.run.return_value = {"data": [[0.15, 0.25, 0.35, 0.45, 0.55]]}
        
        # Mock Vectorize results with relevant knowledge
        mock_env.VECTORIZE.query.return_value = {
            "matches": [
                {
                    "id": "tool-003",
                    "score": 0.92,
                    "metadata": {
                        "content": "WebScrapingTool uses BeautifulSoup to parse HTML and extract data",
                        "category": "tools",
                        "tool": "webscraping"
                    }
                },
                {
                    "id": "tool-004",
                    "score": 0.88,
                    "metadata": {
                        "content": "PuppeteerScrapingTool handles JavaScript-heavy sites with browser automation",
                        "category": "tools",
                        "tool": "puppeteer"
                    }
                }
            ]
        }
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert "context" in response_data
        assert len(response_data["context"]) == 2
        assert response_data["context"][0]["tool"] == "webscraping"
        assert "BeautifulSoup" in response_data["context"][0]["content"]
        
        # Verify RAG flow: embedding → query → context
        assert mock_env.AI.run.call_count >= 1  # At least for query embedding
        mock_env.VECTORIZE.query.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_worker_can_store_conversation_embeddings(self, mock_env, mock_request):
        """Test that worker can store conversation history as embeddings"""
        # Arrange
        conversation_embedding_data = {
            "action": "store_conversation_embedding",
            "data": {
                "conversation_id": "conv-emb-001",
                "robot_personality": "zen",
                "conversation": {
                    "user": "How do I find inner peace?",
                    "robot": "Inner peace begins with acceptance of the present moment..."
                },
                "metadata": {
                    "session_id": "zen-session-001",
                    "timestamp": "2025-08-01T15:00:00Z",
                    "topic": "mindfulness"
                }
            }
        }
        mock_request.json.return_value = conversation_embedding_data
        
        # Mock embedding generation for conversation
        mock_env.AI.run.return_value = {"data": [[0.2, 0.3, 0.4, 0.5, 0.6]]}
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        
        # Verify embedding was generated for full conversation
        mock_env.AI.run.assert_called_once()
        embedding_text = mock_env.AI.run.call_args[0][1]["text"]
        assert "How do I find inner peace?" in embedding_text
        assert "Inner peace begins with acceptance" in embedding_text
        
        # Verify Vectorize stored the conversation
        mock_env.VECTORIZE.upsert.assert_called_once()
        upsert_data = mock_env.VECTORIZE.upsert.call_args[0][0][0]
        assert upsert_data["id"] == "conv-emb-001"
        assert upsert_data["metadata"]["robot_personality"] == "zen"
        assert upsert_data["metadata"]["topic"] == "mindfulness"
    
    @pytest.mark.asyncio
    async def test_worker_handles_vectorize_errors_gracefully(self, mock_env, mock_request):
        """Test that worker handles Vectorize errors gracefully"""
        # Arrange
        knowledge_data = {
            "action": "store_knowledge",
            "data": {
                "knowledge_id": "error-test",
                "content": "Test content",
                "metadata": {"type": "test"}
            }
        }
        mock_request.json.return_value = knowledge_data
        
        # Mock AI works but Vectorize fails
        mock_env.AI.run.return_value = {"data": [[0.1, 0.2, 0.3]]}
        mock_env.VECTORIZE.upsert.side_effect = Exception("Vectorize index error")
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 500
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "error" in response_data
        assert "vectorize" in response_data["error"].lower()
    
    @pytest.mark.asyncio
    async def test_worker_can_delete_knowledge_embeddings(self, mock_env, mock_request):
        """Test that worker can delete knowledge from Vectorize"""
        # Arrange
        delete_data = {
            "action": "delete_knowledge",
            "data": {
                "knowledge_ids": ["obsolete-001", "obsolete-002"]
            }
        }
        mock_request.json.return_value = delete_data
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["deleted_count"] == 2
        
        # Verify Vectorize delete was called
        mock_env.VECTORIZE.delete.assert_called_once_with(["obsolete-001", "obsolete-002"])
    
    @pytest.mark.asyncio
    async def test_worker_can_filter_search_by_metadata(self, mock_env, mock_request):
        """Test that worker can filter vector search by metadata"""
        # Arrange
        filtered_search_data = {
            "action": "search_knowledge",
            "data": {
                "query": "How to use tools?",
                "top_k": 5,
                "filter": {
                    "robot": "pirate",
                    "category": "tools"
                }
            }
        }
        mock_request.json.return_value = filtered_search_data
        
        # Mock embedding and filtered results
        mock_env.AI.run.return_value = {"data": [[0.3, 0.4, 0.5]]}
        mock_env.VECTORIZE.query.return_value = {
            "matches": [
                {
                    "id": "pirate-tool-001",
                    "score": 0.89,
                    "metadata": {
                        "content": "Arr, the email tool be like a message in a bottle!",
                        "robot": "pirate",
                        "category": "tools"
                    }
                }
            ]
        }
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert len(response_data["results"]) == 1
        assert response_data["results"][0]["metadata"]["robot"] == "pirate"
        
        # Verify filter was passed to query
        query_call = mock_env.VECTORIZE.query.call_args
        assert "filter" in query_call[1]
    
    @pytest.mark.asyncio
    async def test_worker_can_batch_store_embeddings(self, mock_env, mock_request):
        """Test that worker can batch store multiple embeddings efficiently"""
        # Arrange
        batch_data = {
            "action": "batch_store_knowledge",
            "data": {
                "knowledge_items": [
                    {
                        "id": "batch-001",
                        "content": "First knowledge item",
                        "metadata": {"type": "fact"}
                    },
                    {
                        "id": "batch-002",
                        "content": "Second knowledge item",
                        "metadata": {"type": "rule"}
                    },
                    {
                        "id": "batch-003",
                        "content": "Third knowledge item",
                        "metadata": {"type": "example"}
                    }
                ]
            }
        }
        mock_request.json.return_value = batch_data
        
        # Mock batch embedding generation
        mock_env.AI.run.side_effect = [
            {"data": [[0.1, 0.2]]},
            {"data": [[0.3, 0.4]]},
            {"data": [[0.5, 0.6]]}
        ]
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.body)
        assert response_data["success"] is True
        assert response_data["stored_count"] == 3
        
        # Verify batch upsert
        mock_env.VECTORIZE.upsert.assert_called_once()
        upsert_items = mock_env.VECTORIZE.upsert.call_args[0][0]
        assert len(upsert_items) == 3
        assert upsert_items[0]["id"] == "batch-001"
        assert upsert_items[2]["metadata"]["type"] == "example"
    
    @pytest.mark.asyncio
    async def test_worker_validates_embedding_dimensions(self, mock_env, mock_request):
        """Test that worker validates embedding dimensions match index"""
        # Arrange
        knowledge_data = {
            "action": "store_knowledge",
            "data": {
                "knowledge_id": "dim-test",
                "content": "Test content",
                "metadata": {"type": "test"}
            }
        }
        mock_request.json.return_value = knowledge_data
        
        # Mock AI returns wrong dimension embedding (expecting 768)
        mock_env.AI.run.return_value = {"data": [[0.1, 0.2]]}  # Only 2 dimensions
        
        # Act
        response = await handle_request(mock_request, mock_env)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.body)
        assert response_data["success"] is False
        assert "dimension" in response_data["error"].lower()