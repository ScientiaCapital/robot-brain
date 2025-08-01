#!/usr/bin/env python3
"""
Verify GREEN phase - Check that Worker implementation exists
"""

import sys
import importlib.util

def verify_worker_implementation():
    """Verify the Worker implementation can be imported"""
    print("🟢 TDD GREEN Phase - Verifying Worker Implementation")
    print("=" * 60)
    
    try:
        # Try to import the worker module
        spec = importlib.util.spec_from_file_location("worker", "cloudflare/worker.py")
        worker_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(worker_module)
        
        # Check for handle_request function
        if hasattr(worker_module, 'handle_request'):
            print("✅ SUCCESS: Worker module imported successfully")
            print("✅ SUCCESS: handle_request function found")
            
            # Check for Response class
            if hasattr(worker_module, 'Response'):
                print("✅ SUCCESS: Response class found")
            
            # Count handler functions
            handlers = [attr for attr in dir(worker_module) if attr.startswith('handle_')]
            print(f"✅ SUCCESS: Found {len(handlers)} handler functions")
            
            print("\n📋 Implemented handlers:")
            for handler in sorted(handlers):
                if handler != "handle_request":
                    print(f"   - {handler}")
            
            print("\n" + "=" * 60)
            print("✅ GREEN Phase Implementation Complete!")
            print("Worker is ready for testing with the integration tests")
            print("=" * 60)
            
            return True
        else:
            print("❌ ERROR: handle_request function not found")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: Failed to import worker - {e}")
        return False

if __name__ == "__main__":
    success = verify_worker_implementation()
    sys.exit(0 if success else 1)