// Audio streaming utilities for Cartesia TTS
import { getAgentConfig } from './config';
import { getSimpleAudioPlayer } from './simple-audio-player';

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
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

// Get Cartesia streaming configuration from agent config
export function getCartesiaStreamConfig() {
  const config = getAgentConfig();
  return {
    model: config.voiceSettings.model || 'sonic-2',
    outputFormat: {
      container: 'mp3',
      sampleRate: config.voiceSettings.sampleRate || 44100,
      bitRate: 128000
    },
    language: config.voiceSettings.language || 'en'
  };
}

// Audio streaming metrics interface and implementation
export interface AudioStreamingMetricsStats {
  totalRequests: number;
  totalErrors: number;
  totalLatency: number;
  totalFirstByteLatency: number;
  totalChunks: number;
  averageLatency: number;
  averageFirstByteLatency: number;
  averageChunksPerRequest: number;
  errorRate: number;
  errorTypes: Record<string, number>;
}

class AudioStreamingMetricsImpl {
  private requests: Array<{
    startTime: number;
    endTime: number;
    firstByteTime?: number;
    chunks?: number;
  }> = [];

  private errors: Array<{
    timestamp: number;
    error: string;
  }> = [];

  recordRequest(
    startTime: number,
    endTime: number,
    firstByteTime?: number,
    chunks?: number
  ): void {
    this.requests.push({
      startTime,
      endTime,
      firstByteTime,
      chunks
    });
  }

  recordError(error: string): void {
    this.errors.push({
      timestamp: Date.now(),
      error
    });
  }

  getStats(): AudioStreamingMetricsStats {
    const totalRequests = this.requests.length;
    const totalErrors = this.errors.length;

    if (totalRequests === 0 && totalErrors === 0) {
      return {
        totalRequests: 0,
        totalErrors: 0,
        totalLatency: 0,
        totalFirstByteLatency: 0,
        totalChunks: 0,
        averageLatency: 0,
        averageFirstByteLatency: 0,
        averageChunksPerRequest: 0,
        errorRate: 0,
        errorTypes: {}
      };
    }

    const totalLatency = this.requests.reduce(
      (sum, req) => sum + (req.endTime - req.startTime),
      0
    );

    const firstByteLatencies = this.requests
      .filter(req => req.firstByteTime)
      .map(req => req.firstByteTime! - req.startTime);

    const totalFirstByteLatency = firstByteLatencies.reduce((sum, lat) => sum + lat, 0);

    const chunksData = this.requests.filter(req => req.chunks !== undefined);
    const totalChunks = chunksData.reduce((sum, req) => sum + (req.chunks || 0), 0);

    const errorTypes: Record<string, number> = {};
    this.errors.forEach(error => {
      errorTypes[error.error] = (errorTypes[error.error] || 0) + 1;
    });

    const totalOperations = totalRequests + totalErrors;
    const errorRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;

    return {
      totalRequests,
      totalErrors,
      totalLatency,
      totalFirstByteLatency,
      totalChunks,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      averageFirstByteLatency: firstByteLatencies.length > 0 ? totalFirstByteLatency / firstByteLatencies.length : 0,
      averageChunksPerRequest: chunksData.length > 0 ? totalChunks / chunksData.length : 0,
      errorRate,
      errorTypes
    };
  }

  reset(): void {
    this.requests = [];
    this.errors = [];
  }
}

// Create singleton instance
const audioStreamingMetrics = new AudioStreamingMetricsImpl();

export const AudioStreamingMetrics = audioStreamingMetrics;

// Stream TTS audio callbacks interface
export interface StreamTTSCallbacks {
  onStart?: () => void;
  onChunk?: (chunk: Uint8Array, loaded: number, total: number) => void;
  onComplete?: (totalBytes: number, duration: number) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

// Stream TTS audio function using Cartesia API
export async function streamTTSAudio(
  text: string,
  voiceId: string,
  callbacks?: StreamTTSCallbacks
): Promise<void> {
  const startTime = Date.now();
  let firstByteTime: number | undefined;

  try {
    // Call onStart callback
    callbacks?.onStart?.();

    const response = await fetch('/api/voice/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        personality: 'cheerful' // Required by validation schema
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Failed to generate speech: ${response.status} ${response.statusText} - ${errorText}`);
      callbacks?.onError?.(error);
      AudioStreamingMetrics.recordError(error.message);
      return;
    }

    // Parse JSON response containing base64 audio
    const data = await response.json();

    if (!data.audio) {
      const error = new Error('No audio data received from TTS API');
      callbacks?.onError?.(error);
      AudioStreamingMetrics.recordError(error.message);
      return;
    }

    // Record first byte time
    firstByteTime = Date.now();

    // Use simple audio player for base64 data
    const audioPlayer = getSimpleAudioPlayer();

    await audioPlayer.playBase64Audio(data.audio, data.contentType || 'audio/mpeg', {
      onStart: () => {
        console.log('TTS audio playback started');
      },
      onEnd: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        AudioStreamingMetrics.recordRequest(startTime, endTime, firstByteTime, 1);
        callbacks?.onComplete?.(data.chunkSize || 0, duration);
        console.log(`TTS audio playback completed in ${duration}ms`);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
        AudioStreamingMetrics.recordError(error.message);
        console.error('TTS audio playback error:', error);
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(err);
    AudioStreamingMetrics.recordError(err.message);
  }
}
