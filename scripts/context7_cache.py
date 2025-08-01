#!/usr/bin/env python3
"""
🟢 TDD GREEN Phase: Context7 API Response Cache
Caches Context7 API responses for performance during development.
"""
import json
import os
import time
from pathlib import Path
from typing import Optional, Dict, Any


CACHE_DIR = Path(".context7_cache")
CACHE_EXPIRY_HOURS = 24


def get_cache_file_path(library: str, topic: str) -> Path:
    """Get the cache file path for a library/topic combination."""
    CACHE_DIR.mkdir(exist_ok=True)
    safe_library = library.replace("/", "_").replace(":", "_")
    safe_topic = topic.replace("/", "_").replace(" ", "_")
    return CACHE_DIR / f"{safe_library}_{safe_topic}.json"


def is_cache_valid(cache_file: Path) -> bool:
    """Check if cache file exists and is not expired."""
    if not cache_file.exists():
        return False
    
    # Check if cache is expired (24 hours)
    file_age = time.time() - cache_file.stat().st_mtime
    return file_age < (CACHE_EXPIRY_HOURS * 3600)


def get_cached_docs(library: str, topic: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached Context7 documentation if available and valid."""
    cache_file = get_cache_file_path(library, topic)
    
    if not is_cache_valid(cache_file):
        return None
    
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
            return cached_data.get("data")
    except Exception as e:
        print(f"⚠️  Error reading cache file {cache_file}: {e}")
        return None


def cache_context7_response(library: str, topic: str, data: Dict[str, Any]) -> bool:
    """Cache Context7 API response data."""
    cache_file = get_cache_file_path(library, topic)
    
    try:
        cache_data = {
            "timestamp": time.time(),
            "library": library,
            "topic": topic,
            "data": data
        }
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"⚠️  Error writing cache file {cache_file}: {e}")
        return False


def clear_cache(library: str = None, topic: str = None) -> int:
    """Clear cache files. If library/topic specified, clear only those."""
    if not CACHE_DIR.exists():
        return 0
    
    files_removed = 0
    
    if library and topic:
        # Clear specific cache
        cache_file = get_cache_file_path(library, topic)
        if cache_file.exists():
            cache_file.unlink()
            files_removed = 1
    else:
        # Clear all cache files
        for cache_file in CACHE_DIR.glob("*.json"):
            cache_file.unlink()
            files_removed += 1
    
    return files_removed


def get_cache_info() -> Dict[str, Any]:
    """Get information about current cache state."""
    if not CACHE_DIR.exists():
        return {"cache_dir_exists": False, "files": []}
    
    cache_files = []
    total_size = 0
    
    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            file_stat = cache_file.stat()
            cache_files.append({
                "file": cache_file.name,
                "size": file_stat.st_size,
                "modified": time.ctime(file_stat.st_mtime),
                "valid": is_cache_valid(cache_file)
            })
            total_size += file_stat.st_size
        except Exception:
            continue
    
    return {
        "cache_dir_exists": True,
        "total_files": len(cache_files),
        "total_size_bytes": total_size,
        "files": cache_files
    }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "info":
            info = get_cache_info()
            print(f"Cache directory: {CACHE_DIR}")
            print(f"Total files: {info['total_files']}")
            print(f"Total size: {info['total_size_bytes']} bytes")
            
            for file_info in info['files']:
                status = "✅ Valid" if file_info['valid'] else "❌ Expired"
                print(f"  {file_info['file']} - {status} - {file_info['size']} bytes")
        
        elif command == "clear":
            removed = clear_cache()
            print(f"Cleared {removed} cache file(s)")
        
        else:
            print("Usage: python context7_cache.py [info|clear]")
    
    else:
        print("Context7 cache utility - use 'info' or 'clear' commands")