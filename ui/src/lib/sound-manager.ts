// Sound Manager
// Handles sound effects and haptic feedback for the application

export type SoundEffect =
  | 'message-sent'
  | 'message-received'
  | 'voice-start'
  | 'voice-end'
  | 'error'
  | 'success'
  | 'click'
  | 'notification';

// Sound configurations using Web Audio API tones
const soundConfigs: Record<SoundEffect, { frequency: number; duration: number; type: OscillatorType }> = {
  'message-sent': { frequency: 600, duration: 100, type: 'sine' },
  'message-received': { frequency: 800, duration: 150, type: 'sine' },
  'voice-start': { frequency: 440, duration: 200, type: 'triangle' },
  'voice-end': { frequency: 330, duration: 200, type: 'triangle' },
  'error': { frequency: 200, duration: 300, type: 'square' },
  'success': { frequency: 880, duration: 200, type: 'sine' },
  'click': { frequency: 1000, duration: 50, type: 'sine' },
  'notification': { frequency: 700, duration: 100, type: 'sine' },
};

// Haptic patterns (in milliseconds)
const hapticPatterns: Record<SoundEffect, number[]> = {
  'message-sent': [50],
  'message-received': [30, 30, 30],
  'voice-start': [100],
  'voice-end': [50, 50],
  'error': [100, 50, 100],
  'success': [50, 50, 50],
  'click': [10],
  'notification': [50, 30, 50],
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private hapticEnabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    // Load preferences from localStorage
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('sound-enabled');
      const savedHaptic = localStorage.getItem('haptic-enabled');
      const savedVolume = localStorage.getItem('sound-volume');

      if (savedEnabled !== null) this.enabled = savedEnabled === 'true';
      if (savedHaptic !== null) this.hapticEnabled = savedHaptic === 'true';
      if (savedVolume !== null) this.volume = parseFloat(savedVolume);
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a sound effect
   */
  play(effect: SoundEffect): void {
    if (!this.enabled || typeof window === 'undefined') return;

    const config = soundConfigs[effect];
    if (!config) return;

    try {
      const ctx = this.getAudioContext();

      // Create oscillator for the tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      // Set up volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration / 1000);

      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration / 1000);

      // Trigger haptic feedback
      this.triggerHaptic(effect);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  /**
   * Trigger haptic feedback
   */
  triggerHaptic(effect: SoundEffect): void {
    if (!this.hapticEnabled || typeof navigator === 'undefined') return;

    const pattern = hapticPatterns[effect];
    if (!pattern) return;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Haptic feedback not supported or failed
      }
    }
  }

  /**
   * Enable/disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound-enabled', String(enabled));
    }
  }

  /**
   * Enable/disable haptic feedback
   */
  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('haptic-enabled', String(enabled));
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound-volume', String(this.volume));
    }
  }

  /**
   * Get current settings
   */
  getSettings(): { enabled: boolean; hapticEnabled: boolean; volume: number } {
    return {
      enabled: this.enabled,
      hapticEnabled: this.hapticEnabled,
      volume: this.volume,
    };
  }

  /**
   * Test all sounds
   */
  async testSounds(): Promise<void> {
    const effects: SoundEffect[] = [
      'click',
      'message-sent',
      'message-received',
      'success',
    ];

    for (const effect of effects) {
      this.play(effect);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playSound = (effect: SoundEffect) => soundManager.play(effect);
export const triggerHaptic = (effect: SoundEffect) => soundManager.triggerHaptic(effect);
