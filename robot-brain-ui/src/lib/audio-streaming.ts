// Audio streaming utilities for ElevenLabs TTS

export interface AudioStreamOptions {
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export class AudioStreamManager {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Initialize audio context (required for browsers)
  async initialize(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Add audio chunk to queue
  async addAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error decoding audio data:', error);
    }
  }

  // Play next audio buffer in queue
  private playNextInQueue(): void {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);
    
    this.currentSource.onended = () => {
      this.playNextInQueue();
    };

    this.currentSource.start();
  }

  // Stop all audio playback
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    
    this.audioQueue = [];
    this.isPlaying = false;
  }

  // Get audio context state
  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  // Cleanup resources
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create singleton instance
let audioStreamManager: AudioStreamManager | null = null;

export function getAudioStreamManager(): AudioStreamManager {
  if (!audioStreamManager) {
    audioStreamManager = new AudioStreamManager();
  }
  return audioStreamManager;
}

// ElevenLabs streaming configuration
export const ELEVENLABS_STREAM_CONFIG = {
  optimizeStreamingLatency: 1, // 0-4, lower = faster
  outputFormat: 'mp3_44100_128',
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.8,
    style: 0.0,
    useSpeakerBoost: true
  }
};

// Audio streaming metrics interface
export interface AudioStreamingMetrics {
  bufferSize: number;
  playbackTime: number;
  downloadTime: number;
  firstByteLatency: number;
}

// Stream TTS audio function
export async function streamTTSAudio(
  text: string,
  voiceId: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const response = await fetch('/api/voice/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, personality: 'robot-friend' }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }

  const audioManager = getAudioStreamManager();
  await audioManager.initialize();

  const reader = response.body?.getReader();
  if (!reader) return;

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    loaded += value.length;
    if (onProgress && total > 0) {
      onProgress(loaded / total);
    }

    await audioManager.addAudioChunk(value.buffer);
  }
}