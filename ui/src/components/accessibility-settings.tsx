"use client"

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/contexts/accessibility-context';
import { formatShortcut, getDefaultChatShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { X, RotateCcw } from 'lucide-react';

interface AccessibilitySettingsProps {
  onClose?: () => void;
  className?: string;
}

export function AccessibilitySettings({ onClose, className = '' }: AccessibilitySettingsProps) {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  // Get shortcuts for display
  const shortcuts = getDefaultChatShortcuts({
    focusInput: () => {},
    toggleVoice: () => {},
    stopSpeaking: () => {},
    openHistory: () => {},
  });

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Accessibility Settings</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetSettings} title="Reset to defaults">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Visual Settings */}
        <section>
          <h3 className="font-medium mb-3">Visual</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reduce Motion</p>
                <p className="text-xs text-gray-500">Minimize animations</p>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                className="w-5 h-5 rounded"
                aria-label="Reduce motion"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">High Contrast</p>
                <p className="text-xs text-gray-500">Increase color contrast</p>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSetting('highContrast', e.target.checked)}
                className="w-5 h-5 rounded"
                aria-label="High contrast mode"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Large Text</p>
                <p className="text-xs text-gray-500">Increase text size</p>
              </div>
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => updateSetting('largeText', e.target.checked)}
                className="w-5 h-5 rounded"
                aria-label="Large text"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Screen Reader Optimized</p>
                <p className="text-xs text-gray-500">Enhanced ARIA labels</p>
              </div>
              <input
                type="checkbox"
                checked={settings.screenReaderOptimized}
                onChange={(e) => updateSetting('screenReaderOptimized', e.target.checked)}
                className="w-5 h-5 rounded"
                aria-label="Screen reader optimization"
              />
            </label>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
          <Card className="p-3">
            <ul className="space-y-2 text-sm">
              {shortcuts.map((shortcut, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-600">{shortcut.description}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                    {formatShortcut(shortcut)}
                  </kbd>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}

// Skip to content link for keyboard navigation
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-50
        focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
      "
    >
      Skip to main content
    </a>
  );
}
