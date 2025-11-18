// Session Persistence
// Saves and restores chat session state for continuity

export interface SessionState {
  sessionId: string;
  robotId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  draftMessage: string;
  scrollPosition: number;
  conversationMode: 'text' | 'voice';
  lastActive: number;
}

const STORAGE_KEY = 'robot-brain-session';
const MAX_MESSAGES_TO_PERSIST = 50;
const SESSION_EXPIRY_HOURS = 24;

class SessionPersistence {
  /**
   * Save current session state
   */
  save(state: Partial<SessionState>): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.load();
      const updated: SessionState = {
        sessionId: state.sessionId || existing?.sessionId || `session-${Date.now()}`,
        robotId: state.robotId || existing?.robotId || 'robot-friend',
        messages: state.messages || existing?.messages || [],
        draftMessage: state.draftMessage ?? existing?.draftMessage ?? '',
        scrollPosition: state.scrollPosition ?? existing?.scrollPosition ?? 0,
        conversationMode: state.conversationMode || existing?.conversationMode || 'voice',
        lastActive: Date.now(),
      };

      // Limit messages to persist
      if (updated.messages.length > MAX_MESSAGES_TO_PERSIST) {
        updated.messages = updated.messages.slice(-MAX_MESSAGES_TO_PERSIST);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load saved session state
   */
  load(): SessionState | null {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const state: SessionState = JSON.parse(saved);

      // Check if session has expired
      const hoursAgo = (Date.now() - state.lastActive) / (1000 * 60 * 60);
      if (hoursAgo > SESSION_EXPIRY_HOURS) {
        this.clear();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear saved session
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if there's a resumable session
   */
  hasResumableSession(): boolean {
    const session = this.load();
    return session !== null && session.messages.length > 0;
  }

  /**
   * Get session age in human-readable format
   */
  getSessionAge(): string {
    const session = this.load();
    if (!session) return '';

    const minutesAgo = Math.floor((Date.now() - session.lastActive) / (1000 * 60));

    if (minutesAgo < 1) return 'just now';
    if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;

    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  }

  /**
   * Save draft message
   */
  saveDraft(message: string): void {
    this.save({ draftMessage: message });
  }

  /**
   * Save scroll position
   */
  saveScrollPosition(position: number): void {
    this.save({ scrollPosition: position });
  }

  /**
   * Get message count in saved session
   */
  getMessageCount(): number {
    const session = this.load();
    return session?.messages.length ?? 0;
  }
}

// Singleton instance
export const sessionPersistence = new SessionPersistence();
