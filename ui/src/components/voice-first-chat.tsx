"use client"

import { useState, useCallback, useEffect, memo } from "react"
import "@/types/speech-recognition"
import { motion } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from "lucide-react"

import { Chat } from "@/components/ui/chat"
import { Button } from "@/components/ui/button"
import { EnhancedVoiceInterface } from "@/components/ui/enhanced-voice-interface"
import { getConfiguredRobot } from "@/lib/robot-config"
import { getAgentConfig } from "@/lib/config"
import { streamTTSAudio, type StreamTTSCallbacks } from "@/lib/audio-streaming"
import { getSimpleAudioPlayer } from "@/lib/simple-audio-player"
import { logAudioError } from "@/lib/audio-error-logging"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  parts: Array<{
    type: "text"
    text: string
  }>
}

export const VoiceFirstChat = memo(function VoiceFirstChat() {
  const configuredRobot = getConfiguredRobot()
  const agentConfig = getAgentConfig()
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [conversationMode, setConversationMode] = useState<'text' | 'voice'>('text')
  const [voiceState, setVoiceState] = useState<{
    mode: 'idle' | 'listening' | 'speaking' | 'thinking' | 'error';
    transcript?: string;
    error?: string;
  }>({ mode: 'idle' })

  // Handle TTS playback using simple audio player
  const speakResponse = useCallback(async (text: string) => {
    if (isSpeaking) return
    
    setIsSpeaking(true)
    setVoiceState({ mode: 'speaking' })
    
    try {
      // Use updated streaming TTS with simple audio playback
      const callbacks: StreamTTSCallbacks = {
        onStart: () => {
          console.log('TTS playback started');
        },
        onComplete: (totalBytes, duration) => {
          setIsSpeaking(false);
          setVoiceState({ mode: 'idle' });
          console.log(`TTS completed: ${totalBytes} bytes in ${duration}ms`);
        },
        onError: async (error) => {
          console.error('TTS playback error:', error);
          setIsSpeaking(false);
          setVoiceState({ mode: 'error', error: error.message });
          
          // Log error to Neon database
          try {
            await logAudioError(
              'PLAYBACK_ERROR',
              error.message,
              'high'
            );
          } catch (logError) {
            console.error('Failed to log audio error:', logError);
          }
        }
      };
      
      await streamTTSAudio(text, agentConfig.voiceId, callbacks);
    } catch (error) {
      console.error("TTS failed:", error)
      setIsSpeaking(false)
      setVoiceState({ mode: 'error', error: 'Audio playback failed' })
    }
  }, [isSpeaking, agentConfig.voiceId])

  // Send message function
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      parts: [{ type: "text", text }]
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    setVoiceState({ mode: 'thinking' })
    setInput("")
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          personality: configuredRobot.id,
          sessionId: sessionId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          parts: [{ type: "text", text: data.message }]
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Always speak the response (both voice and text modes)
        await speakResponse(data.message)
      } else {
        console.error("Chat API error:", await response.text())
        alert("Sorry, I couldn't process your message. Please try again.")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("Sorry, something went wrong. Please try again.")
    } finally {
      setIsGenerating(false)
      if (voiceState.mode === 'thinking') {
        setVoiceState({ mode: 'idle' })
      }
    }
  }, [configuredRobot.id, sessionId, speakResponse])

  // Simple speech recognition for voice input
  const startVoiceInput = useCallback(async () => {
    try {
      if (!('webkitSpeechRecognition' in window)) {
        setVoiceState({ mode: 'error', error: 'Speech recognition not supported in this browser' })
        return
      }

      const recognition = new window.webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceState({ mode: 'listening' })
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        
        // Show interim results
        if (event.results[0].isFinal) {
          setInput(transcript)
          sendMessage(transcript)
          setVoiceState({ mode: 'idle' })
        } else {
          setVoiceState({ mode: 'listening', transcript })
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setVoiceState({ mode: 'error', error: `Speech recognition error: ${event.error}` })
      }

      recognition.onend = () => {
        setIsListening(false)
        if (voiceState.mode === 'listening') {
          setVoiceState({ mode: 'idle' })
        }
      }

      recognition.start()
    } catch (error) {
      console.error('Error starting voice input:', error)
      setVoiceState({ mode: 'error', error: 'Could not start voice input. Check microphone permissions.' })
    }
  }, [sendMessage, voiceState.mode])

  // Stop voice input
  const stopVoiceInput = useCallback(() => {
    setIsListening(false)
    setVoiceState({ mode: 'idle' })
  }, [])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    const audioPlayer = getSimpleAudioPlayer()
    audioPlayer.stop()
    setIsSpeaking(false)
    setVoiceState({ mode: 'idle' })
  }, [])

  // Auto-restart voice input after speaking in voice mode
  useEffect(() => {
    if (conversationMode === 'voice' && !isSpeaking && !isListening && !isGenerating && voiceState.mode === 'idle') {
      const timer = setTimeout(() => {
        startVoiceInput()
      }, 1000) // Longer delay for better UX
      return () => clearTimeout(timer)
    }
  }, [conversationMode, isSpeaking, isListening, isGenerating, voiceState.mode, startVoiceInput])
  
  // Show welcome message when no messages exist
  const displayMessages = messages.length === 0 
    ? [{
        id: "welcome",
        role: "assistant" as const,
        content: configuredRobot.welcomeMessage,
        parts: [{
          type: "text" as const,
          text: configuredRobot.welcomeMessage
        }]
      }]
    : messages

  const currentRobot = configuredRobot

  // Placeholder for transcribeAudio - this would be implemented with a real transcription service
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    console.log("Audio transcription not yet implemented", audioBlob)
    return "Audio transcription coming soon!"
  }

  // Always render Standard Chat for MVP
  // ConversationalAI is coming in future updates

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="p-4 bg-white/80 backdrop-blur border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{currentRobot.name}</h1>
            </div>

            {/* Mode Toggle */}
            <Button
              variant={conversationMode === 'voice' ? "default" : "outline"}
              size="sm"
              onClick={() => setConversationMode(conversationMode === 'voice' ? 'text' : 'voice')}
              className="flex items-center gap-2"
            >
              {conversationMode === 'voice' ? <Mic className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              {conversationMode === 'voice' ? 'Voice Mode' : 'Text Mode'}
            </Button>
          </div>
        </header>

        {/* Enhanced Voice Interface - only show in voice mode */}
        {conversationMode === 'voice' && (
          <div className="p-4">
            <EnhancedVoiceInterface
              isVoiceEnabled={true}
              onVoiceToggle={() => setConversationMode('text')}
              voiceState={voiceState}
              onStartListening={startVoiceInput}
              onStopListening={stopVoiceInput}
              onStopSpeaking={stopSpeaking}
              robotName={currentRobot.name}
              robotEmoji={currentRobot.emoji}
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden p-4">
          <Chat
            messages={displayMessages}
            input={input}
            handleInputChange={(e) => setInput(e.target.value)}
            handleSubmit={(e) => {
              if (e && e.preventDefault) {
                e.preventDefault()
              }
              if (input.trim()) {
                sendMessage(input)
                setInput("")
              }
            }}
            isGenerating={isGenerating}
            stop={() => setIsGenerating(false)}
            append={(message) => sendMessage(message.content)}
            transcribeAudio={transcribeAudio}
            suggestions={[
              "Tell me about yourself",
              "What can you help me with?",
              "Let's play a game!",
              "Teach me something new"
            ]}
          />
        </div>

      </div>
    </div>
  )
});