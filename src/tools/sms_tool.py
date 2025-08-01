"""
SMSTool implementation for sending SMS messages.
Following TDD - minimal implementation.
"""

import asyncio
from typing import Dict, Any
from twilio.rest import Client

from src.core.base_tool import BaseTool, ToolParameter


class SMSTool(BaseTool):
    """Tool for sending SMS messages via Twilio."""
    
    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        from_number: str
    ):
        """Initialize SMSTool with Twilio credentials."""
        super().__init__(
            name="sms",
            description="Send SMS messages",
            parameters={
                "to": ToolParameter(
                    type="string",
                    description="Recipient phone number",
                    required=True
                ),
                "message": ToolParameter(
                    type="string",
                    description="SMS message content",
                    required=True
                )
            }
        )
        
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self._client = None
    
    def _get_client(self):
        """Get or create Twilio client."""
        if not self._client:
            self._client = Client(self.account_sid, self.auth_token)
        return self._client
    
    async def _execute_impl(self, **kwargs) -> Dict[str, Any]:
        """Execute SMS sending."""
        to = kwargs.get("to")
        message = kwargs.get("message")
        
        if not to:
            raise ValueError("Missing required field: to")
        if not message:
            raise ValueError("Missing required field: message")
        
        try:
            client = self._get_client()
            
            # Send SMS
            result = client.messages.create(
                body=message,
                from_=self.from_number,
                to=to
            )
            
            return {
                "status": "sent",
                "message_id": result.sid,
                "to": to,
                "from": self.from_number,
                "message": message
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "to": to
            }