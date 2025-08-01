#!/usr/bin/env python3
"""
🟢 TDD GREEN Phase: Context7 Neon Best Practices Hook
Validates Neon PostgreSQL connection patterns follow Context7 recommendations.
"""
import re
import sys
from typing import List, Dict, Any


def validate_neon_connection_strings(connection_strings: List[str]) -> bool:
    """
    Validate that Neon connection strings follow Context7 best practices.
    
    Based on Context7 research:
    - Should use -pooler endpoints for production
    - Should include sslmode=require
    - Should include channel_binding=require for security
    """
    if not connection_strings:
        return True
    
    for conn_str in connection_strings:
        # Check for pooler endpoint (Context7 best practice)
        if "-pooler" not in conn_str:
            print(f"❌ Connection string should use -pooler endpoint: {conn_str}")
            print("   Context7 Best Practice: Use pooled connections for production")
            return False
        
        # Check for SSL requirements
        if "sslmode=require" not in conn_str:
            print(f"❌ Connection string missing sslmode=require: {conn_str}")
            return False
        
        # Check for channel binding (security best practice)
        if "channel_binding=require" not in conn_str:
            print(f"⚠️  Consider adding channel_binding=require for enhanced security")
    
    return True


def scan_codebase_for_connection_strings(file_paths: List[str] = None) -> List[str]:
    """Scan codebase for Neon connection strings."""
    import os
    import glob
    
    connection_strings = []
    
    if file_paths is None:
        # Scan common file types
        file_patterns = [
            "**/*.py", "**/*.js", "**/*.ts", "**/*.env*", 
            "**/*.yaml", "**/*.yml", "**/*.json"
        ]
        file_paths = []
        for pattern in file_patterns:
            file_paths.extend(glob.glob(pattern, recursive=True))
    
    # Regex to find PostgreSQL connection strings
    connection_regex = re.compile(r'postgresql://[^"\s]+\.neon\.tech/[^"\s]+')
    
    for file_path in file_paths:
        try:
            if os.path.isfile(file_path):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = connection_regex.findall(content)
                    connection_strings.extend(matches)
        except Exception as e:
            print(f"⚠️  Could not scan {file_path}: {e}")
    
    return list(set(connection_strings))  # Remove duplicates


def check_neon_best_practices() -> Dict[str, Any]:
    """
    Main function to check Neon best practices based on Context7 research.
    """
    print("🔍 Checking Neon PostgreSQL best practices (Context7)...")
    
    results = {
        "connection_strings_found": [],
        "violations": [],
        "recommendations": [],
        "passed": True
    }
    
    # Scan for connection strings
    connection_strings = scan_codebase_for_connection_strings()
    results["connection_strings_found"] = connection_strings
    
    if not connection_strings:
        print("ℹ️  No Neon connection strings found in codebase")
        return results
    
    print(f"📊 Found {len(connection_strings)} Neon connection string(s)")
    
    # Validate connection strings
    if not validate_neon_connection_strings(connection_strings):
        results["passed"] = False
        results["violations"].append("Connection strings don't follow Context7 best practices")
    
    # Additional Context7 recommendations
    results["recommendations"].extend([
        "Use connection pooling (-pooler endpoints) for production",
        "Set appropriate connection limits in DATABASE_URL",
        "Implement retry logic for scale-to-zero scenarios",
        "Monitor connection usage with pg_stat_activity"
    ])
    
    if results["passed"]:
        print("✅ All Neon connection strings follow Context7 best practices!")
    else:
        print("❌ Some violations found. Please review Context7 recommendations.")
    
    return results


if __name__ == "__main__":
    results = check_neon_best_practices()
    sys.exit(0 if results["passed"] else 1)