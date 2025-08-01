"""
Tests for PuppeteerScrapingTool implementation.
Following TDD - write tests first!
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio


@pytest.mark.asyncio
class TestPuppeteerScrapingTool:
    """Test the PuppeteerScrapingTool implementation."""
    
    async def test_puppeteer_tool_navigates_and_scrapes(self):
        """Test that PuppeteerScrapingTool can navigate to a URL and get content."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        # Mock the MCP puppeteer functions
        with patch('src.tools.puppeteer_scraping_tool.puppeteer_navigate') as mock_nav:
            with patch('src.tools.puppeteer_scraping_tool.puppeteer_evaluate') as mock_eval:
                mock_nav.return_value = {"status": "success"}
                mock_eval.return_value = {"result": "<h1>Hello World</h1><p>Test content</p>"}
                
                result = await tool.execute(
                    url="https://example.com"
                )
                
                assert result["status"] == "success"
                assert "content" in result
                assert "Hello World" in result["content"]
                assert result["url"] == "https://example.com"
    
    async def test_puppeteer_tool_with_selector(self):
        """Test scraping with CSS selector."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        with patch('src.tools.puppeteer_scraping_tool.puppeteer_navigate') as mock_nav:
            with patch('src.tools.puppeteer_scraping_tool.puppeteer_evaluate') as mock_eval:
                mock_nav.return_value = {"status": "success"}
                # Mock evaluation of selector
                mock_eval.return_value = {"result": "Selected Content"}
                
                result = await tool.execute(
                    url="https://example.com",
                    selector="h1"
                )
                
                assert result["status"] == "success"
                assert result["content"] == "Selected Content"
    
    async def test_puppeteer_tool_screenshot(self):
        """Test taking a screenshot."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        with patch('src.tools.puppeteer_scraping_tool.puppeteer_navigate') as mock_nav:
            with patch('src.tools.puppeteer_scraping_tool.puppeteer_screenshot') as mock_screen:
                mock_nav.return_value = {"status": "success"}
                mock_screen.return_value = {"screenshot": "base64_data_here"}
                
                result = await tool.execute(
                    url="https://example.com",
                    action="screenshot"
                )
                
                assert result["status"] == "success"
                assert "screenshot" in result
                mock_screen.assert_called_once()
    
    async def test_puppeteer_tool_wait_for_content(self):
        """Test waiting for dynamic content."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        with patch('src.tools.puppeteer_scraping_tool.puppeteer_navigate') as mock_nav:
            with patch('src.tools.puppeteer_scraping_tool.puppeteer_evaluate') as mock_eval:
                with patch('asyncio.sleep') as mock_sleep:
                    mock_nav.return_value = {"status": "success"}
                    mock_eval.return_value = {"result": "Dynamic content loaded"}
                    
                    result = await tool.execute(
                        url="https://example.com",
                        wait_for=".dynamic-content",
                        wait_timeout=5000
                    )
                    
                    assert result["status"] == "success"
                    assert "Dynamic content loaded" in result["content"]
    
    async def test_puppeteer_tool_handles_errors(self):
        """Test error handling."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        with patch('src.tools.puppeteer_scraping_tool.puppeteer_navigate') as mock_nav:
            mock_nav.side_effect = Exception("Navigation failed")
            
            result = await tool.execute(url="https://example.com")
            
            assert result["status"] == "error"
            assert "Navigation failed" in result["error"]
    
    async def test_puppeteer_tool_validates_url(self):
        """Test URL validation."""
        from src.tools.puppeteer_scraping_tool import PuppeteerScrapingTool
        
        tool = PuppeteerScrapingTool()
        
        # Missing URL
        with pytest.raises(ValueError, match="Missing required field: url"):
            await tool.execute(action="screenshot")
        
        # Invalid URL
        result = await tool.execute(url="not-a-url")
        assert result["status"] == "error"
        assert "Invalid URL" in result["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])