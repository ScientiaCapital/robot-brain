"""
WebScrapingTool implementation for fetching web content.
Following TDD - minimal implementation.
"""

import asyncio
import requests
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup

from src.core.base_tool import BaseTool, ToolParameter


class WebScrapingTool(BaseTool):
    """Tool for scraping web content."""
    
    def __init__(self) -> None:
        """Initialize WebScrapingTool."""
        super().__init__(
            name="web_scraping",
            description="Fetch and extract content from web pages",
            parameters={
                "url": ToolParameter(
                    type="string",
                    description="URL to scrape",
                    required=True
                ),
                "selector": ToolParameter(
                    type="string",
                    description="CSS selector for content extraction",
                    required=False
                )
            }
        )
    
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute web scraping."""
        url = kwargs.get("url")
        if not url:
            raise ValueError("Missing required field: url")
        
        try:
            # Fetch content
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract content based on selector
            selector = kwargs.get("selector")
            if selector:
                element = soup.select_one(selector)
                content = element.text.strip() if element else ""
            else:
                content = soup.get_text().strip()[:500]  # First 500 chars
            
            return {
                "status": "success",
                "url": url,
                "content": content,
                "title": soup.title.string if soup.title else None
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "url": url
            }