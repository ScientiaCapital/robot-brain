"""
TDD Tests for Real Tool Implementations.
Following Red-Green-Refactor cycle.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText

# Mark all async tests
pytestmark = pytest.mark.asyncio


class TestEmailTool:
    """Test the EmailTool implementation following TDD principles."""
    
    @pytest.fixture
    def mock_smtp(self):
        """Mock SMTP server for testing."""
        with patch('smtplib.SMTP') as mock:
            yield mock
    
    async def test_email_tool_sends_message(self, mock_smtp):
        """RED: Test that EmailTool can send a basic email message."""
        from src.tools.email_tool import EmailTool
        
        # Create tool instance
        email_tool = EmailTool(
            smtp_host="localhost",
            smtp_port=1025,  # MailHog port
            from_address="robots@robot-brain.test"
        )
        
        # Execute email send
        result = await email_tool.execute(
            to="test@example.com",
            subject="Test Email from Robot",
            body="Hello! This is a test message from your robot friend."
        )
        
        # Verify result
        assert result["status"] == "sent"
        assert "test@example.com" in result["recipients"]
        assert result["message_id"] is not None
        
        # Verify SMTP was called correctly
        mock_smtp.assert_called_once_with("localhost", 1025)
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
    
    async def test_email_tool_handles_multiple_recipients(self, mock_smtp):
        """RED: Test sending email to multiple recipients."""
        from src.tools.email_tool import EmailTool
        
        email_tool = EmailTool(
            smtp_host="localhost",
            smtp_port=1025,
            from_address="robots@robot-brain.test"
        )
        
        result = await email_tool.execute(
            to=["user1@example.com", "user2@example.com"],
            subject="Multi-recipient Test",
            body="Hello everyone!"
        )
        
        assert result["status"] == "sent"
        assert len(result["recipients"]) == 2
        assert "user1@example.com" in result["recipients"]
        assert "user2@example.com" in result["recipients"]
    
    async def test_email_tool_validates_required_fields(self):
        """RED: Test that EmailTool validates required fields."""
        from src.tools.email_tool import EmailTool
        
        email_tool = EmailTool(
            smtp_host="localhost",
            smtp_port=1025,
            from_address="robots@robot-brain.test"
        )
        
        # Missing 'to' field
        with pytest.raises(ValueError, match="Missing required field: to"):
            await email_tool.execute(
                subject="Test",
                body="Test body"
            )
        
        # Missing 'subject' field
        with pytest.raises(ValueError, match="Missing required field: subject"):
            await email_tool.execute(
                to="test@example.com",
                body="Test body"
            )
        
        # Missing 'body' field
        with pytest.raises(ValueError, match="Missing required field: body"):
            await email_tool.execute(
                to="test@example.com",
                subject="Test"
            )
    
    async def test_email_tool_handles_smtp_errors(self, mock_smtp):
        """RED: Test graceful handling of SMTP errors."""
        from src.tools.email_tool import EmailTool
        
        # Configure mock to raise exception
        mock_smtp.return_value.__enter__.return_value.send_message.side_effect = \
            smtplib.SMTPException("Connection failed")
        
        email_tool = EmailTool(
            smtp_host="localhost",
            smtp_port=1025,
            from_address="robots@robot-brain.test"
        )
        
        result = await email_tool.execute(
            to="test@example.com",
            subject="Test",
            body="Test body"
        )
        
        assert result["status"] == "error"
        assert "Connection failed" in result["error"]
        assert result["recipients"] == []


class TestWebScrapingTool:
    """Test the WebScrapingTool implementation."""
    
    @pytest.fixture
    def mock_requests(self):
        """Mock requests library for testing."""
        with patch('requests.get') as mock:
            yield mock
    
    async def test_web_scraping_tool_fetches_content(self, mock_requests):
        """RED: Test that WebScrapingTool can fetch web content."""
        from src.tools.web_scraping_tool import WebScrapingTool
        
        # Mock response
        mock_response = Mock()
        mock_response.text = "<html><body><h1>Hello Robot!</h1></body></html>"
        mock_response.status_code = 200
        mock_requests.return_value = mock_response
        
        scraper = WebScrapingTool()
        result = await scraper.execute(
            url="https://example.com",
            selector="h1"
        )
        
        assert result["status"] == "success"
        assert result["content"] == "Hello Robot!"
        assert result["url"] == "https://example.com"
    
    async def test_web_scraping_tool_handles_errors(self, mock_requests):
        """RED: Test error handling in web scraping."""
        from src.tools.web_scraping_tool import WebScrapingTool
        
        # Mock connection error
        mock_requests.side_effect = Exception("Connection timeout")
        
        scraper = WebScrapingTool()
        result = await scraper.execute(url="https://example.com")
        
        assert result["status"] == "error"
        assert "Connection timeout" in result["error"]


class TestDatabaseTool:
    """Test the DatabaseTool implementation."""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client for testing."""
        with patch('redis.Redis') as mock:
            yield mock
    
    async def test_database_tool_stores_and_retrieves_data(self, mock_redis):
        """RED: Test basic database operations."""
        from src.tools.database_tool import DatabaseTool
        
        # Mock Redis operations
        mock_client = mock_redis.return_value
        mock_client.set.return_value = True
        mock_client.get.return_value = b'{"name": "RoboFriend", "mood": "happy"}'
        
        db_tool = DatabaseTool(redis_host="localhost", redis_port=6379)
        
        # Test store operation
        store_result = await db_tool.execute(
            operation="store",
            key="robot:1",
            value={"name": "RoboFriend", "mood": "happy"}
        )
        
        assert store_result["status"] == "success"
        assert store_result["operation"] == "store"
        
        # Test retrieve operation
        get_result = await db_tool.execute(
            operation="get",
            key="robot:1"
        )
        
        assert get_result["status"] == "success"
        assert get_result["value"]["name"] == "RoboFriend"
        assert get_result["value"]["mood"] == "happy"


