"""
🔴 TDD RED Phase: Frontend Robot Display Mismatch Tests
Tests documenting the critical gap between deployed UI (5 robots) vs backend reality (16 robots).
Following TDD RED-GREEN-REFACTOR-QUALITY methodology.
"""
import pytest
import requests
import json
import os
from typing import List, Dict, Any
from pathlib import Path


class TestFrontendRobotDisplayMismatch:
    """Test the mismatch between frontend display vs actual robot capabilities."""
    
    def test_frontend_shows_only_5_robots_but_should_show_16(self):
        """🔴 RED: Frontend shows old 5-robot template instead of 16 professional robots."""
        # Read the current frontend robot config
        frontend_config_path = Path(__file__).parent.parent / "robot-brain-ui/src/lib/robot-config.ts"
        
        if not frontend_config_path.exists():
            pytest.fail("Frontend robot config not found - UI deployment issue")
        
        with open(frontend_config_path, 'r') as f:
            config_content = f.read()
        
        # Count robots in frontend config
        import re
        robot_entries = re.findall(r'(\w+):\s*{', config_content)
        # Filter out non-robot entries like ROBOT_TOOLS
        robot_personalities = [entry for entry in robot_entries if entry not in ['ROBOT_PERSONALITIES', 'ROBOT_TOOLS']]
        
        # RED: Should fail because frontend only has 5 robots
        assert len(robot_personalities) >= 16, f"Frontend shows {len(robot_personalities)} robots, should show 16+ professional robots"
        
        # Check for professional robot types that should exist
        expected_professional_robots = [
            "robot-trader", "robot-foreman", "robot-host", "robot-plumber", 
            "robot-accountant", "robot-recruiter", "robot-electrician", "robot-painter",
            "robot-inspector", "robot-manager", "robot-cleaner", "robot-landscaper"
        ]
        
        current_robots = set(robot_personalities)
        missing_robots = set(expected_professional_robots) - current_robots
        
        assert len(missing_robots) == 0, f"Missing professional robots: {missing_robots}"
    
    def test_frontend_references_ollama_instead_of_elevenlabs(self):
        """🔴 RED: Frontend config references Ollama models instead of ElevenLabs."""
        frontend_config_path = Path(__file__).parent.parent / "robot-brain-ui/src/lib/robot-config.ts"
        
        if not frontend_config_path.exists():
            pytest.fail("Frontend robot config not found")
        
        with open(frontend_config_path, 'r') as f:
            config_content = f.read()
        
        # RED: Should fail because config still references Ollama
        assert "llama" not in config_content.lower(), "Frontend should not reference Ollama models for MVP"
        assert "mistral" not in config_content.lower(), "Frontend should not reference Mistral models for MVP"
        assert "tinyllama" not in config_content.lower(), "Frontend should not reference TinyLlama models for MVP"
        
        # Should reference ElevenLabs instead
        assert "elevenlabs" in config_content.lower(), "Frontend should reference ElevenLabs for voice-first experience"
    
    def test_frontend_missing_voice_interface_components(self):
        """🔴 RED: Frontend lacks voice interface components for kids."""
        ui_components_path = Path(__file__).parent.parent / "robot-brain-ui/src/components"
        
        if not ui_components_path.exists():
            pytest.fail("UI components directory not found")
        
        # Check for voice-related components
        component_files = list(ui_components_path.rglob("*.tsx")) + list(ui_components_path.rglob("*.jsx"))
        component_content = ""
        
        for file_path in component_files:
            with open(file_path, 'r') as f:
                component_content += f.read().lower()
        
        # RED: Should fail because voice components are missing
        voice_features = [
            "speechrecognition", "audiovisualizer", "voicerecorder", 
            "microphone", "tts", "voice", "audio"
        ]
        
        missing_features = []
        for feature in voice_features:
            if feature not in component_content:
                missing_features.append(feature)
        
        assert len(missing_features) <= 2, f"Missing critical voice features: {missing_features}"
    
    def test_agents_directory_has_16_professional_robots(self):
        """🟢 GREEN: Verify agents directory has the 16 professional robots configured."""
        agents_path = Path(__file__).parent.parent / "agents"
        
        if not agents_path.exists():
            pytest.fail("Agents directory not found - backend configuration issue")
        
        # Count JSON agent files
        agent_files = list(agents_path.glob("robot-*.json"))
        
        # Should have 16+ professional robot configs
        assert len(agent_files) >= 16, f"Found {len(agent_files)} agent files, should have 16+ professional robots"
        
        # Verify they're properly configured with ElevenLabs
        professional_configs = 0
        for agent_file in agent_files:
            with open(agent_file, 'r') as f:
                config = json.load(f)
            
            # Check for ElevenLabs TTS configuration
            if ("conversation_config" in config and 
                "tts" in config["conversation_config"] and
                "voice_id" in config["conversation_config"]["tts"]):
                professional_configs += 1
        
        assert professional_configs >= 16, f"Only {professional_configs} robots have ElevenLabs voice config"
    
    def test_deployment_shows_wrong_template(self):
        """🔴 RED: Live deployment shows wrong template without voice functionality."""
        domain = "https://robots2.scientiacapital.com"
        
        try:
            # Test the live deployment
            response = requests.get(domain, timeout=15)
            assert response.status_code == 200, "Deployment should be accessible"
            
            html_content = response.text.lower()
            
            # RED: Should fail because deployment shows old template
            # Check for modern voice-first features
            voice_indicators = [
                "microphone", "voice", "speak", "listen", "audio", "tts"
                "speech recognition", "voice input", "voice chat"
            ]
            
            voice_feature_count = sum(1 for indicator in voice_indicators if indicator in html_content)
            assert voice_feature_count >= 3, f"Deployment lacks voice features, found {voice_feature_count} indicators"
            
            # Check for 16 robots instead of 5
            robot_count_indicators = [
                "robot-trader", "robot-foreman", "robot-host", "robot-plumber"
            ]
            
            professional_robot_count = sum(1 for robot in robot_count_indicators if robot in html_content)
            assert professional_robot_count >= 2, f"Deployment shows old 5-robot template, not 16-robot ecosystem"
            
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Cannot test live deployment: {e}")


