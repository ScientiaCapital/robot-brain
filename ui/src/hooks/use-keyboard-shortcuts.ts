"use client"

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape and some special keys even in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Default shortcuts for the chat application
export function getDefaultChatShortcuts(actions: {
  focusInput?: () => void;
  toggleVoice?: () => void;
  stopSpeaking?: () => void;
  clearChat?: () => void;
  openHistory?: () => void;
  openSettings?: () => void;
  sendMessage?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.focusInput) {
    shortcuts.push({
      key: '/',
      action: actions.focusInput,
      description: 'Focus message input'
    });
  }

  if (actions.toggleVoice) {
    shortcuts.push({
      key: 'v',
      ctrlKey: true,
      action: actions.toggleVoice,
      description: 'Toggle voice mode'
    });
  }

  if (actions.stopSpeaking) {
    shortcuts.push({
      key: 'Escape',
      action: actions.stopSpeaking,
      description: 'Stop speaking'
    });
  }

  if (actions.clearChat) {
    shortcuts.push({
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      action: actions.clearChat,
      description: 'Clear chat'
    });
  }

  if (actions.openHistory) {
    shortcuts.push({
      key: 'h',
      ctrlKey: true,
      action: actions.openHistory,
      description: 'Open history'
    });
  }

  if (actions.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      action: actions.openSettings,
      description: 'Open settings'
    });
  }

  if (actions.sendMessage) {
    shortcuts.push({
      key: 'Enter',
      ctrlKey: true,
      action: actions.sendMessage,
      description: 'Send message'
    });
  }

  return shortcuts;
}

// Format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.metaKey) parts.push('Cmd');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}
