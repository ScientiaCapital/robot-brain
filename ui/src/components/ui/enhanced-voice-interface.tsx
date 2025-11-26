"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Volume2,
  VolumeX,
  Settings,
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
              {/* Audio waveform bars */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 rounded-full ${
                    voiceState.mode === 'listening' 
                      ? 'bg-red-400' 
                      : 'bg-blue-400'
                  }`}
                  animate={{
                    height: ['8px', '32px', '16px', '24px', '8px'],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central state indicator */}
        <motion.div
          className={`w-16 h-16 rounded-full ${currentState.color} flex items-center justify-center text-2xl relative z-10 cursor-pointer transition-all duration-200 shadow-lg`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMainButtonClick}
          animate={{
            rotate: currentState.animation === 'spin' ? 360 : 0,
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: currentState.animation === 'spin' ? Infinity : 0,
              ease: 'linear'
            }
          }}
        >
          {currentState.icon}
        </motion.div>
      </div>

      {/* Status Display */}
      <div className="text-center space-y-3">
        <Badge 
          variant={voiceState.mode === 'error' ? 'destructive' : 'secondary'} 
          className="text-sm px-3 py-1"
        >
          {currentState.text}
        </Badge>
        
        {voiceState.transcript && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground italic bg-muted p-2 rounded border-l-4 border-primary"
          >
            &ldquo;{voiceState.transcript}&rdquo;
          </motion.p>
        )}
        
        {voiceState.error && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive bg-destructive/10 p-2 rounded"
          >
            {voiceState.error}
          </motion.p>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Main Voice Button */}
        <Button
          variant={getMainButtonVariant()}
          size="icon"
          onClick={handleMainButtonClick}
          className="h-12 w-12 rounded-full shadow-lg"
          disabled={voiceState.mode === 'thinking'}
        >
          {getMainButtonIcon()}
        </Button>
        
        {/* Voice Mode Toggle */}
        <Button
          variant={isVoiceEnabled ? "default" : "outline"}
          size="icon"
          onClick={onVoiceToggle}
          className="h-12 w-12 rounded-full"
        >
          {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
        
        {/* Settings Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs">
          Push to Talk
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          Continuous
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          Voice Settings
        </Button>
      </div>
    </Card>
  );
};

export default EnhancedVoiceInterface;