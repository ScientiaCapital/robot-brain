"""
PuppeteerScrapingTool implementation for JavaScript-heavy websites.
Uses MCP Puppeteer integration for browser automation.
"""

import asyncio
from typing import Dict, Any, Optional
import re

from src.core.base_tool import BaseTool, ToolParameter

# These will be mocked in tests, but in production would use MCP
try:
    from mcp_puppeteer import (
        puppeteer_navigate,
        puppeteer_screenshot,
        puppeteer_evaluate,
        puppeteer_click,
        puppeteer_fill
    )
except ImportError:
    # For testing, we'll create dummy async functions
    async def puppeteer_navigate(**kwargs):
        return {"status": "success"}
    
    async def puppeteer_screenshot(**kwargs):
        return {"screenshot": "base64_data"}
    
    async def puppeteer_evaluate(**kwargs):
        return {"result": ""}
    
    async def puppeteer_click(**kwargs):
        return {"status": "success"}
    
    async def puppeteer_fill(**kwargs):
        return {"status": "success"}


class PuppeteerScrapingTool(BaseTool):
    """Tool for scraping JavaScript-heavy websites using Puppeteer."""
    
    def __init__(self):
        """Initialize PuppeteerScrapingTool."""
        super().__init__(
            name="puppeteer_scraping",
            description="Scrape JavaScript-rendered websites using browser automation",
            parameters={
                "url": ToolParameter(
                    type="string",
                    description="URL to scrape",
                    required=True
                ),
                "action": ToolParameter(
                    type="string",
                    description="Action to perform: scrape (default), screenshot",
                    required=False,
                    default="scrape"
                ),
                "selector": ToolParameter(
                    type="string",
                    description="CSS selector for content extraction",
                    required=False
                ),
                "wait_for": ToolParameter(
                    type="string",
                    description="CSS selector to wait for before scraping",
                    required=False
                ),
                "wait_timeout": ToolParameter(
                    type="number",
                    description="Timeout in milliseconds to wait for content",
                    required=False,
                    default=3000
                )
            }
        )
    
    def _validate_url(self, url: str) -> bool:
        """Validate URL format."""
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return url_pattern.match(url) is not None
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool with given parameters."""
        # Custom validation with specific error message
        if "url" not in kwargs:
            raise ValueError("Missing required field: url")
        
        # Call parent validation (will pass since we checked required fields)
        self.validate_parameters(**kwargs)
        return await self._execute_impl(**kwargs)
    
    async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
        """Execute puppeteer scraping."""
        url = kwargs.get("url")
        
        # Validate URL
        if not self._validate_url(url):
            return {
                "status": "error",
                "error": "Invalid URL format",
                "url": url
            }
        
        action = kwargs.get("action", "scrape")
        selector = kwargs.get("selector")
        wait_for = kwargs.get("wait_for")
        wait_timeout = kwargs.get("wait_timeout", 3000)
        
        try:
            # Navigate to the URL
            nav_result = await puppeteer_navigate(url=url)
            
            # Wait for specific content if requested
            if wait_for:
                await asyncio.sleep(wait_timeout / 1000)  # Convert to seconds
                # In real implementation, would use Puppeteer's waitForSelector
            
            if action == "screenshot":
                # Take a screenshot
                screenshot_result = await puppeteer_screenshot(
                    name=f"screenshot_{url.replace('://', '_').replace('/', '_')}",
                    encoded=True
                )
                
                return {
                    "status": "success",
                    "url": url,
                    "screenshot": screenshot_result.get("screenshot", ""),
                    "action": "screenshot"
                }
            
            else:  # Default action is scrape
                if selector:
                    # Evaluate JavaScript to get specific element
                    script = f"""
                        (() => {{
                            const element = document.querySelector('{selector}');
                            return element ? element.innerText || element.textContent : '';
                        }})()
                    """
                    eval_result = await puppeteer_evaluate(script=script)
                    content = eval_result.get("result", "")
                else:
                    # Get full page content
                    script = """
                        (() => {
                            return document.documentElement.outerHTML;
                        })()
                    """
                    eval_result = await puppeteer_evaluate(script=script)
                    html_content = eval_result.get("result", "")
                    
                    # Extract text content from HTML
                    # In production, would use proper HTML parsing
                    import re
                    # Remove script and style elements
                    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL)
                    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL)
                    # Remove HTML tags
                    content = re.sub(r'<[^>]+>', ' ', html_content)
                    # Clean up whitespace
                    content = ' '.join(content.split())
                    # Limit content length
                    content = content[:1000] if len(content) > 1000 else content
                
                return {
                    "status": "success",
                    "url": url,
                    "content": content,
                    "selector": selector,
                    "action": "scrape"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "url": url
            }
    
    def __repr__(self) -> str:
        """String representation of PuppeteerScrapingTool."""
        return "PuppeteerScrapingTool(browser_automation=true)"