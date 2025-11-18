"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { soundManager } from '@/lib/sound-manager';
import { Volume2, VolumeX, Vibrate, Play } from 'lucide-react';

interface SoundSettingsProps {
  className?: string;
}

export function SoundSettings({ className = '' }: SoundSettingsProps) {
  const [settings, setSettings] = useState(soundManager.getSettings());

  // Sync state with sound manager
  useEffect(() => {
    setSettings(soundManager.getSettings());
  }, []);

  const updateEnabled = (enabled: boolean) => {
    soundManager.setEnabled(enabled);
    setSettings(prev => ({ ...prev, enabled }));
  };

  const updateHaptic = (enabled: boolean) => {
    soundManager.setHapticEnabled(enabled);
    setSettings(prev => ({ ...prev, hapticEnabled: enabled }));
  };

  const updateVolume = (volume: number) => {
    soundManager.setVolume(volume);
    setSettings(prev => ({ ...prev, volume }));
  };

  const testSounds = async () => {
    await soundManager.testSounds();
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <h3 className="font-medium">Sound & Haptics</h3>

      {/* Sound enabled toggle */}
      <label className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {settings.enabled ? (
            <Volume2 className="h-4 w-4 text-gray-600" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm">Sound Effects</span>
        </div>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => updateEnabled(e.target.checked)}
          className="w-5 h-5 rounded"
          aria-label="Enable sound effects"
        />
      </label>

      {/* Volume slider */}
      {settings.enabled && (
        <div className="pl-6">
          <label className="text-xs text-gray-500 block mb-1">
            Volume: {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => updateVolume(parseFloat(e.target.value))}
            className="w-full"
            aria-label="Volume level"
          />
        </div>
      )}

      {/* Haptic feedback toggle */}
      <label className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vibrate className={`h-4 w-4 ${settings.hapticEnabled ? 'text-gray-600' : 'text-gray-400'}`} />
          <span className="text-sm">Haptic Feedback</span>
        </div>
        <input
          type="checkbox"
          checked={settings.hapticEnabled}
          onChange={(e) => updateHaptic(e.target.checked)}
          className="w-5 h-5 rounded"
          aria-label="Enable haptic feedback"
        />
      </label>

      {/* Test button */}
      {settings.enabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={testSounds}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Test Sounds
        </Button>
      )}
    </Card>
  );
}
