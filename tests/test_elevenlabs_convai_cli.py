"""
Test suite for ElevenLabs Conversational AI CLI integration following TDD principles.

This test suite covers the CLI integration for managing ElevenLabs agents
corresponding to Robot Brain personalities.
"""
import os
import json
import pytest
import subprocess
from unittest.mock import AsyncMock, patch, MagicMock, mock_open
from pathlib import Path

# Import will fail initially (RED phase) - this is expected in TDD
try:
    from src.elevenlabs_convai.cli_manager import ConvAICLIManager
    from src.elevenlabs_convai.agent_config import AgentConfigManager
except ImportError:
    # Expected during RED phase - modules don't exist yet
    ConvAICLIManager = None
    AgentConfigManager = None


class TestElevenLabsConvAICLI:
    """Test suite for ElevenLabs Conversational AI CLI integration."""

    @pytest.fixture
    def cli_manager(self):
        """Create ConvAICLIManager instance for testing."""
        if ConvAICLIManager is None:
            pytest.skip("ConvAICLIManager not implemented yet (TDD RED phase)")
        
        with patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test_api_key'}):
            return ConvAICLIManager()

    @pytest.fixture
    def agent_config_manager(self):
        """Create AgentConfigManager instance for testing."""
        if AgentConfigManager is None:
            pytest.skip("AgentConfigManager not implemented yet (TDD RED phase)")
            
        return AgentConfigManager()

    @pytest.fixture
    def robot_personalities(self):
        """Robot personality configuration data."""
        return {
            "friend": {
                "name": "RoboFriend",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
                "prompt": "You are RoboFriend, always cheerful and encouraging!",
                "traits": ["cheerful", "encouraging", "supportive"]
            },
            "nerd": {
                "name": "RoboNerd", 
                "voice_id": "pNInz6obpgDQGcFmaJgB",
                "prompt": "You are RoboNerd, super smart and loves explaining how things work!",
                "traits": ["intelligent", "analytical", "explanatory"]
            },
            "zen": {
                "name": "RoboZen",
                "voice_id": "AZnzlk1XvdvUeBnXmlld", 
                "prompt": "You are RoboZen, calm and wise, sharing thoughtful advice.",
                "traits": ["calm", "wise", "mindful"]
            },
            "pirate": {
                "name": "RoboPirate",
                "voice_id": "EXAVITQu4vr4xnSDxMaL",
                "prompt": "You are RoboPirate, adventurous and playful, says 'Arrr!' a lot.",
                "traits": ["adventurous", "playful", "nautical"]
            },
            "drama": {
                "name": "RoboDrama",
                "voice_id": "MF3mGyEYCl7XYWbV9V6O",
                "prompt": "You are RoboDrama, theatrical and expressive!",
                "traits": ["theatrical", "expressive", "dramatic"]
            }
        }

    @pytest.mark.asyncio
    async def test_cli_installation_check(self, cli_manager):
        """Test that convai CLI is installed and accessible."""
        # This test will fail initially (RED phase)
        result = await cli_manager.check_cli_installation()
        assert result is True, "convai CLI should be installed"

    @pytest.mark.asyncio
    async def test_cli_authentication(self, cli_manager):
        """Test CLI authentication with ElevenLabs API key."""
        with patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value.returncode = 0
            mock_subprocess.return_value.stdout = "Logged in successfully"
            
            result = await cli_manager.authenticate()
            assert result is True, "CLI authentication should succeed"
            
            # Verify login command was called
            mock_subprocess.assert_called_with(
                ['convai', 'login'],
                capture_output=True,
                text=True,
                input='test_api_key\n'
            )

    @pytest.mark.asyncio
    async def test_project_initialization(self, cli_manager):
        """Test convai project initialization."""
        with patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value.returncode = 0
            mock_subprocess.return_value.stdout = "Project initialized"
            
            result = await cli_manager.init_project()
            assert result is True, "Project initialization should succeed"
            
            mock_subprocess.assert_called_with(
                ['convai', 'init'],
                capture_output=True,
                text=True
            )

    @pytest.mark.asyncio
    async def test_agent_creation_for_robot_personalities(self, cli_manager, robot_personalities):
        """Test creating ElevenLabs agents for each robot personality."""
        for personality_id, config in robot_personalities.items():
            with patch('subprocess.run') as mock_subprocess:
                mock_subprocess.return_value.returncode = 0
                mock_subprocess.return_value.stdout = f"Agent {config['name']} created"
                
                result = await cli_manager.create_agent(
                    name=config['name'],
                    personality_id=personality_id,
                    template='assistant'
                )
                
                assert result is True, f"Agent creation should succeed for {personality_id}"
                
                # Verify agent creation command
                expected_call = ['convai', 'add', config['name'], '--template', 'assistant']
                mock_subprocess.assert_called_with(
                    expected_call,
                    capture_output=True,
                    text=True
                )

    def test_agent_config_generation(self, agent_config_manager, robot_personalities):
        """Test generating agent configuration JSON for robot personalities."""
        for personality_id, config in robot_personalities.items():
            agent_config = agent_config_manager.generate_config(
                personality_id=personality_id,
                name=config['name'],
                voice_id=config['voice_id'],
                prompt=config['prompt'],
                traits=config['traits']
            )
            
            # Verify config structure
            assert 'name' in agent_config
            assert 'conversation_config' in agent_config
            assert 'agent' in agent_config['conversation_config']
            assert 'tts' in agent_config['conversation_config']
            
            # Verify content
            assert agent_config['name'] == config['name']
            assert agent_config['conversation_config']['agent']['prompt']['prompt'] == config['prompt']
            assert agent_config['conversation_config']['tts']['voice_id'] == config['voice_id']

    @pytest.mark.asyncio
    async def test_multi_environment_deployment(self, cli_manager):
        """Test deploying agents to different environments (dev, staging, prod)."""
        environments = ['dev', 'staging', 'prod']
        
        for env in environments:
            with patch('subprocess.run') as mock_subprocess:
                mock_subprocess.return_value.returncode = 0
                mock_subprocess.return_value.stdout = f"Synced to {env}"
                
                result = await cli_manager.sync_to_environment(env)
                assert result is True, f"Sync to {env} environment should succeed"
                
                mock_subprocess.assert_called_with(
                    ['convai', 'sync', '--env', env],
                    capture_output=True,
                    text=True
                )

    @pytest.mark.asyncio 
    async def test_agent_status_check(self, cli_manager):
        """Test checking agent status in different environments."""
        with patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value.returncode = 0
            mock_subprocess.return_value.stdout = json.dumps({
                "agents": [
                    {"name": "RoboFriend", "status": "active", "env": "prod"},
                    {"name": "RoboNerd", "status": "active", "env": "prod"}
                ]
            })
            
            status = await cli_manager.check_agent_status(env='prod')
            assert status is not None, "Status check should return data"
            assert len(status['agents']) >= 0, "Should return agent list"

    @pytest.mark.asyncio
    async def test_widget_generation(self, cli_manager, robot_personalities):
        """Test generating HTML widgets for robot personalities."""
        for personality_id, config in robot_personalities.items():
            with patch('subprocess.run') as mock_subprocess:
                mock_subprocess.return_value.returncode = 0
                mock_subprocess.return_value.stdout = f"Widget generated for {config['name']}"
                
                result = await cli_manager.generate_widget(
                    agent_name=config['name'],
                    env='prod'
                )
                
                assert result is True, f"Widget generation should succeed for {personality_id}"
                
                mock_subprocess.assert_called_with(
                    ['convai', 'widget', config['name'], '--env', 'prod'],
                    capture_output=True,
                    text=True
                )

    def test_config_file_creation(self, agent_config_manager, robot_personalities):
        """Test creating configuration files for each robot personality."""
        for personality_id, config in robot_personalities.items():
            config_path = f"agents/{personality_id}.json"
            
            with patch('builtins.open', mock_open()) as mock_file:
                agent_config_manager.save_config(
                    personality_id=personality_id,
                    config_data=config,
                    file_path=config_path
                )
                
                # Verify file was opened for writing
                mock_file.assert_called_with(config_path, 'w')
                
                # Verify JSON was written
                handle = mock_file()
                written_content = ''.join(call.args[0] for call in handle.write.call_args_list)
                assert config['name'] in written_content, f"Config should contain {config['name']}"

    @pytest.mark.asyncio
    async def test_cli_error_handling(self, cli_manager):
        """Test CLI error handling for failed commands."""
        with patch('subprocess.run') as mock_subprocess:
            # Simulate CLI command failure
            mock_subprocess.return_value.returncode = 1
            mock_subprocess.return_value.stderr = "Authentication failed"
            
            result = await cli_manager.authenticate()
            assert result is False, "Authentication should fail gracefully"

    @pytest.mark.asyncio 
    async def test_cli_version_check(self, cli_manager):
        """Test checking convai CLI version compatibility."""
        with patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value.returncode = 0
            mock_subprocess.return_value.stdout = "@elevenlabs/convai-cli v1.0.0"
            
            version = await cli_manager.get_cli_version()
            assert version is not None, "CLI version should be retrievable"
            assert "convai-cli" in version, "Version should identify convai CLI"

    def test_agent_config_validation(self, agent_config_manager):
        """Test validation of agent configuration JSON."""
        valid_config = {
            "name": "TestBot",
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": "You are a test bot"
                    },
                    "language": "en"
                },
                "tts": {
                    "voice_id": "test_voice_id",
                    "model_id": "eleven_turbo_v2"
                }
            }
        }
        
        is_valid = agent_config_manager.validate_config(valid_config)
        assert is_valid is True, "Valid config should pass validation"
        
        # Test invalid config
        invalid_config = {"name": "TestBot"}  # Missing required fields
        is_valid = agent_config_manager.validate_config(invalid_config)
        assert is_valid is False, "Invalid config should fail validation"