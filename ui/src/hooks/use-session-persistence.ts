"use client"

import { useEffect, useRef, useCallback } from 'react';
import { sessionPersistence, type SessionState } from '@/lib/session-persistence';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseSessionPersistenceOptions {
  sessionId: string;
  robotId: string;
  messages: Message[];
  conversationMode: 'text' | 'voice';
  enabled?: boolean;
  autoSaveInterval?: number;
}

export function useSessionPersistence({
  sessionId,
  robotId,
  messages,
  conversationMode,
  enabled = true,
  autoSaveInterval = 5000,
}: UseSessionPersistenceOptions) {
  const scrollRef = useRef<HTMLElement | null>(null);

  // Save session state
  const save = useCallback(() => {
    if (!enabled) return;

    const scrollPosition = scrollRef.current?.scrollTop || 0;

    sessionPersistence.save({
      sessionId,
      robotId,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
      })),
      scrollPosition,
      conversationMode,
    });
  }, [sessionId, robotId, messages, conversationMode, enabled]);

  // Auto-save on changes
  useEffect(() => {
    save();
  }, [save]);

  // Auto-save periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(save, autoSaveInterval);
    return () => clearInterval(interval);
  }, [save, enabled, autoSaveInterval]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleUnload = () => save();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [save, enabled]);

  // Save draft message
  const saveDraft = useCallback((message: string) => {
    if (!enabled) return;
    sessionPersistence.saveDraft(message);
  }, [enabled]);

  // Set scroll container ref
  const setScrollRef = useCallback((element: HTMLElement | null) => {
    scrollRef.current = element;

    // Restore scroll position
    if (element) {
      const session = sessionPersistence.load();
      if (session?.scrollPosition) {
        element.scrollTop = session.scrollPosition;
      }
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (!enabled || !scrollRef.current) return;
    sessionPersistence.saveScrollPosition(scrollRef.current.scrollTop);
  }, [enabled]);

  // Clear session
  const clearSession = useCallback(() => {
    sessionPersistence.clear();
  }, []);

  return {
    save,
    saveDraft,
    setScrollRef,
    handleScroll,
    clearSession,
    hasResumableSession: sessionPersistence.hasResumableSession,
    loadSession: sessionPersistence.load,
  };
}
