// Client-side Analytics Tracker
// Tracks user interactions and performance metrics

type EventType =
  | 'page_view'
  | 'chat_message'
  | 'voice_input'
  | 'tts_playback'
  | 'error'
  | 'performance';

interface AnalyticsEvent {
  eventType: EventType;
  eventData: Record<string, unknown>;
  sessionId?: string;
  timestamp: number;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 50;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();

    // Flush queue periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track an analytics event
   */
  track(eventType: EventType, eventData: Record<string, unknown> = {}): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      eventType,
      eventData: {
        ...eventData,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    this.queue.push(event);

    // Auto-flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  pageView(pageName?: string): void {
    this.track('page_view', {
      pageName: pageName || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });
  }

  /**
   * Track chat message
   */
  chatMessage(messageLength: number, responseTimeMs: number, cached: boolean): void {
    this.track('chat_message', {
      messageLength,
      responseTimeMs,
      cached
    });
  }

  /**
   * Track voice input
   */
  voiceInput(duration: number, transcriptLength: number): void {
    this.track('voice_input', {
      duration,
      transcriptLength
    });
  }

  /**
   * Track TTS playback
   */
  ttsPlayback(textLength: number, audioSize: number, latencyMs: number): void {
    this.track('tts_playback', {
      textLength,
      audioSize,
      latencyMs
    });
  }

  /**
   * Track error
   */
  error(errorType: string, message: string, stack?: string): void {
    this.track('error', {
      errorType,
      message,
      stack
    });
  }

  /**
   * Track performance metric
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit
    });
  }

  /**
   * Flush queued events to the server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send events in batches
      for (const event of events) {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.error('Failed to flush analytics:', error);
      // Re-queue failed events
      this.queue.unshift(...events);
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience exports
export const trackEvent = analytics.track.bind(analytics);
export const trackPageView = analytics.pageView.bind(analytics);
export const trackChatMessage = analytics.chatMessage.bind(analytics);
export const trackVoiceInput = analytics.voiceInput.bind(analytics);
export const trackTTSPlayback = analytics.ttsPlayback.bind(analytics);
export const trackError = analytics.error.bind(analytics);
export const trackPerformance = analytics.performance.bind(analytics);
