// Simple HTML5 Audio Player for TTS base64 audio
export class SimpleAudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  async playBase64Audio(
    base64Data: string, 
    contentType: string = 'audio/mpeg',
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();
      
      // Create data URL from base64
      const audioUrl = `data:${contentType};base64,${base64Data}`;
      
      // Create and configure audio element
      this.audioElement = new Audio(audioUrl);
      this.audioElement.preload = 'auto';
      
      // Set up event listeners
      this.audioElement.onloadstart = () => {
        callbacks?.onStart?.();
      };
      
      this.audioElement.onended = () => {
        this.isPlaying = false;
        callbacks?.onEnd?.();
      };
      
      this.audioElement.onerror = (e) => {
        const error = new Error(`Audio playback failed: ${this.audioElement?.error?.message || 'Unknown error'}`);
        callbacks?.onError?.(error);
        this.isPlaying = false;
      };
      
      // Handle user interaction requirement for autoplay
      this.isPlaying = true;
      const playPromise = this.audioElement.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      this.isPlaying = false;
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      
      // Handle autoplay restrictions
      if (err.name === 'NotAllowedError') {
        console.warn('Audio autoplay blocked. User interaction required.');
      }
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    this.isPlaying = false;
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Create singleton instance
let simpleAudioPlayer: SimpleAudioPlayer | null = null;

export function getSimpleAudioPlayer(): SimpleAudioPlayer {
  if (!simpleAudioPlayer) {
    simpleAudioPlayer = new SimpleAudioPlayer();
  }
  return simpleAudioPlayer;
}