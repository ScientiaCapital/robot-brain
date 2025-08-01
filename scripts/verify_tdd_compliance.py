#!/usr/bin/env python3
"""
🟢 TDD GREEN Phase: TDD Workflow Compliance Checker
Validates that development follows TDD principles: RED → GREEN → REFACTOR
"""
import os
import re
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple


def check_test_coverage(new_files: List[str], test_files: List[str]) -> bool:
    """
    Check if new Python files have corresponding test files.
    
    TDD Principle: Every new feature should have tests written first.
    """
    if not new_files:
        return True
    
    python_files = [f for f in new_files if f.endswith('.py') and not f.startswith('test_')]
    
    if not python_files:
        return True  # No Python implementation files to check
    
    # Check if we have corresponding test files
    for py_file in python_files:
        # Convert implementation file path to expected test file path
        expected_test_patterns = [
            f"test_{Path(py_file).stem}.py",
            f"tests/test_{Path(py_file).stem}.py",
            f"test/{Path(py_file).stem}_test.py",
        ]
        
        has_test = False
        for pattern in expected_test_patterns:
            if any(pattern in test_file for test_file in test_files):
                has_test = True
                break
        
        if not has_test:
            print(f"❌ TDD Violation: {py_file} has no corresponding test file")
            print(f"   Expected one of: {expected_test_patterns}")
            return False
    
    return True


def validate_tdd_cycle(commit_info: Dict[str, Any]) -> bool:
    """
    Validate that commits follow RED → GREEN → REFACTOR cycle.
    
    TDD Principles:
    - Tests should be written before implementation
    - Commits should be atomic (single concern)
    - Test files should be committed before or with implementation
    """
    files = commit_info.get("files", [])
    
    if not files:
        return True
    
    test_files = [f for f in files if "test" in f.lower()]
    impl_files = [f for f in files if f.endswith('.py') and "test" not in f.lower()]
    
    # If we have implementation files, we should have test files
    if impl_files and not test_files:
        print("❌ TDD Violation: Implementation files without tests")
        print("   TDD requires writing tests first (RED phase)")
        return False
    
    # Check for TDD cycle indicators in commit message
    commit_msg = commit_info.get("message", "")
    tdd_indicators = ["test", "red", "green", "refactor", "tdd"]
    
    if impl_files and not any(indicator in commit_msg.lower() for indicator in tdd_indicators):
        print("⚠️  Consider adding TDD phase indicator to commit message")
        print("   Examples: '[RED]', '[GREEN]', '[REFACTOR]', or 'TDD:'")
    
    return True


def get_git_staged_files() -> List[str]:
    """Get list of files staged for commit."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except subprocess.CalledProcessError:
        return []


def get_recent_commit_info() -> Dict[str, Any]:
    """Get information about the most recent commit."""
    try:
        # Get commit message
        msg_result = subprocess.run(
            ["git", "log", "-1", "--pretty=format:%s"],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Get changed files
        files_result = subprocess.run(
            ["git", "log", "-1", "--name-only", "--pretty=format:"],
            capture_output=True,
            text=True,
            check=True
        )
        
        files = [f for f in files_result.stdout.strip().split('\n') if f.strip()]
        
        return {
            "message": msg_result.stdout.strip(),
            "files": files
        }
    except subprocess.CalledProcessError:
        return {"message": "", "files": []}


def run_tests_and_check_status() -> Tuple[bool, str]:
    """Run tests and return status."""
    try:
        result = subprocess.run(
            ["python", "-m", "pytest", "-x", "--tb=short"],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        passed = result.returncode == 0
        output = result.stdout + result.stderr
        
        return passed, output
    except subprocess.TimeoutExpired:
        return False, "Tests timed out after 5 minutes"
    except subprocess.CalledProcessError as e:
        return False, f"Test execution failed: {e}"


def check_tdd_compliance() -> Dict[str, Any]:
    """
    Main TDD compliance checker.
    """
    print("🔍 Checking TDD workflow compliance...")
    
    results = {
        "staged_files": [],
        "test_coverage_passed": True,
        "tdd_cycle_passed": True,
        "tests_passing": True,
        "violations": [],
        "recommendations": [],
        "passed": True
    }
    
    # Get staged files (pre-commit hook context)
    staged_files = get_git_staged_files()
    results["staged_files"] = staged_files
    
    if staged_files:
        print(f"📊 Found {len(staged_files)} staged file(s)")
        
        # Check test coverage
        test_files = [f for f in staged_files if "test" in f.lower()]
        impl_files = [f for f in staged_files if f.endswith('.py') and "test" not in f.lower()]
        
        if not check_test_coverage(impl_files, test_files):
            results["test_coverage_passed"] = False
            results["passed"] = False
            results["violations"].append("Missing test coverage for new files")
        
        # Check TDD cycle compliance
        commit_info = {"files": staged_files, "message": ""}
        if not validate_tdd_cycle(commit_info):
            results["tdd_cycle_passed"] = False
            results["passed"] = False
            results["violations"].append("TDD cycle not followed")
    
    # Run tests to ensure they pass
    print("\n🧪 Running tests to verify GREEN phase...")
    tests_passed, test_output = run_tests_and_check_status()
    results["tests_passing"] = tests_passed
    
    if not tests_passed:
        results["passed"] = False
        results["violations"].append("Tests are not passing")
        print("❌ Tests failed - commit violates GREEN phase of TDD")
        print(test_output[-1000:])  # Last 1000 chars of output
    else:
        print("✅ All tests passing - GREEN phase validated")
    
    # TDD recommendations
    results["recommendations"].extend([
        "Follow RED → GREEN → REFACTOR cycle",
        "Write tests before implementation",
        "Keep commits atomic and focused",
        "Include TDD phase in commit messages",
        "Ensure all tests pass before committing"
    ])
    
    if results["passed"]:
        print("\n✅ TDD workflow compliance verified!")
    else:
        print("\n❌ TDD violations found. Please address before committing.")
        for violation in results["violations"]:
            print(f"   - {violation}")
    
    return results


if __name__ == "__main__":
    results = check_tdd_compliance()
    sys.exit(0 if results["passed"] else 1)