class TestVoiceInterfaceMismatch:
    """Test missing voice interface functionality."""
    
    def test_no_voice_input_component(self):
        """🔴 RED: UI lacks voice input component for kids."""
        ui_path = Path(__file__).parent.parent / "robot-brain-ui/src"
        
        # Look for voice input components
        tsx_files = list(ui_path.rglob("*.tsx"))
        jsx_files = list(ui_path.rglob("*.jsx"))
        
        has_voice_input = False
        for file_path in tsx_files + jsx_files:
            with open(file_path, 'r') as f:
                content = f.read()
                if any(term in content.lower() for term in ["speechrecognition", "microphone", "voice input"]):
                    has_voice_input = True
                    break
        
        # RED: Should fail until voice input is implemented
        assert has_voice_input, "UI should have voice input component for kids"
    
    def test_no_audio_visualization(self):
        """🔴 RED: UI lacks audio visualization for engaging experience."""
        ui_path = Path(__file__).parent.parent / "robot-brain-ui/src"
        
        # Look for audio visualization components
        component_files = list(ui_path.rglob("*.tsx")) + list(ui_path.rglob("*.jsx"))
        
        has_audio_viz = False
        for file_path in component_files:
            with open(file_path, 'r') as f:
                content = f.read()
                if any(term in content.lower() for term in ["audiovisualizer", "waveform", "audio visual"]):
                    has_audio_viz = True
                    break
        
        # RED: Should fail until audio visualization is implemented
        assert has_audio_viz, "UI should have audio visualization for engaging voice experience"
    
    def test_no_team_discovery_interface(self):
        """🔴 RED: UI lacks team discovery interface for voice queries."""
        ui_path = Path(__file__).parent.parent / "robot-brain-ui/src"
        
        # Look for team discovery components
        component_files = list(ui_path.rglob("*.tsx")) + list(ui_path.rglob("*.jsx"))
        
        has_team_discovery = False
        for file_path in component_files:
            with open(file_path, 'r') as f:
                content = f.read()
                if any(term in content for term in ["team", "construction team", "trading team"]):
                    has_team_discovery = True
                    break
        
        # RED: Should fail until team discovery is implemented
        assert has_team_discovery, "UI should have team discovery interface for voice queries"


class TestModernReactLibrariesMissing:
    """Test that modern React libraries are missing from the current setup."""
    
    def test_missing_shadcn_components(self):
        """🔴 RED: UI lacks modern shadcn/ui components."""
        package_json_path = Path(__file__).parent.parent / "robot-brain-ui/package.json"
        
        if not package_json_path.exists():
            pytest.fail("Frontend package.json not found")
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        dependencies = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
        
        # RED: Should fail until shadcn/ui is added
        shadcn_components = [
            "@radix-ui/react-avatar", "@radix-ui/react-button", "@radix-ui/react-card",
            "@radix-ui/react-dialog", "@radix-ui/react-select", "class-variance-authority",
            "tailwind-merge", "tailwindcss-animate"
        ]
        
        missing_shadcn = [comp for comp in shadcn_components if comp not in dependencies]
        assert len(missing_shadcn) == 0, f"Missing shadcn/ui components: {missing_shadcn}"
    
    def test_missing_voice_libraries(self):
        """🔴 RED: UI lacks voice processing libraries."""
        package_json_path = Path(__file__).parent.parent / "robot-brain-ui/package.json"
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        dependencies = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
        
        # RED: Should fail until voice libraries are added
        voice_libraries = [
            "react-speech-kit", "react-media-recorder", "web-audio-api",
            "react-use-microphone", "audio-worklet"
        ]
        
        has_voice_lib = any(lib in dependencies for lib in voice_libraries)
        assert has_voice_lib, f"Should have at least one voice processing library from: {voice_libraries}"
    
    def test_missing_animation_libraries(self):
        """🔴 RED: UI lacks engaging animation libraries for kids."""
        package_json_path = Path(__file__).parent.parent / "robot-brain-ui/package.json"
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        dependencies = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
        
        # RED: Should fail until animation libraries are added
        animation_libraries = [
            "react-spring", "framer-motion", "react-transition-group",
            "lottie-react", "@react-spring/web"
        ]
        
        has_animation_lib = any(lib in dependencies for lib in animation_libraries)
        assert has_animation_lib, f"Should have engaging animation library from: {animation_libraries}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])