class TestSMSTool:
    """Test the SMSTool implementation."""
    
    @pytest.fixture
    def mock_twilio(self):
        """Mock Twilio client for testing."""
        with patch('twilio.rest.Client') as mock:
            yield mock
    
    @pytest.mark.skip(reason="SMS/Twilio excluded for now - will implement later")
    async def test_sms_tool_sends_message(self, mock_twilio):
        """RED: Test that SMSTool can send SMS messages."""
        from src.tools.sms_tool import SMSTool
        
        # Mock Twilio message creation
        mock_client = mock_twilio.return_value
        mock_message = Mock()
        mock_message.sid = "MSG123456789"
        mock_client.messages.create.return_value = mock_message
        
        sms_tool = SMSTool(
            account_sid="test_sid",
            auth_token="test_token",
            from_number="+1234567890"
        )
        
        result = await sms_tool.execute(
            to="+0987654321",
            message="Hello from Robot Brain! 🤖"
        )
        
        assert result["status"] == "sent"
        assert result["message_id"] == "MSG123456789"
        assert result["to"] == "+0987654321"


class TestToolIntegration:
    """Test integration between multiple tools."""
    
    @pytest.fixture
    def mock_smtp(self):
        """Mock SMTP for testing."""
        with patch('smtplib.SMTP') as mock:
            yield mock
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client for testing."""
        with patch('redis.Redis') as mock:
            yield mock
    
    async def test_email_and_database_integration(self, mock_smtp, mock_redis):
        """RED: Test that tools can work together."""
        from src.tools.email_tool import EmailTool
        from src.tools.database_tool import DatabaseTool
        
        # Setup tools
        email_tool = EmailTool(
            smtp_host="localhost",
            smtp_port=1025,
            from_address="robots@robot-brain.test"
        )
        
        db_tool = DatabaseTool(redis_host="localhost", redis_port=6379)
        
        # Send email
        email_result = await email_tool.execute(
            to="user@example.com",
            subject="Robot Update",
            body="Your robot learned something new!"
        )
        
        # Store email record in database
        db_result = await db_tool.execute(
            operation="store",
            key=f"email:{email_result['message_id']}",
            value={
                "to": email_result["recipients"],
                "subject": "Robot Update",
                "sent_at": email_result.get("timestamp"),
                "status": email_result["status"]
            }
        )
        
        assert email_result["status"] == "sent"
        assert db_result["status"] == "success"


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])