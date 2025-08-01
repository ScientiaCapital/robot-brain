"""
ElevenLabs Conversational AI Integration Script.

This module provides high-level integration functions for setting up
and managing ElevenLabs agents for Robot Brain personalities.
"""

import os
import asyncio
from typing import Dict, List, Optional, Any
from .cli_manager import ConvAICLIManager
from .agent_config import AgentConfigManager


class ElevenLabsIntegration:
    """High-level integration class for ElevenLabs Conversational AI."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize integration with CLI and config managers."""
        self.cli_manager = ConvAICLIManager(api_key)
        self.config_manager = AgentConfigManager()

    async def setup_robot_brain_agents(self, environment: str = 'dev') -> Dict[str, bool]:
        """Set up all Robot Brain personalities as ElevenLabs agents."""
        results = {}
        
        # Step 1: Check CLI installation
        if not await self.cli_manager.check_cli_installation():
            raise RuntimeError("ElevenLabs CLI not installed. Run: npm install -g @elevenlabs/convai-cli")
        
        # Step 2: Authenticate
        if not await self.cli_manager.authenticate():
            raise RuntimeError("Failed to authenticate with ElevenLabs API")
        
        # Step 3: Initialize project
        if not await self.cli_manager.init_project():
            print("Warning: Project initialization failed (may already exist)")
        
        # Step 4: Create agents for each personality
        personalities = self.config_manager.get_robot_personalities_config()
        
        for personality_id, config in personalities.items():
            try:
                # Create agent
                success = await self.cli_manager.create_agent(
                    name=config['name'],
                    personality_id=personality_id,
                    template='assistant'
                )
                results[personality_id] = success
                
                if success:
                    print(f"✅ Created agent for {config['name']} ({personality_id})")
                else:
                    print(f"❌ Failed to create agent for {config['name']} ({personality_id})")
                    
            except Exception as e:
                print(f"❌ Error creating agent for {personality_id}: {e}")
                results[personality_id] = False
        
        # Step 5: Sync to environment
        if environment != 'dev':
            sync_success = await self.cli_manager.sync_to_environment(environment)
            if sync_success:
                print(f"✅ Synced agents to {environment} environment")
            else:
                print(f"❌ Failed to sync agents to {environment} environment")
        
        return results

    async def generate_widgets_for_all_robots(self, environment: str = 'prod') -> Dict[str, str]:
        """Generate HTML widgets for all robot personalities."""
        widgets = {}
        personalities = self.config_manager.get_robot_personalities_config()
        
        for personality_id, config in personalities.items():
            try:
                success = await self.cli_manager.generate_widget(
                    agent_name=config['name'],
                    env=environment
                )
                
                if success:
                    widget_path = f"widgets/{personality_id}_{environment}.html"
                    widgets[personality_id] = widget_path
                    print(f"✅ Generated widget for {config['name']}: {widget_path}")
                else:
                    print(f"❌ Failed to generate widget for {config['name']}")
                    
            except Exception as e:
                print(f"❌ Error generating widget for {personality_id}: {e}")
        
        return widgets

    async def check_all_agents_status(self, environment: str = 'prod') -> Optional[Dict[str, Any]]:
        """Check status of all robot brain agents."""
        try:
            status = await self.cli_manager.check_agent_status(environment)
            if status:
                print(f"📊 Agent status in {environment}:")
                for agent in status.get('agents', []):
                    print(f"  - {agent.get('name', 'Unknown')}: {agent.get('status', 'Unknown')}")
            return status
        except Exception as e:
            print(f"❌ Error checking agent status: {e}")
            return None

    async def sync_specific_robot(self, personality_id: str, environment: str = 'prod') -> bool:
        """Sync a specific robot personality to an environment."""
        personalities = self.config_manager.get_robot_personalities_config()
        
        if personality_id not in personalities:
            print(f"❌ Unknown personality: {personality_id}")
            return False
        
        config = personalities[personality_id]
        try:
            success = await self.cli_manager.sync_agent(
                agent_name=config['name'],
                env=environment
            )
            
            if success:
                print(f"✅ Synced {config['name']} to {environment}")
            else:
                print(f"❌ Failed to sync {config['name']} to {environment}")
                
            return success
            
        except Exception as e:
            print(f"❌ Error syncing {personality_id}: {e}")
            return False

    def get_agent_configuration(self, personality_id: str) -> Optional[Dict[str, Any]]:
        """Get the complete agent configuration for a personality."""
        return self.config_manager.load_config(personality_id)

    def update_agent_configuration(self, personality_id: str, updates: Dict[str, Any]) -> bool:
        """Update agent configuration for a personality."""
        return self.config_manager.update_config(personality_id, updates)

    def list_available_personalities(self) -> List[str]:
        """List all available robot personalities."""
        return list(self.config_manager.get_robot_personalities_config().keys())


async def main() -> None:
    """Main function for testing integration."""
    try:
        integration = ElevenLabsIntegration()
        
        print("🤖 Robot Brain x ElevenLabs Integration")
        print("=====================================")
        
        # Setup agents
        results = await integration.setup_robot_brain_agents('dev')
        print(f"\n📊 Setup Results: {results}")
        
        # Check status  
        await integration.check_all_agents_status('dev')
        
        # List personalities
        personalities = integration.list_available_personalities()
        print(f"\n🎭 Available Personalities: {personalities}")
        
    except Exception as e:
        print(f"❌ Integration failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())