"""
Vercel serverless entry point for Robot Brain FastAPI application.
This file is specifically for Vercel deployment and imports our main FastAPI app.
"""

import os
import sys
from pathlib import Path

# Add the src directory to Python path for imports
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

# Set environment to production for Vercel
os.environ.setdefault("ENVIRONMENT", "production")

# Import our FastAPI application
try:
    from api.main import app
except ImportError as e:
    # Fallback import in case of path issues
    try:
        from src.api.main import app
    except ImportError:
        # Create a minimal FastAPI app as fallback
        from fastapi import FastAPI
        app = FastAPI(title="Robot Brain", description="AI-powered chat system")
        
        @app.get("/")
        async def root():
            return {"message": "Robot Brain is starting up on Vercel..."}
        
        @app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "service": "robot_brain",
                "environment": "vercel_serverless",
                "message": "Robot Brain is running on Vercel!"
            }

# This is what Vercel will use as the ASGI application
# The app object must be available at module level
if __name__ == "__main__":
    # This won't run on Vercel but useful for local testing
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
