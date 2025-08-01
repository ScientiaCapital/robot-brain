#!/usr/bin/env python3
"""
Quick test script to verify API endpoints work locally.
Run with: python test_api_local.py
"""

import requests
import json

# Base URL for local API
BASE_URL = "http://localhost:8000"

def test_api():
    """Test the API endpoints."""
    
    print("🧪 Testing Robot Brain API...")
    
    # Test root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"\n✅ Root endpoint: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test tools listing
    try:
        response = requests.get(f"{BASE_URL}/api/tools/")
        print(f"\n✅ Tools listing: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Tools listing failed: {e}")
    
    # Test email endpoint
    try:
        email_data = {
            "to": "test@example.com",
            "subject": "Test from Robot Brain",
            "body": "Hello! This is a test email from the Robot Brain API."
        }
        response = requests.post(f"{BASE_URL}/api/tools/email", json=email_data)
        print(f"\n✅ Email endpoint: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Email endpoint failed: {e}")
    
    # Test scraping endpoint
    try:
        scrape_data = {
            "url": "https://example.com",
            "selector": "h1"
        }
        response = requests.post(f"{BASE_URL}/api/tools/scrape", json=scrape_data)
        print(f"\n✅ Scrape endpoint: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Scrape endpoint failed: {e}")
    
    # Test database endpoint
    try:
        db_data = {
            "operation": "store",
            "key": "test:api",
            "value": {"message": "Hello from API test"}
        }
        response = requests.post(f"{BASE_URL}/api/tools/database", json=db_data)
        print(f"\n✅ Database store: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        
        # Try to retrieve
        db_get = {
            "operation": "get",
            "key": "test:api"
        }
        response = requests.post(f"{BASE_URL}/api/tools/database", json=db_get)
        print(f"\n✅ Database get: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Database endpoint failed: {e}")
    
    print("\n🎉 API testing complete!")


if __name__ == "__main__":
    print("Make sure the API is running with: uvicorn api:app --reload")
    print("Or: python -m uvicorn api:app --reload")
    print("-" * 50)
    test_api()