"""
EmailTool implementation for sending emails via SMTP.
Following TDD - minimal implementation to pass tests.
"""

import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Union, Optional
from datetime import datetime
import uuid

from src.core.base_tool import BaseTool, ToolParameter


class EmailTool(BaseTool):
    """Tool for sending emails via SMTP (MailHog in development)."""
    
    def __init__(
        self,
        smtp_host: str = "localhost",
        smtp_port: int = 1025,
        from_address: str = "robots@robot-brain.test",
        use_tls: bool = False
    ):
        """Initialize EmailTool with SMTP configuration."""
        super().__init__(
            name="email",
            description="Send emails to users",
            parameters={
                "to": ToolParameter(
                    type="string",
                    description="Recipient email address(es)",
                    required=True
                ),
                "subject": ToolParameter(
                    type="string",
                    description="Email subject line",
                    required=True
                ),
                "body": ToolParameter(
                    type="string",
                    description="Email body content",
                    required=True
                ),
                "cc": ToolParameter(
                    type="string",
                    description="CC recipients",
                    required=False
                ),
                "bcc": ToolParameter(
                    type="string",
                    description="BCC recipients",
                    required=False
                )
            }
        )
        
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.from_address = from_address
        self.use_tls = use_tls
    
    async def execute(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute the tool with given parameters."""
        # Custom validation with specific error message
        for field in ["to", "subject", "body"]:
            if field not in kwargs:
                raise ValueError(f"Missing required field: {field}")
        
        # Call parent validation (will pass since we checked required fields)
        self.validate_parameters(**kwargs)
        return await self._execute_impl(**kwargs)
    
    async def _execute_impl(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute email sending."""
        
        # Normalize recipients to list
        recipients = kwargs["to"]
        if isinstance(recipients, str):
            recipients = [recipients]
        
        cc_recipients = kwargs.get("cc", [])
        if isinstance(cc_recipients, str):
            cc_recipients = [cc_recipients]
        
        bcc_recipients = kwargs.get("bcc", [])
        if isinstance(bcc_recipients, str):
            bcc_recipients = [bcc_recipients]
        
        # Create message
        msg = MIMEMultipart()
        msg["From"] = self.from_address
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = kwargs["subject"]
        msg["Message-ID"] = f"<{uuid.uuid4()}@robot-brain.test>"
        
        if cc_recipients:
            msg["Cc"] = ", ".join(cc_recipients)
        
        # Add body
        msg.attach(MIMEText(kwargs["body"], "plain"))
        
        # Send email
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                
                # Send to all recipients
                all_recipients = recipients + cc_recipients + bcc_recipients
                server.send_message(msg)
                
                return {
                    "status": "sent",
                    "recipients": recipients,
                    "cc": cc_recipients,
                    "bcc": bcc_recipients,
                    "message_id": msg["Message-ID"],
                    "timestamp": datetime.now().isoformat(),
                    "from": self.from_address,
                    "subject": kwargs["subject"]
                }
                
        except smtplib.SMTPException as e:
            return {
                "status": "error",
                "error": str(e),
                "recipients": []
            }
        except Exception as e:
            return {
                "status": "error",
                "error": f"Unexpected error: {str(e)}",
                "recipients": []
            }
    
    def __repr__(self) -> str:
        """String representation of EmailTool."""
        return f"EmailTool(smtp_host='{self.smtp_host}', smtp_port={self.smtp_port})"