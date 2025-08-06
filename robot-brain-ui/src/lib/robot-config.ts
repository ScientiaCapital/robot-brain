// Dynamic robot configuration system using config files
import { getAgentConfig, getCurrentPersonality } from './config';

export interface RobotPersonality {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  systemPrompt: string;
  voiceId: string;
  welcomeMessage: string;
  traits: string[];
  tools?: string[];
}

export type RobotId = string;

export const ROBOT_TOOLS = {
  'calculator': {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    icon: '🧮'
  },
  'weather': {
    id: 'weather', 
    name: 'Weather',
    description: 'Get current weather information',
    icon: '🌤️'
  },
  'timer': {
    id: 'timer',
    name: 'Timer',
    description: 'Set timers and alarms',
    icon: '⏰'
  }
};

// Generate robot personalities dynamically from configuration
export const ROBOT_PERSONALITIES: Record<string, RobotPersonality> = (() => {
  try {
    const config = getAgentConfig();
    const personality = getCurrentPersonality();
    
    return {
      [config.personality]: {
        id: config.personality,
        name: config.agentName,
        emoji: config.emoji,
        description: personality.description,
        systemPrompt: personality.systemPrompt,
        voiceId: config.voiceId,
        welcomeMessage: config.welcomeMessage,
        traits: config.traits,
        tools: []
      }
    };
  } catch (error) {
    // Fallback configuration if config files are not accessible
    console.warn('Using fallback robot configuration:', error);
    return {
      'robot-friend': {
        id: 'robot-friend',
        name: 'Robot Friend',
        emoji: '😊',
        description: 'A cheerful and supportive companion',
        systemPrompt: `You are Robot Friend, a cheerful and supportive AI assistant. You are always positive, encouraging, and helpful. Keep responses concise and engaging.`,
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        welcomeMessage: "Hi there! I'm Robot Friend! 😊 What would you like to chat about?",
        traits: ['cheerful', 'supportive', 'enthusiastic'],
        tools: []
      }
    };
  }
})();

// Default robot is now dynamic based on configuration
export const DEFAULT_ROBOT = (() => {
  try {
    const config = getAgentConfig();
    return config.personality;
  } catch {
    return 'robot-friend';
  }
})();

export function getRobotPersonality(id: string): RobotPersonality | undefined {
  return ROBOT_PERSONALITIES[id];
}

export function getAllRobots(): RobotPersonality[] {
  return Object.values(ROBOT_PERSONALITIES);
}

// Template helper functions
export function getConfiguredRobot(): RobotPersonality {
  const defaultId = DEFAULT_ROBOT;
  return ROBOT_PERSONALITIES[defaultId] || Object.values(ROBOT_PERSONALITIES)[0];
}