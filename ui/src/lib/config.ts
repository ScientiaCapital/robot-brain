// Agent Configuration
// Central configuration for AI model and voice settings

export interface AgentConfig {
  modelSettings: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
  voiceId: string;
  voiceSettings: {
    model: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
}

const defaultConfig: AgentConfig = {
  modelSettings: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 100,
    temperature: 0.3,
  },
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
  voiceSettings: {
    model: 'eleven_flash_v2_5',
    stability: 0.5,
    similarityBoost: 0.8,
    style: 0,
    useSpeakerBoost: true,
  },
};

/**
 * Get the agent configuration
 */
export function getAgentConfig(): AgentConfig {
  return {
    ...defaultConfig,
    modelSettings: {
      ...defaultConfig.modelSettings,
      model: process.env.ANTHROPIC_MODEL || defaultConfig.modelSettings.model,
      maxTokens: parseInt(process.env.MAX_TOKENS || String(defaultConfig.modelSettings.maxTokens)),
      temperature: parseFloat(process.env.TEMPERATURE || String(defaultConfig.modelSettings.temperature)),
    },
    voiceId: process.env.ELEVENLABS_VOICE_ID || defaultConfig.voiceId,
  };
}
