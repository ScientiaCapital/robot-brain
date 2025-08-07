"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Play, 
  Pause,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoiceState {
  mode: 'idle' | 'listening' | 'speaking' | 'thinking' | 'error';
  transcript?: string;
  confidence?: number;
  error?: string;
}

interface EnhancedVoiceInterfaceProps {
  isVoiceEnabled: boolean;
  onVoiceToggle: () => void;
  voiceState: VoiceState;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  robotName: string;
  robotEmoji: string;
  className?: string;
}

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({
  isVoiceEnabled,
  onVoiceToggle,
  voiceState,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  robotName,
  robotEmoji,
  className = ''
}) => {
  const [audioVisualizerActive, setAudioVisualizerActive] = useState(false);

  const stateConfig = {
    idle: { 
      color: 'bg-slate-500 hover:bg-slate-600', 
      icon: '👂', 
      text: 'Ready to listen',
      animation: 'none'
    },
    listening: { 
      color: 'bg-red-500 hover:bg-red-600 animate-pulse', 
      icon: '🎤', 
      text: 'Listening...',
      animation: 'pulse'
    },
    thinking: { 
      color: 'bg-yellow-500 hover:bg-yellow-600', 
      icon: '🤔', 
      text: 'Thinking...',
      animation: 'spin'
    },
    speaking: { 
      color: 'bg-blue-500 hover:bg-blue-600', 
      icon: '🔊', 
      text: 'Speaking...',
      animation: 'bounce'
    },
    error: {
      color: 'bg-red-600 hover:bg-red-700',
      icon: '⚠️',
      text: 'Error occurred',
      animation: 'shake'
    }
  };

  const currentState = stateConfig[voiceState.mode];

  // Activate audio visualizer during listening and speaking
  useEffect(() => {
    setAudioVisualizerActive(voiceState.mode === 'listening' || voiceState.mode === 'speaking');
  }, [voiceState.mode]);

  const handleMainButtonClick = useCallback(() => {
    if (voiceState.mode === 'listening') {
      onStopListening();
    } else if (voiceState.mode === 'speaking') {
      onStopSpeaking();
    } else if (voiceState.mode === 'idle') {
      onStartListening();
    }
  }, [voiceState.mode, onStopListening, onStopSpeaking, onStartListening]);

  const getMainButtonIcon = () => {
    switch (voiceState.mode) {
      case 'listening':
        return <Square className="h-5 w-5" />;
      case 'speaking':
        return <Pause className="h-5 w-5" />;
      case 'thinking':
        return <div className="animate-spin">🤔</div>;
      default:
        return <Mic className="h-5 w-5" />;
    }
  };

  const getMainButtonVariant = () => {
    switch (voiceState.mode) {
      case 'listening':
      case 'speaking':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      {/* Robot Header */}
      <div className="text-center space-y-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-4xl mx-auto w-fit"
        >
          {robotEmoji}
        </motion.div>
        <h3 className="text-lg font-semibold">{robotName}</h3>
      </div>

      {/* Voice Visualizer */}
      <div className="relative h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {audioVisualizerActive && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-1"
            >
              {/* Audio waveform bars */}\n              {[...Array(8)].map((_, i) => (\n                <motion.div\n                  key={i}\n                  className={`w-2 rounded-full ${\n                    voiceState.mode === 'listening' \n                      ? 'bg-red-400' \n                      : 'bg-blue-400'\n                  }`}\n                  animate={{\n                    height: ['8px', '32px', '16px', '24px', '8px'],\n                  }}\n                  transition={{\n                    duration: 0.8,\n                    repeat: Infinity,\n                    delay: i * 0.1,\n                  }}\n                />\n              ))}\n            </motion.div>\n          )}\n        </AnimatePresence>\n\n        {/* Central state indicator */}\n        <motion.div\n          className={`w-16 h-16 rounded-full ${currentState.color} flex items-center justify-center text-2xl relative z-10 cursor-pointer transition-all duration-200 shadow-lg`}\n          whileHover={{ scale: 1.1 }}\n          whileTap={{ scale: 0.95 }}\n          onClick={handleMainButtonClick}\n          animate={{\n            rotate: currentState.animation === 'spin' ? 360 : 0,\n          }}\n          transition={{\n            rotate: {\n              duration: 2,\n              repeat: currentState.animation === 'spin' ? Infinity : 0,\n              ease: 'linear'\n            }\n          }}\n        >\n          {currentState.icon}\n        </motion.div>\n      </div>\n\n      {/* Status Display */}\n      <div className=\"text-center space-y-3\">\n        <Badge \n          variant={voiceState.mode === 'error' ? 'destructive' : 'secondary'} \n          className=\"text-sm px-3 py-1\"\n        >\n          {currentState.text}\n        </Badge>\n        \n        {voiceState.transcript && (\n          <motion.p \n            initial={{ opacity: 0, y: 10 }}\n            animate={{ opacity: 1, y: 0 }}\n            className=\"text-sm text-muted-foreground italic bg-muted p-2 rounded border-l-4 border-primary\"\n          >\n            \"{voiceState.transcript}\"\n          </motion.p>\n        )}\n        \n        {voiceState.error && (\n          <motion.p \n            initial={{ opacity: 0, y: 10 }}\n            animate={{ opacity: 1, y: 0 }}\n            className=\"text-sm text-destructive bg-destructive/10 p-2 rounded\"\n          >\n            {voiceState.error}\n          </motion.p>\n        )}\n      </div>\n\n      {/* Voice Controls */}\n      <div className=\"flex items-center justify-center gap-3\">\n        {/* Main Voice Button */}\n        <Button\n          variant={getMainButtonVariant()}\n          size=\"icon\"\n          onClick={handleMainButtonClick}\n          className=\"h-12 w-12 rounded-full shadow-lg\"\n          disabled={voiceState.mode === 'thinking'}\n        >\n          {getMainButtonIcon()}\n        </Button>\n        \n        {/* Voice Mode Toggle */}\n        <Button\n          variant={isVoiceEnabled ? \"default\" : \"outline\"}\n          size=\"icon\"\n          onClick={onVoiceToggle}\n          className=\"h-12 w-12 rounded-full\"\n        >\n          {isVoiceEnabled ? <Volume2 className=\"h-5 w-5\" /> : <VolumeX className=\"h-5 w-5\" />}\n        </Button>\n        \n        {/* Settings Button */}\n        <Button\n          variant=\"outline\"\n          size=\"icon\"\n          className=\"h-12 w-12 rounded-full\"\n        >\n          <Settings className=\"h-5 w-5\" />\n        </Button>\n      </div>\n\n      {/* Quick Actions */}\n      <div className=\"flex flex-wrap justify-center gap-2\">\n        <Button variant=\"ghost\" size=\"sm\" className=\"text-xs\">\n          Push to Talk\n        </Button>\n        <Button variant=\"ghost\" size=\"sm\" className=\"text-xs\">\n          Continuous\n        </Button>\n        <Button variant=\"ghost\" size=\"sm\" className=\"text-xs\">\n          Voice Settings\n        </Button>\n      </div>\n    </Card>\n  );\n};\n\nexport default EnhancedVoiceInterface;