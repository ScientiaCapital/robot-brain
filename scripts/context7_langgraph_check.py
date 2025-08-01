#!/usr/bin/env python3
"""
🟢 TDD GREEN Phase: Context7 LangGraph Supervisor Patterns Hook
Validates LangGraph implementations follow Context7 supervisor best practices.
"""
import re
import ast
import sys
from typing import List, Dict, Any


def validate_supervisor_patterns(code_content: str) -> bool:
    """
    Validate LangGraph supervisor patterns based on Context7 research.
    
    Context7 Best Practices:
    - Use Command objects for flow control
    - Implement proper state management with MessagesState
    - Follow supervisor → agent → supervisor flow
    - Use proper typing with Literal for goto destinations
    """
    if not code_content.strip():
        return True
    
    violations = []
    
    # Check for Command usage (Context7 best practice)
    if "Command(" in code_content or "return Command" in code_content:
        print("✅ Using Command objects for flow control (Context7 pattern)")
    else:
        if "def supervisor" in code_content or "supervisor" in code_content.lower():
            violations.append("Supervisor should use Command objects for flow control")
    
    # Check for proper state typing
    if "MessagesState" in code_content:
        print("✅ Using MessagesState for proper state management")
    elif "StateGraph" in code_content:
        violations.append("Consider using MessagesState for standardized state management")
    
    # Check for proper typing with Literal
    if "Literal[" in code_content and ("END" in code_content or "__end__" in code_content):
        print("✅ Using proper type hints with Literal and END")
    elif "def supervisor" in code_content:
        violations.append("Supervisor should use Literal type hints for goto destinations")
    
    # Check for multi-agent patterns
    if "create_supervisor" in code_content:
        print("✅ Using create_supervisor helper (Context7 recommended)")
    elif "StateGraph" in code_content and "supervisor" in code_content.lower():
        print("ℹ️  Consider using create_supervisor helper for simpler implementation")
    
    if violations:
        print("❌ LangGraph violations found:")
        for violation in violations:
            print(f"   - {violation}")
        return False
    
    return True


def scan_langgraph_code(file_paths: List[str] = None) -> List[Dict[str, Any]]:
    """Scan codebase for LangGraph supervisor implementations."""
    import os
    import glob
    
    langgraph_files = []
    
    if file_paths is None:
        # Scan Python files for LangGraph usage
        file_patterns = ["**/*.py"]
        file_paths = []
        for pattern in file_patterns:
            file_paths.extend(glob.glob(pattern, recursive=True))
    
    for file_path in file_paths:
        try:
            if os.path.isfile(file_path):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Check if file contains LangGraph supervisor patterns
                    if any(keyword in content for keyword in [
                        "StateGraph", "supervisor", "langgraph", "Command", 
                        "create_supervisor", "MessagesState"
                    ]):
                        langgraph_files.append({
                            "file_path": file_path,
                            "content": content
                        })
        except Exception as e:
            print(f"⚠️  Could not scan {file_path}: {e}")
    
    return langgraph_files


def check_langgraph_best_practices() -> Dict[str, Any]:
    """
    Main function to check LangGraph best practices based on Context7 research.
    """
    print("🔍 Checking LangGraph supervisor patterns (Context7)...")
    
    results = {
        "files_checked": [],
        "violations": [],
        "recommendations": [],
        "passed": True
    }
    
    # Scan for LangGraph code
    langgraph_files = scan_langgraph_code()
    results["files_checked"] = [f["file_path"] for f in langgraph_files]
    
    if not langgraph_files:
        print("ℹ️  No LangGraph supervisor code found in codebase")
        return results
    
    print(f"📊 Found {len(langgraph_files)} file(s) with LangGraph patterns")
    
    # Validate each file
    for file_info in langgraph_files:
        print(f"\n📁 Checking {file_info['file_path']}...")
        if not validate_supervisor_patterns(file_info['content']):
            results["passed"] = False
            results["violations"].append(f"Violations in {file_info['file_path']}")
    
    # Context7 recommendations
    results["recommendations"].extend([
        "Use Command objects for explicit flow control",
        "Implement MessagesState for standardized state management", 
        "Use create_supervisor for simpler multi-agent setup",
        "Add proper type hints with Literal for destinations",
        "Follow supervisor → agent → supervisor pattern"
    ])
    
    if results["passed"]:
        print("\n✅ All LangGraph code follows Context7 best practices!")
    else:
        print("\n❌ Some violations found. Please review Context7 recommendations.")
    
    return results


if __name__ == "__main__":
    results = check_langgraph_best_practices()
    sys.exit(0 if results["passed"] else 1)