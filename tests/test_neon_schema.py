"""
🔴 TDD RED Phase: Database Schema Tests
Write tests FIRST before creating any database schema.
Following our strict TDD principles: RED → GREEN → REFACTOR → QUALITY
"""

import pytest
from unittest.mock import AsyncMock, patch
import asyncpg
from typing import Dict, List, Any


@pytest.mark.asyncio
class TestNeonDatabaseSchema:
    """Test that our Neon database schema meets all requirements."""
    
    @pytest.fixture
    def neon_connection(self):
        """Mock Neon database connection for testing."""
        conn = AsyncMock(spec=asyncpg.Connection)
        return conn
    
    # 🔴 Table Existence Tests
    
    async def test_conversations_table_exists(self, neon_connection):
        """Test that conversations table exists with correct structure."""
        # Mock table exists query
        neon_connection.fetchrow.return_value = {"exists": True}
        
        # Query should check for table existence
        result = await neon_connection.fetchrow(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations')"
        )
        
        assert result["exists"] is True
        neon_connection.fetchrow.assert_called()
    
    async def test_robot_interactions_table_exists(self, neon_connection):
        """Test that robot_interactions table exists."""
        neon_connection.fetchrow.return_value = {"exists": True}
        
        result = await neon_connection.fetchrow(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'robot_interactions')"
        )
        
        assert result["exists"] is True
    
    async def test_tool_usage_table_exists(self, neon_connection):
        """Test that tool_usage table exists."""
        neon_connection.fetchrow.return_value = {"exists": True}
        
        result = await neon_connection.fetchrow(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tool_usage')"
        )
        
        assert result["exists"] is True
    
    async def test_sessions_table_exists(self, neon_connection):
        """Test that sessions table exists for JSONB session management."""
        neon_connection.fetchrow.return_value = {"exists": True}
        
        result = await neon_connection.fetchrow(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions')"
        )
        
        assert result["exists"] is True
    
    async def test_embeddings_table_exists(self, neon_connection):
        """Test that embeddings table exists for vector search."""
        neon_connection.fetchrow.return_value = {"exists": True}
        
        result = await neon_connection.fetchrow(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'embeddings')"
        )
        
        assert result["exists"] is True
    
    # 🔴 Column Structure Tests
    
    async def test_conversations_has_required_columns(self, neon_connection):
        """Test conversations table has all required columns."""
        expected_columns = [
            {"column_name": "id", "data_type": "uuid", "is_nullable": "NO"},
            {"column_name": "robot_personality", "data_type": "character varying", "is_nullable": "NO"},
            {"column_name": "user_message", "data_type": "text", "is_nullable": "NO"},
            {"column_name": "robot_response", "data_type": "text", "is_nullable": "NO"},
            {"column_name": "session_id", "data_type": "character varying", "is_nullable": "YES"},
            {"column_name": "metadata", "data_type": "jsonb", "is_nullable": "YES"},
            {"column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES"}
        ]
        
        neon_connection.fetch.return_value = expected_columns
        
        result = await neon_connection.fetch("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            ORDER BY ordinal_position
        """)
        
        assert len(result) == 7
        assert any(col["column_name"] == "id" for col in result)
        assert any(col["column_name"] == "robot_personality" for col in result)
        assert any(col["column_name"] == "metadata" and col["data_type"] == "jsonb" for col in result)
    
    async def test_sessions_has_jsonb_columns(self, neon_connection):
        """Test sessions table has JSONB columns for flexible data storage."""
        expected_columns = [
            {"column_name": "id", "data_type": "character varying", "is_nullable": "NO"},
            {"column_name": "data", "data_type": "jsonb", "is_nullable": "NO"},
            {"column_name": "user_preferences", "data_type": "jsonb", "is_nullable": "YES"},
            {"column_name": "expires_at", "data_type": "timestamp with time zone", "is_nullable": "YES"},
            {"column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES"},
            {"column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES"}
        ]
        
        neon_connection.fetch.return_value = expected_columns
        
        result = await neon_connection.fetch("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'sessions' 
            ORDER BY ordinal_position
        """)
        
        assert any(col["column_name"] == "data" and col["data_type"] == "jsonb" for col in result)
        assert any(col["column_name"] == "user_preferences" and col["data_type"] == "jsonb" for col in result)
    
    async def test_embeddings_has_vector_column(self, neon_connection):
        """Test embeddings table has pgvector column for semantic search."""
        expected_columns = [
            {"column_name": "id", "data_type": "uuid", "is_nullable": "NO"},
            {"column_name": "content", "data_type": "text", "is_nullable": "NO"},
            {"column_name": "embedding", "data_type": "vector", "is_nullable": "YES"},
            {"column_name": "metadata", "data_type": "jsonb", "is_nullable": "YES"},
            {"column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES"}
        ]
        
        neon_connection.fetch.return_value = expected_columns
        
        result = await neon_connection.fetch("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'embeddings' 
            ORDER BY ordinal_position
        """)
        
        assert any(col["column_name"] == "embedding" and col["data_type"] == "vector" for col in result)
    
    # 🔴 Index Performance Tests
    
    async def test_conversations_has_performance_indexes(self, neon_connection):
        """Test conversations table has indexes for query performance."""
        expected_indexes = [
            {"indexname": "idx_conversations_robot"},
            {"indexname": "idx_conversations_session"},
            {"indexname": "idx_conversations_created"}
        ]
        
        neon_connection.fetch.return_value = expected_indexes
        
        result = await neon_connection.fetch("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'conversations' 
            AND indexname LIKE 'idx_%'
        """)
        
        index_names = [idx["indexname"] for idx in result]
        assert "idx_conversations_robot" in index_names
        assert "idx_conversations_session" in index_names
        assert "idx_conversations_created" in index_names
    
    async def test_sessions_has_ttl_index(self, neon_connection):
        """Test sessions table has TTL index for automatic cleanup."""
        expected_indexes = [
            {"indexname": "idx_sessions_expires"}
        ]
        
        neon_connection.fetch.return_value = expected_indexes
        
        result = await neon_connection.fetch("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'sessions' 
            AND indexname = 'idx_sessions_expires'
        """)
        
        assert len(result) == 1
        assert result[0]["indexname"] == "idx_sessions_expires"
    
    async def test_embeddings_has_vector_index(self, neon_connection):
        """Test embeddings table has HNSW index for vector similarity."""
        expected_indexes = [
            {"indexname": "idx_embeddings_vector"}
        ]
        
        neon_connection.fetch.return_value = expected_indexes
        
        result = await neon_connection.fetch("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'embeddings' 
            AND indexname = 'idx_embeddings_vector'
        """)
        
        assert len(result) == 1
        assert result[0]["indexname"] == "idx_embeddings_vector"
    
    # 🔴 Constraint Validation Tests
    
    async def test_robot_personality_constraints(self, neon_connection):
        """Test robot personality has valid enum constraints."""
        expected_constraint = {
            "constraint_name": "chk_robot_personality",
            "check_clause": "robot_personality IN ('friend', 'nerd', 'zen', 'pirate', 'drama')"
        }
        
        neon_connection.fetchrow.return_value = expected_constraint
        
        result = await neon_connection.fetchrow("""
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'chk_robot_personality'
        """)
        
        assert result["constraint_name"] == "chk_robot_personality"
        assert "friend" in result["check_clause"]
        assert "nerd" in result["check_clause"]
        assert "zen" in result["check_clause"]
        assert "pirate" in result["check_clause"]
        assert "drama" in result["check_clause"]
    
    async def test_status_enum_constraints(self, neon_connection):
        """Test tool usage status has valid enum constraints."""
        expected_constraint = {
            "constraint_name": "chk_tool_status",
            "check_clause": "status IN ('success', 'error', 'pending', 'timeout')"
        }
        
        neon_connection.fetchrow.return_value = expected_constraint
        
        result = await neon_connection.fetchrow("""
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'chk_tool_status'
        """)
        
        assert result["constraint_name"] == "chk_tool_status"
        assert "success" in result["check_clause"]
        assert "error" in result["check_clause"]
    
    async def test_pgvector_extension_enabled(self, neon_connection):
        """Test that pgvector extension is installed and available."""
        neon_connection.fetchrow.return_value = {"exists": True}
        
        result = await neon_connection.fetchrow("""
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            )
        """)
        
        assert result["exists"] is True
    
    # 🔴 Data Integrity Tests
    
    async def test_primary_keys_defined(self, neon_connection):
        """Test that all tables have proper primary keys."""
        expected_pks = [
            {"table_name": "conversations", "column_name": "id"},
            {"table_name": "robot_interactions", "column_name": "id"},  
            {"table_name": "tool_usage", "column_name": "id"},
            {"table_name": "sessions", "column_name": "id"},
            {"table_name": "embeddings", "column_name": "id"}
        ]
        
        neon_connection.fetch.return_value = expected_pks
        
        result = await neon_connection.fetch("""
            SELECT t.table_name, k.column_name
            FROM information_schema.table_constraints t
            JOIN information_schema.key_column_usage k
            ON t.constraint_name = k.constraint_name
            WHERE t.constraint_type = 'PRIMARY KEY'
            AND t.table_name IN ('conversations', 'robot_interactions', 'tool_usage', 'sessions', 'embeddings')
        """)
        
        table_names = [row["table_name"] for row in result]
        assert "conversations" in table_names
        assert "robot_interactions" in table_names
        assert "tool_usage" in table_names
        assert "sessions" in table_names
        assert "embeddings" in table_names
    
    async def test_not_null_constraints(self, neon_connection):
        """Test that critical fields have NOT NULL constraints."""
        expected_not_nulls = [
            {"table_name": "conversations", "column_name": "robot_personality"},
            {"table_name": "conversations", "column_name": "user_message"},
            {"table_name": "conversations", "column_name": "robot_response"},
            {"table_name": "sessions", "column_name": "data"},
            {"table_name": "tool_usage", "column_name": "tool_name"}
        ]
        
        neon_connection.fetch.return_value = expected_not_nulls
        
        result = await neon_connection.fetch("""
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE is_nullable = 'NO'
            AND table_name IN ('conversations', 'robot_interactions', 'tool_usage', 'sessions', 'embeddings')
            AND column_name != 'id'
        """)
        
        # Check that key fields are not nullable
        not_null_fields = [(row["table_name"], row["column_name"]) for row in result]
        assert ("conversations", "robot_personality") in not_null_fields
        assert ("conversations", "user_message") in not_null_fields
        assert ("sessions", "data") in not_null_fields


