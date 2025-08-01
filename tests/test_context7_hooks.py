"""
🔴 TDD RED Phase: Context7 Integration Hooks Tests
These tests will initially FAIL until we implement the hooks system.
"""
import pytest
import subprocess
import os
from pathlib import Path


class TestContext7Hooks:
    """Test suite for Context7 integration hooks following TDD principles."""
    
    def test_context7_neon_check_hook_exists(self):
        """Test that Context7 Neon best practices hook exists."""
        hook_path = Path("scripts/context7_neon_check.py")
        assert hook_path.exists(), "Context7 Neon check hook should exist"
    
    def test_context7_langgraph_check_hook_exists(self):
        """Test that Context7 LangGraph patterns hook exists."""
        hook_path = Path("scripts/context7_langgraph_check.py")
        assert hook_path.exists(), "Context7 LangGraph check hook should exist"
    
    def test_context7_fastapi_check_hook_exists(self):
        """Test that Context7 FastAPI production hook exists."""
        hook_path = Path("scripts/context7_fastapi_check.py")
        assert hook_path.exists(), "Context7 FastAPI check hook should exist"
    
    def test_context7_hooks_are_executable(self):
        """Test that all Context7 hooks are executable."""
        hooks = [
            "scripts/context7_neon_check.py",
            "scripts/context7_langgraph_check.py", 
            "scripts/context7_fastapi_check.py"
        ]
        for hook in hooks:
            hook_path = Path(hook)
            if hook_path.exists():
                assert os.access(hook_path, os.X_OK), f"{hook} should be executable"
    
    def test_neon_connection_string_validation(self):
        """Test that hook validates Neon connection strings use pooler endpoints."""
        # This should fail initially - we need to implement the validation logic
        from scripts.context7_neon_check import validate_neon_connection_strings
        
        # Valid pooled connection string (with proper SSL parameters)
        valid_conn = "postgresql://user:pass@ep-test-pooler.region.aws.neon.tech/db?sslmode=require&channel_binding=require"
        assert validate_neon_connection_strings([valid_conn]) == True
        
        # Invalid direct connection string (should trigger Context7 best practices)
        invalid_conn = "postgresql://user:pass@ep-test.region.aws.neon.tech/db?sslmode=require"
        assert validate_neon_connection_strings([invalid_conn]) == False
    
    def test_langgraph_supervisor_pattern_validation(self):
        """Test that hook validates LangGraph follows supervisor patterns."""
        from scripts.context7_langgraph_check import validate_supervisor_patterns
        
        # Valid supervisor pattern with Command objects
        valid_pattern = '''
        def supervisor(state: MessagesState) -> Command[Literal["agent_1", "agent_2", END]]:
            response = model.invoke(...)
            return Command(goto=response["next_agent"])
        '''
        assert validate_supervisor_patterns(valid_pattern) == True
        
        # Invalid pattern without Command usage
        invalid_pattern = '''
        def supervisor(state):
            return "agent_1" 
        '''
        assert validate_supervisor_patterns(invalid_pattern) == False
    
    def test_fastapi_production_patterns_validation(self):
        """Test that hook validates FastAPI production deployment patterns."""
        from scripts.context7_fastapi_check import validate_production_patterns
        
        # Valid TestClient usage in tests
        valid_test_code = '''
        from fastapi.testclient import TestClient
        def test_endpoint():
            response = client.get("/test")
            assert response.status_code == 200
        '''
        assert validate_production_patterns(valid_test_code) == True
        
        # Missing test coverage should trigger validation
        code_without_tests = '''
        @app.get("/new-endpoint")
        def new_endpoint():
            return {"message": "test"}
        '''
        assert validate_production_patterns(code_without_tests) == False
    
    def test_pre_commit_integration(self):
        """Test that Context7 hooks integrate with pre-commit workflow."""
        # Check that pre-commit config includes our Context7 hooks
        pre_commit_config = Path(".pre-commit-config.yaml")
        if pre_commit_config.exists():
            config_content = pre_commit_config.read_text()
            assert "context7_neon_check" in config_content
            assert "context7_langgraph_check" in config_content
            assert "context7_fastapi_check" in config_content
    
    def test_context7_cache_functionality(self):
        """Test that Context7 API responses are cached for performance."""
        from scripts.context7_cache import get_cached_docs, cache_context7_response, clear_cache
        
        # Clear cache to ensure clean test state
        clear_cache("neon", "connection-pooling")
        
        # Cache should start empty
        cached_docs = get_cached_docs("neon", "connection-pooling")
        assert cached_docs is None
        
        # After caching, should retrieve successfully
        test_docs = {"patterns": ["use -pooler endpoints"]}
        cache_context7_response("neon", "connection-pooling", test_docs)
        
        cached_docs = get_cached_docs("neon", "connection-pooling")
        assert cached_docs == test_docs
    
    def test_makefile_context7_targets(self):
        """Test that Makefile includes Context7 integration targets."""
        makefile_path = Path("Makefile")
        if makefile_path.exists():
            makefile_content = makefile_path.read_text()
            assert "context7-check:" in makefile_content
            assert "context7-neon:" in makefile_content
            assert "context7-langgraph:" in makefile_content
            assert "context7-fastapi:" in makefile_content


class TestTDDWorkflowEnforcement:
    """Test that our hooks enforce TDD workflow compliance."""
    
    def test_tdd_compliance_checker_exists(self):
        """Test that TDD compliance checker script exists."""
        checker_path = Path("scripts/verify_tdd_compliance.py")
        assert checker_path.exists(), "TDD compliance checker should exist"
    
    def test_new_code_has_tests_validation(self):
        """Test that hook validates new code has corresponding tests."""
        from scripts.verify_tdd_compliance import check_test_coverage
        
        # New Python file should have corresponding test
        new_files = ["src/new_feature.py"]
        test_files = ["tests/test_new_feature.py"]
        assert check_test_coverage(new_files, test_files) == True
        
        # Missing test should fail validation
        missing_test_files = []
        assert check_test_coverage(new_files, missing_test_files) == False
    
    def test_red_green_refactor_cycle_validation(self):
        """Test that commits follow RED→GREEN→REFACTOR cycle."""
        from scripts.verify_tdd_compliance import validate_tdd_cycle
        
        # Commit with failing tests first should pass
        commit_with_tests = {
            "files": ["tests/test_feature.py", "src/feature.py"],
            "test_status": "added_failing_tests_first"
        }
        assert validate_tdd_cycle(commit_with_tests) == True
        
        # Implementation without tests first should fail
        implementation_first = {
            "files": ["src/feature.py"],
            "test_status": "no_tests"
        }
        assert validate_tdd_cycle(implementation_first) == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])