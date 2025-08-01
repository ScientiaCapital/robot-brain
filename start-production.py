#!/usr/bin/env python3
"""
Production startup script for Robot Brain.
🔧 REFACTOR Phase: Production server startup with Context7 best practices.
"""

import os
import sys
import multiprocessing
from pathlib import Path

# Add src to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Load production environment
from src.core.config_loader import load_environment_file
load_environment_file(".env.production")

# Import the production app factory
from src.api.main import create_production_app

# Create production app instance
app = create_production_app()

def get_worker_count() -> int:
    """
    Calculate optimal worker count based on Context7 recommendations.
    """
    workers = os.getenv("WORKERS")
    if workers:
        return int(workers)
    
    # Context7 pattern: (2 x CPU cores) + 1
    return (2 * multiprocessing.cpu_count()) + 1

def get_bind_address() -> str:
    """
    Get bind address for production server.
    """
    host = os.getenv("HOST", "0.0.0.0")
    port = os.getenv("PORT", "8000")
    return f"{host}:{port}"

def main():
    """
    Main entry point for production server.
    """
    import gunicorn.app.wsgiapp as wsgi
    
    # Gunicorn configuration
    workers = get_worker_count()
    bind_addr = get_bind_address()
    
    # Context7 production configuration
    gunicorn_config = {
        'bind': bind_addr,
        'workers': workers,
        'worker_class': 'uvicorn.workers.UvicornWorker',
        'worker_connections': 1000,
        'max_requests': 1000,
        'max_requests_jitter': 100,
        'timeout': 30,
        'keepalive': 5,
        'preload_app': True,
        'access_logfile': '-',
        'error_logfile': '-',
        'log_level': os.getenv('LOG_LEVEL', 'info').lower(),
        'capture_output': True,
        'enable_stdio_inheritance': True,
    }
    
    print(f"🚀 Starting Robot Brain Production Server")
    print(f"Workers: {workers}")
    print(f"Bind: {bind_addr}")
    print(f"Worker class: uvicorn.workers.UvicornWorker")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'production')}")
    print("-" * 50)
    
    # Start Gunicorn application
    from gunicorn.app.base import Application
    
    class StandaloneApplication(Application):
        def __init__(self, app, options=None):
            self.options = options or {}
            self.application = app
            super().__init__()
        
        def load_config(self):
            for key, value in self.options.items():
                self.cfg.set(key.lower(), value)
        
        def load(self):
            return self.application
    
    StandaloneApplication(app, gunicorn_config).run()

if __name__ == "__main__":
    main()