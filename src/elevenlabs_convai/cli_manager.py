"""
ElevenLabs Conversational AI CLI Manager.

This module manages interactions with the ElevenLabs convai CLI tool
for creating and managing conversational AI agents.
"""

import os
import json
import subprocess
import asyncio
from typing import Dict, Any, Optional, List
from pathlib import Path


class ConvAICLIManager:
    """Manages ElevenLabs Conversational AI CLI operations."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize CLI manager with optional API key."""
        self.api_key = api_key or os.getenv('ELEVENLABS_API_KEY')
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable is required")

    async def check_cli_installation(self) -> bool:
        """Check if convai CLI is installed and accessible."""
        try:
            result = await self._run_command(['convai', '--version'])
            return result.returncode == 0
        except FileNotFoundError:
            return False
        except Exception:
            return False

    async def authenticate(self) -> bool:
        """Authenticate with ElevenLabs API using CLI."""
        try:
            result = await self._run_command(
                ['convai', 'login'],
                input_data=f"{self.api_key}\n"
            )
            return result.returncode == 0
        except Exception:
            return False

    async def init_project(self) -> bool:
        """Initialize convai project in current directory."""
        try:
            result = await self._run_command(['convai', 'init'])
            return result.returncode == 0
        except Exception:
            return False

    async def create_agent(self, name: str, personality_id: str, template: str = 'assistant') -> bool:
        """Create a new conversational AI agent."""
        try:
            command = ['convai', 'add', name, '--template', template]
            result = await self._run_command(command)
            return result.returncode == 0
        except Exception:
            return False

    async def sync_to_environment(self, env: str) -> bool:
        """Sync agents to specific environment (dev, staging, prod)."""
        try:
            command = ['convai', 'sync', '--env', env]
            result = await self._run_command(command)
            return result.returncode == 0
        except Exception:
            return False

    async def check_agent_status(self, env: str = 'prod') -> Optional[Dict[str, Any]]:
        """Check status of agents in specified environment."""
        try:
            command = ['convai', 'status', '--env', env]
            result = await self._run_command(command)
            if result.returncode == 0 and result.stdout:
                status_data: Dict[str, Any] = json.loads(result.stdout)
                return status_data
            return None
        except Exception:
            return None

    async def generate_widget(self, agent_name: str, env: str = 'prod') -> bool:
        """Generate HTML widget for specified agent."""
        try:
            command = ['convai', 'widget', agent_name, '--env', env]
            result = await self._run_command(command)
            return result.returncode == 0
        except Exception:
            return False

    async def get_cli_version(self) -> Optional[str]:
        """Get convai CLI version."""
        try:
            result = await self._run_command(['convai', '--version'])
            if result.returncode == 0:
                version_str: str = result.stdout.strip()
                return version_str
            return None
        except Exception:
            return None

    async def list_agents(self, env: str = 'prod') -> Optional[List[Dict[str, Any]]]:
        """List all agents in specified environment."""
        try:
            command = ['convai', 'list-agents', '--env', env]
            result = await self._run_command(command)
            if result.returncode == 0 and result.stdout:
                agents_data: List[Dict[str, Any]] = json.loads(result.stdout)
                return agents_data
            return None
        except Exception:
            return None

    async def sync_agent(self, agent_name: str, env: str = 'prod') -> bool:
        """Sync specific agent to environment."""
        try:
            command = ['convai', 'sync', '--agent', agent_name, '--env', env]
            result = await self._run_command(command)
            return result.returncode == 0
        except Exception:
            return False

    async def _run_command(self, command: List[str], input_data: Optional[str] = None) -> subprocess.CompletedProcess[str]:
        """Run subprocess command asynchronously."""
        loop = asyncio.get_event_loop()
        
        def run_sync() -> subprocess.CompletedProcess[str]:
            if input_data is not None:
                return subprocess.run(
                    command,
                    capture_output=True,
                    text=True,
                    input=input_data
                )
            else:
                return subprocess.run(
                    command,
                    capture_output=True,
                    text=True
                )
        
        return await loop.run_in_executor(None, run_sync)