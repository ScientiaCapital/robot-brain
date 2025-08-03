export interface RobotPersonality {
  id: string;
  name: string;
  emoji: string;
  description: string;
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

export const ROBOT_PERSONALITIES: Record<string, RobotPersonality> = {
  'robot-friend': {
    id: 'robot-friend',
    name: 'Robot Friend',
    emoji: '😊',
    description: 'A cheerful and supportive companion for kids',
    systemPrompt: `You are Robot Friend, a cheerful and supportive robot assistant for kids. You are always positive, encouraging, and helpful. You love to learn new things and share fun facts. You speak in a friendly, enthusiastic way that's easy for children to understand. You never use scary or negative language. Always be patient and kind.`,
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice from ElevenLabs
    welcomeMessage: "Hi there! I'm Robot Friend! 😊 I'm so excited to chat with you today! What would you like to talk about?",
    traits: ['cheerful', 'supportive', 'enthusiastic'],
    tools: []
  }
};

export const DEFAULT_ROBOT = 'robot-friend';

export function getRobotPersonality(id: string): RobotPersonality | undefined {
  return ROBOT_PERSONALITIES[id];
}

export function getAllRobots(): RobotPersonality[] {
  return Object.values(ROBOT_PERSONALITIES);
}