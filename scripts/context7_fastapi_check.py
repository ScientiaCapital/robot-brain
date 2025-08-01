#!/usr/bin/env python3
"""
🟢 TDD GREEN Phase: Context7 FastAPI Production Patterns Hook
Validates FastAPI implementations follow Context7 production best practices.
"""
import re
import ast
import sys
import os
from typing import List, Dict, Any


def validate_production_patterns(code_content: str) -> bool:
    """
    Validate FastAPI production patterns based on Context7 research.
    
    Context7 Best Practices:
    - Every endpoint should have corresponding tests
    - Use TestClient for testing 
    - Proper dependency override patterns for testing
    - Production-ready error handling
    """
    if not code_content.strip():
        return True
    
    violations = []
    
    # Check for TestClient usage in test files
    if "test_" in code_content or "Test" in code_content:
        if "TestClient" in code_content:
            print("✅ Using TestClient for FastAPI testing (Context7 pattern)")
        elif "@app." in code_content or "FastAPI" in code_content:
            violations.append("FastAPI tests should use TestClient")
    
    # Check for proper test structure
    if "def test_" in code_content:
        if "assert response.status_code" in code_content:
            print("✅ Testing HTTP status codes")
        if "assert response.json()" in code_content:
            print("✅ Testing JSON responses")
    
    # Check for dependency override patterns (Context7 best practice)
    if "dependency_overrides" in code_content:
        print("✅ Using dependency overrides for testing")
    
    # Check for endpoint definitions without tests
    endpoint_pattern = re.compile(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']')
    endpoints = endpoint_pattern.findall(code_content)
    
    if endpoints and "test_" not in code_content:
        violations.append(f"Found {len(endpoints)} endpoint(s) that may need tests")
    
    if violations:
        print("❌ FastAPI violations found:")
        for violation in violations:
            print(f"   - {violation}")
        return False
    
    return True


def find_fastapi_endpoints(file_content: str) -> List[Dict[str, str]]:
    """Extract FastAPI endpoints from file content."""
    endpoint_pattern = re.compile(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\'].*?\ndef\s+(\w+)')
    endpoints = []
    
    for match in endpoint_pattern.finditer(file_content):
        method, path, function_name = match.groups()
        endpoints.append({
            "method": method.upper(),
            "path": path,
            "function": function_name
        })
    
    return endpoints


def find_corresponding_tests(endpoint_function: str, test_files: List[str]) -> bool:
    """Check if an endpoint has corresponding tests."""
    test_pattern = re.compile(f'def test.*{endpoint_function}|def test.*{endpoint_function.replace("_", "")}', re.IGNORECASE)
    
    for test_file in test_files:
        try:
            if os.path.isfile(test_file):
                with open(test_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if test_pattern.search(content):
                        return True
        except Exception:
            continue
    
    return False


def scan_fastapi_code(file_paths: List[str] = None) -> Dict[str, Any]:
    """Scan codebase for FastAPI implementations."""
    import glob
    
    fastapi_files = []
    test_files = []
    
    if file_paths is None:
        # Scan Python files
        file_paths = glob.glob("**/*.py", recursive=True)
    
    for file_path in file_paths:
        try:
            if os.path.isfile(file_path):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    if "test_" in file_path or "test" in file_path.lower():
                        test_files.append(file_path)
                    
                    # Check if file contains FastAPI patterns
                    if any(keyword in content for keyword in [
                        "FastAPI", "@app.", "from fastapi", "TestClient"
                    ]):
                        fastapi_files.append({
                            "file_path": file_path,
                            "content": content,
                            "endpoints": find_fastapi_endpoints(content)
                        })
        except Exception as e:
            print(f"⚠️  Could not scan {file_path}: {e}")
    
    return {
        "fastapi_files": fastapi_files,
        "test_files": test_files
    }


def check_fastapi_best_practices() -> Dict[str, Any]:
    """
    Main function to check FastAPI best practices based on Context7 research.
    """
    print("🔍 Checking FastAPI production patterns (Context7)...")
    
    results = {
        "files_checked": [],
        "violations": [],
        "recommendations": [],
        "passed": True
    }
    
    # Scan for FastAPI code
    scan_results = scan_fastapi_code()
    fastapi_files = scan_results["fastapi_files"]
    test_files = scan_results["test_files"]
    
    results["files_checked"] = [f["file_path"] for f in fastapi_files]
    
    if not fastapi_files:
        print("ℹ️  No FastAPI code found in codebase")
        return results
    
    print(f"📊 Found {len(fastapi_files)} FastAPI file(s) and {len(test_files)} test file(s)")
    
    # Validate each file
    for file_info in fastapi_files:
        print(f"\n📁 Checking {file_info['file_path']}...")
        
        if not validate_production_patterns(file_info['content']):
            results["passed"] = False
            results["violations"].append(f"Violations in {file_info['file_path']}")
        
        # Check test coverage for endpoints
        endpoints = file_info['endpoints']
        if endpoints:
            print(f"   Found {len(endpoints)} endpoint(s)")
            for endpoint in endpoints:
                has_test = find_corresponding_tests(endpoint['function'], test_files)
                if has_test:
                    print(f"   ✅ {endpoint['method']} {endpoint['path']} has tests")
                else:
                    print(f"   ⚠️  {endpoint['method']} {endpoint['path']} may need tests")
    
    # Context7 recommendations
    results["recommendations"].extend([
        "Use TestClient for all endpoint testing",
        "Implement dependency overrides for test isolation",
        "Test both success and error scenarios",
        "Use proper status code assertions",
        "Test JSON response structures",
        "Implement proper error handling"
    ])
    
    if results["passed"]:
        print("\n✅ All FastAPI code follows Context7 best practices!")
    else:
        print("\n❌ Some violations found. Please review Context7 recommendations.")
    
    return results


if __name__ == "__main__":
    results = check_fastapi_best_practices()
    sys.exit(0 if results["passed"] else 1)