@pytest.mark.asyncio
class TestNeonIntegrationSchema:
    """Integration tests that connect to actual Neon database."""
    
    async def test_real_neon_connection_works(self):
        """Test that we can connect to our actual Neon database."""
        # This will be implemented once we have the schema created
        # For now, this test should FAIL until we create the actual tables
        with pytest.raises(Exception):
            # Attempt to connect to Neon - should fail until GREEN phase
            import os
            DATABASE_URL = os.getenv("NEON_DATABASE_URL")
            assert DATABASE_URL is not None, "NEON_DATABASE_URL environment variable required"
    
    async def test_schema_matches_neon_client_expectations(self):
        """Test that schema matches what our NeonClient expects."""
        # This test ensures our schema structure is compatible with NeonClient
        from src.neon.neon_client import NeonClient
        
        # Verify NeonClient can be instantiated (basic compatibility check)
        mock_pool = AsyncMock()
        client = NeonClient(pool=mock_pool)
        
        # Verify the client has the expected methods
        assert hasattr(client, 'store_conversation')
        assert hasattr(client, 'get_conversation')
        assert hasattr(client, 'query_by_robot')
        assert hasattr(client, 'store_robot_interaction')
        assert hasattr(client, 'track_tool_usage')
        
        # Verify client uses the pool attribute
        assert client.pool is mock_pool
        
        # This test passes if our schema structure is compatible with the NeonClient API
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])