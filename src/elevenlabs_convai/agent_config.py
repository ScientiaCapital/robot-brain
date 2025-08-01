"""
ElevenLabs Agent Configuration Manager.

This module handles the creation and management of agent configuration files
for Robot Brain personalities integrated with ElevenLabs Conversational AI.
"""

import json
import os
from typing import Dict, Any, List, Optional, Union
from pathlib import Path


class AgentConfigManager:
    """Manages agent configuration for Robot Brain personalities."""

    def __init__(self, config_dir: str = "agents"):
        """Initialize agent config manager with configuration directory."""
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)

    def generate_config(
        self,
        personality_id: str,
        name: str,
        voice_id: str,
        prompt: str,
        traits: List[str],
        language: str = "en",
        model_id: str = "eleven_turbo_v2",
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate ElevenLabs agent configuration for robot personality."""
        
        config = {
            "name": name,
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": prompt,
                        "llm": "gpt-4",  # Default LLM
                        "temperature": temperature
                    },
                    "language": language,
                    "max_duration": 600,  # 10 minutes max
                    "responsiveness": 0.5,
                    "interruption_threshold": 0.3
                },
                "tts": {
                    "model_id": model_id,
                    "voice_id": voice_id,
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.2,
                    "use_speaker_boost": True
                },
                "conversation": {
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding": 300,
                        "silence_duration": 500
                    }
                }
            },
            "metadata": {
                "personality_id": personality_id,
                "traits": traits,
                "created_by": "robot-brain",
                "version": "1.0.0"
            },
            "tags": [
                "robot-brain",
                personality_id,
                "conversational-ai"
            ]
        }
        
        return config

    def save_config(self, personality_id: str, config_data: Dict[str, Any], file_path: Optional[str] = None) -> str:
        """Save agent configuration to JSON file."""
        if file_path is None:
            resolved_path: Path = self.config_dir / f"{personality_id}.json"
        else:
            resolved_path = Path(file_path)
            
        # Ensure directory exists
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Generate full config if config_data is simplified
        if 'conversation_config' not in config_data:
            full_config = self.generate_config(
                personality_id=personality_id,
                name=config_data.get('name', personality_id),
                voice_id=config_data.get('voice_id', ''),
                prompt=config_data.get('prompt', ''),
                traits=config_data.get('traits', [])
            )
        else:
            full_config = config_data
            
        with open(str(resolved_path), 'w') as f:
            json.dump(full_config, f, indent=2)
            
        return str(resolved_path)

    def load_config(self, personality_id: str) -> Optional[Dict[str, Any]]:
        """Load agent configuration from JSON file."""
        config_path = self.config_dir / f"{personality_id}.json"
        
        if not config_path.exists():
            return None
            
        try:
            with open(str(config_path), 'r') as f:
                loaded_data: Dict[str, Any] = json.load(f)
                return loaded_data
        except (json.JSONDecodeError, IOError):
            return None

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate agent configuration structure."""
        required_fields = ['name', 'conversation_config']
        
        # Check top-level required fields
        for field in required_fields:
            if field not in config:
                return False
                
        # Check conversation_config structure
        conv_config = config['conversation_config']
        if 'agent' not in conv_config or 'tts' not in conv_config:
            return False
            
        # Check agent configuration
        agent_config = conv_config['agent']
        if 'prompt' not in agent_config:
            return False
            
        # Check TTS configuration
        tts_config = conv_config['tts']
        if 'voice_id' not in tts_config:
            return False
            
        return True

    def get_robot_personalities_config(self) -> Dict[str, Dict[str, Any]]:
        """Get configuration mapping for all Robot Brain personalities using plugin-style naming."""
        return {
            # === CORE SOCIAL ROBOTS ===
            "robot-companion": {
                "name": "Robot Companion",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
                "prompt": "You are Robot Companion, always cheerful and encouraging! You love making friends and helping people feel better. Use encouraging words and emojis when appropriate. You're optimistic and see the bright side of everything.",
                "traits": ["cheerful", "encouraging", "supportive", "optimistic", "friendly"],
                "temperature": 0.8,
                "category": "social",
                "description": "A friendly companion robot for emotional support and encouragement"
            },
            "robot-expert": {
                "name": "Robot Expert", 
                "voice_id": "pNInz6obpgDQGcFmaJgB",
                "prompt": "You are Robot Expert, super smart and loves explaining how things work! You're passionate about technology, science, and learning. You enjoy sharing knowledge and helping others understand complex topics in simple terms.",
                "traits": ["intelligent", "analytical", "explanatory", "curious", "educational"],
                "temperature": 0.6,
                "category": "educational",
                "description": "An expert robot for technical explanations and learning assistance"
            },
            
            # === BUSINESS FUNCTION ROBOTS ===
            "robot-trader": {
                "name": "Robot Trader",
                "voice_id": "pNInz6obpgDQGcFmaJgB",
                "prompt": "You are Robot Trader, a seasoned financial markets expert. You analyze market trends, provide trading insights, and explain complex financial instruments. You speak with confidence and precision, using market terminology naturally. You're data-driven but understand the human psychology of trading.",
                "traits": ["analytical", "confident", "market-savvy", "risk-aware", "precise"],
                "temperature": 0.4,
                "category": "business-finance",
                "description": "Expert trading robot for market analysis and financial insights",
                "tools": ["market_data", "portfolio_analysis", "risk_calculator"],
                "vertical": "finance"
            },
            "robot-hr": {
                "name": "Robot HR",
                "voice_id": "AZnzlk1XvdvUeBnXmlld",
                "prompt": "You are Robot HR, a compassionate human resources expert. You help with employee relations, hiring processes, benefits questions, and workplace policies. You're approachable, professional, and always maintain confidentiality. You understand both company needs and employee concerns.",
                "traits": ["empathetic", "professional", "confidential", "supportive", "policy-focused"],
                "temperature": 0.6,
                "category": "business-hr",
                "description": "Human resources robot for employee support and HR processes",
                "tools": ["employee_lookup", "benefits_calculator", "policy_search"],
                "vertical": "business"
            },
            "robot-payroll": {
                "name": "Robot Payroll",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
                "prompt": "You are Robot Payroll, a meticulous payroll processing expert. You handle salary calculations, tax deductions, benefits administration, and compliance requirements. You're detail-oriented, accurate, and speak clearly about complex payroll matters.",
                "traits": ["detail-oriented", "accurate", "compliant", "systematic", "helpful"],
                "temperature": 0.3,
                "category": "business-finance",
                "description": "Payroll processing robot for salary and benefits calculations",
                "tools": ["payroll_calculator", "tax_lookup", "benefits_processor"],
                "vertical": "business"
            },
            
            # === CONSTRUCTION VERTICAL ===
            "robot-foreman": {
                "name": "Robot Foreman",
                "voice_id": "EXAVITQu4vr4xnSDxMaL",
                "prompt": "You are Robot Foreman, an experienced construction supervisor. You know safety protocols, project scheduling, quality control, and crew management. You speak with authority and practical wisdom, always prioritizing safety first. You've seen it all on job sites.",
                "traits": ["authoritative", "safety-focused", "experienced", "practical", "leadership"],
                "temperature": 0.5,
                "category": "construction",
                "description": "Construction supervisor robot for project management and safety",
                "tools": ["safety_checker", "schedule_manager", "quality_inspector"],
                "vertical": "construction"
            },
            "robot-estimator": {
                "name": "Robot Estimator",
                "voice_id": "pNInz6obpgDQGcFmaJgB",
                "prompt": "You are Robot Estimator, a construction cost analysis expert. You calculate material costs, labor hours, equipment needs, and project timelines. You're precise with numbers and understand market pricing fluctuations. You help make projects profitable.",
                "traits": ["analytical", "precise", "cost-conscious", "detail-oriented", "market-aware"],
                "temperature": 0.3,
                "category": "construction",
                "description": "Construction cost estimator robot for project bidding and budgeting",
                "tools": ["cost_calculator", "material_pricer", "timeline_estimator"],
                "vertical": "construction"
            },
            
            # === HOME SERVICES VERTICAL ===
            "robot-contractor": {
                "name": "Robot Contractor",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
                "prompt": "You are Robot Contractor, a skilled home improvement expert. You help homeowners understand repair needs, renovation options, and maintenance schedules. You're trustworthy, knowledgeable about building codes, and explain technical issues in simple terms.",
                "traits": ["trustworthy", "knowledgeable", "practical", "customer-focused", "code-compliant"],
                "temperature": 0.6,
                "category": "home-services",
                "description": "Home contractor robot for repair and renovation guidance",
                "tools": ["inspection_checklist", "permit_lookup", "material_calculator"],
                "vertical": "home-services"
            },
            "robot-plumber": {
                "name": "Robot Plumber",
                "voice_id": "pNInz6obpgDQGcFmaJgB",
                "prompt": "You are Robot Plumber, a plumbing systems expert. You diagnose water issues, explain pipe problems, and guide through emergency repairs. You're calm under pressure and know when to call for professional help vs. DIY solutions.",
                "traits": ["diagnostic", "calm", "solution-oriented", "safety-aware", "experienced"],
                "temperature": 0.4,
                "category": "home-services",
                "description": "Plumbing expert robot for water system issues and repairs",
                "tools": ["leak_detector", "pressure_calculator", "pipe_sizer"],
                "vertical": "home-services"
            },
            
            # === RENTAL/AIRBNB VERTICAL ===
            "robot-host": {
                "name": "Robot Host",
                "voice_id": "MF3mGyEYCl7XYWbV9V6O",
                "prompt": "You are Robot Host, a hospitality expert for vacation rentals. You help with guest communications, property management, pricing strategies, and creating memorable experiences. You're warm, professional, and understand the guest journey.",
                "traits": ["hospitable", "professional", "guest-focused", "detail-oriented", "welcoming"],
                "temperature": 0.7,
                "category": "rental-hospitality",
                "description": "Vacation rental host robot for guest management and property optimization",
                "tools": ["booking_manager", "pricing_optimizer", "guest_communicator"],
                "vertical": "rental"
            },
            "robot-concierge": {
                "name": "Robot Concierge",
                "voice_id": "AZnzlk1XvdvUeBnXmlld",
                "prompt": "You are Robot Concierge, a local area expert and guest services specialist. You provide recommendations for restaurants, attractions, transportation, and local experiences. You're knowledgeable about the area and genuinely want guests to have amazing stays.",
                "traits": ["knowledgeable", "helpful", "local-expert", "service-oriented", "enthusiastic"],
                "temperature": 0.8,
                "category": "rental-hospitality",
                "description": "Local concierge robot for guest recommendations and area expertise",
                "tools": ["restaurant_finder", "attraction_lookup", "transport_planner"],
                "vertical": "rental"
            },
            "robot-maintenance": {
                "name": "Robot Maintenance",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
                "prompt": "You are Robot Maintenance, a property upkeep specialist for rental properties. You create maintenance schedules, troubleshoot property issues, and coordinate repairs. You're proactive, organized, and help prevent small problems from becoming big ones.",
                "traits": ["proactive", "organized", "problem-solver", "preventive", "efficient"],
                "temperature": 0.4,
                "category": "rental-maintenance",
                "description": "Property maintenance robot for rental upkeep and issue resolution",
                "tools": ["maintenance_scheduler", "issue_tracker", "vendor_coordinator"],
                "vertical": "rental"
            },
        }

    def create_all_robot_configs(self) -> Dict[str, str]:
        """Create configuration files for all robot personalities."""
        personalities = self.get_robot_personalities_config()
        created_files = {}
        
        for robot_id, config in personalities.items():
            file_path = self.save_config(robot_id, config)
            created_files[robot_id] = file_path
            
        return created_files

    def create_custom_robot(
        self,
        robot_id: str,
        name: str,
        voice_id: str,
        prompt: str,
        category: str = "custom",
        traits: Optional[List[str]] = None,
        temperature: float = 0.7,
        description: str = ""
    ) -> str:
        """Create a custom robot plugin configuration."""
        if not robot_id.startswith("robot-"):
            robot_id = f"robot-{robot_id}"
            
        if traits is None:
            traits = []
            
        config = {
            "name": name,
            "voice_id": voice_id,
            "prompt": prompt,
            "traits": traits,
            "temperature": temperature,
            "category": category,
            "description": description or f"A custom {category} robot"
        }
        
        return self.save_config(robot_id, config)

    def list_robots_by_category(self, category: Optional[str] = None) -> Dict[str, List[str]]:
        """List robots organized by category."""
        personalities = self.get_robot_personalities_config()
        
        if category:
            # Return robots from specific category
            robots = [
                robot_id for robot_id, config in personalities.items()
                if config.get('category', '').lower() == category.lower()
            ]
            return {category: robots}
        
        # Return all robots organized by category
        categories: Dict[str, List[str]] = {}
        for robot_id, config in personalities.items():
            cat = config.get('category', 'uncategorized')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(robot_id)
            
        return categories

    def get_available_categories(self) -> List[str]:
        """Get list of all available robot categories."""
        personalities = self.get_robot_personalities_config()
        categories = set()
        
        for config in personalities.values():
            categories.add(config.get('category', 'uncategorized'))
            
        return sorted(list(categories))

    def clone_robot(self, source_robot_id: str, new_robot_id: str, modifications: Optional[Dict[str, Any]] = None) -> str:
        """Clone an existing robot with optional modifications."""
        source_config = self.load_config(source_robot_id)
        if source_config is None:
            raise ValueError(f"Source robot {source_robot_id} not found")
            
        # Ensure new robot ID follows naming convention
        if not new_robot_id.startswith("robot-"):
            new_robot_id = f"robot-{new_robot_id}"
            
        # Apply modifications if provided
        if modifications:
            source_config.update(modifications)
            
        return self.save_config(new_robot_id, source_config)

    def validate_robot_id(self, robot_id: str) -> bool:
        """Validate robot ID follows plugin naming convention."""
        if not isinstance(robot_id, str) or not robot_id.startswith("robot-"):
            return False
            
        # Check for valid characters (alphanumeric, hyphens, underscores)
        import re
        pattern = r'^robot-[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, robot_id))

    def get_robots_by_vertical(self, vertical: str) -> List[Dict[str, Any]]:
        """Get all robots for a specific industry vertical."""
        personalities = self.get_robot_personalities_config()
        vertical_robots = []
        
        for robot_id, config in personalities.items():
            if config.get('vertical', '').lower() == vertical.lower():
                robot_info = config.copy()
                robot_info['robot_id'] = robot_id
                vertical_robots.append(robot_info)
                
        return vertical_robots

    def get_available_verticals(self) -> List[str]:
        """Get list of all available industry verticals."""
        personalities = self.get_robot_personalities_config()
        verticals = set()
        
        for config in personalities.values():
            if 'vertical' in config:
                verticals.add(config['vertical'])
                
        return sorted(list(verticals))

    def get_business_function_robots(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get robots organized by business function."""
        personalities = self.get_robot_personalities_config()
        functions: Dict[str, List[Dict[str, Any]]] = {
            'finance': [],
            'hr': [],
            'operations': [],
            'support': []
        }
        
        for robot_id, config in personalities.items():
            robot_info = config.copy()
            robot_info['robot_id'] = robot_id
            
            # Categorize by business function
            if 'trader' in robot_id or 'payroll' in robot_id or 'finance' in config.get('category', ''):
                functions['finance'].append(robot_info)
            elif 'hr' in robot_id or 'hr' in config.get('category', ''):
                functions['hr'].append(robot_info)
            elif 'foreman' in robot_id or 'estimator' in robot_id or 'maintenance' in robot_id:
                functions['operations'].append(robot_info)
            elif 'host' in robot_id or 'concierge' in robot_id or 'contractor' in robot_id:
                functions['support'].append(robot_info)
                
        return functions

    def create_vertical_team(self, vertical: str, team_name: Optional[str] = None) -> Dict[str, Any]:
        """Create a team configuration for a specific vertical."""
        robots = self.get_robots_by_vertical(vertical)
        
        if not robots:
            raise ValueError(f"No robots found for vertical: {vertical}")
            
        team_config = {
            "team_name": team_name or f"{vertical.title()} Team",
            "vertical": vertical,
            "robots": robots,
            "coordinator": robots[0]['robot_id'] if robots else None,  # First robot as coordinator
            "collaboration_rules": {
                "primary_contact": robots[0]['robot_id'] if robots else None,
                "escalation_path": [r['robot_id'] for r in robots],
                "voice_activation_phrases": [
                    f"get me the {vertical} team",
                    f"I need help with {vertical}",
                    f"connect me to {vertical} experts"
                ]
            }
        }
        
        return team_config

    def get_voice_interaction_patterns(self) -> Dict[str, List[str]]:
        """Get voice interaction patterns for discovering robots."""
        personalities = self.get_robot_personalities_config()
        patterns: Dict[str, List[str]] = {
            'by_function': [],
            'by_vertical': [],
            'by_expertise': [],
            'general_queries': []
        }
        
        # Function-based patterns
        patterns['by_function'].extend([
            "I need help with trading",
            "Connect me to HR",
            "Get me payroll support",
            "I have a finance question"
        ])
        
        # Vertical-based patterns  
        for vertical in self.get_available_verticals():
            patterns['by_vertical'].append(f"I need {vertical} expertise")
            patterns['by_vertical'].append(f"Get me the {vertical} team")
            
        # Expertise-based patterns
        for robot_id, config in personalities.items():
            robot_name = config['name']
            patterns['by_expertise'].append(f"Connect me to {robot_name}")
            patterns['by_expertise'].append(f"I need to talk to {robot_name}")
            
        # General discovery patterns
        patterns['general_queries'].extend([
            "What robots are available?",
            "Show me all teams",
            "What verticals do you support?",
            "Who can help me with business questions?"
        ])
        
        return patterns

    def find_robot_by_query(self, query: str) -> List[Dict[str, Any]]:
        """Find appropriate robots based on natural language query."""
        query_lower = query.lower()
        personalities = self.get_robot_personalities_config()
        matches = []
        
        for robot_id, config in personalities.items():
            match_score = 0
            match_reasons = []
            
            # Direct name match (high priority)
            if config['name'].lower() in query_lower:
                match_score += 10
                match_reasons.append(f"robot name '{config['name']}'")
            
            # Robot type match (high priority)
            robot_type = robot_id.replace('robot-', '')
            if robot_type in query_lower:
                match_score += 8
                match_reasons.append(f"robot type '{robot_type}'")
            
            # Vertical match (high priority)
            if config.get('vertical') and config['vertical'].lower() in query_lower:
                match_score += 8
                match_reasons.append(f"vertical '{config['vertical']}'")
                
            # Category match (medium priority)
            if config.get('category'):
                category_parts = config['category'].lower().split('-')
                for part in category_parts:
                    if part in query_lower:
                        match_score += 5
                        match_reasons.append(f"category '{part}'")
                        break
            
            # Trait match (medium priority)
            matched_traits = [trait for trait in config.get('traits', []) if trait in query_lower]
            if matched_traits:
                match_score += 3 * len(matched_traits)
                match_reasons.append(f"traits {matched_traits}")
            
            # Description keyword match (low priority)  
            description_keywords = ['trading', 'payroll', 'hr', 'construction', 'plumber', 'plumbing', 'host', 'hosting', 'maintenance', 'rental', 'airbnb', 'vacation', 'property', 'finance', 'financial']
            for keyword in description_keywords:
                if keyword in query_lower and (keyword in config.get('description', '').lower() or keyword in robot_id):
                    match_score += 2
                    match_reasons.append(f"description keyword '{keyword}'")
            
            # Only include robots with meaningful matches
            if match_score >= 3:
                match_info = config.copy()
                match_info['robot_id'] = robot_id  
                match_info['match_score'] = match_score
                match_info['match_reasons'] = match_reasons
                matches.append(match_info)
        
        # Sort by match score (highest first)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches

    def _get_match_reason(self, query: str, robot_id: str, config: Dict[str, Any]) -> str:
        """Determine why a robot matched the query."""
        if config['name'].lower() in query:
            return f"Matched robot name: {config['name']}"
        elif robot_id.replace('robot-', '') in query:
            return f"Matched robot type: {robot_id.replace('robot-', '')}"
        elif config.get('vertical', '').lower() in query:
            return f"Matched vertical: {config.get('vertical')}"
        elif config.get('category', '').lower() in query:
            return f"Matched category: {config.get('category')}"
        else:
            matched_traits = [trait for trait in config.get('traits', []) if trait in query]
            return f"Matched traits: {', '.join(matched_traits)}"

    def update_config(self, personality_id: str, updates: Dict[str, Any]) -> bool:
        """Update existing agent configuration."""
        config = self.load_config(personality_id)
        if config is None:
            return False
            
        # Deep merge updates
        def deep_merge(base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
            for key, value in updates.items():
                if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                    deep_merge(base[key], value)
                else:
                    base[key] = value
            return base
            
        updated_config = deep_merge(config, updates)
        
        if not self.validate_config(updated_config):
            return False
            
        self.save_config(personality_id, updated_config)
        return True

    def delete_config(self, personality_id: str) -> bool:
        """Delete agent configuration file."""
        config_path = self.config_dir / f"{personality_id}.json"
        
        if config_path.exists():
            try:
                config_path.unlink()
                return True
            except OSError:
                return False
        return False

    def list_configs(self) -> List[str]:
        """List all available agent configuration files."""
        if not self.config_dir.exists():
            return []
            
        config_files = []
        for file_path in self.config_dir.glob("*.json"):
            config_files.append(file_path.stem)
            
        return sorted(config_files)