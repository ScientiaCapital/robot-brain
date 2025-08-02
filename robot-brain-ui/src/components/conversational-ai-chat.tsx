"use client"

import { useState, useCallback, useEffect, useRef } from "react"
// import { useConversation } from "@elevenlabs/react" // Commented out until exact API is confirmed
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mic, 
  MicOff, 
  VolumeX, 
  MessageSquare,
  Settings,
  RefreshCcw,
  WifiOff,
  Loader2
} from "lucide-react"

import { Chat } from "@/components/ui/chat"
import { Button } from "@/components/ui/button"
import { ROBOT_PERSONALITIES, type RobotId } from "@/lib/robot-config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  parts: Array<{
    type: "text"
    text: string
  }>
}

interface ConversationPreferences {
  responseStyle: 'concise' | 'detailed' | 'casual'
  interruptionEnabled: boolean
  volume: number
}

export function ConversationalAIChat() {
  const selectedRobot: RobotId = "robot-friend"
  const currentRobot = ROBOT_PERSONALITIES[selectedRobot]
  
  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<ConversationPreferences>({
    responseStyle: 'concise',
    interruptionEnabled: true,
    volume: 0.8
  })
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  // ElevenLabs Conversational AI hook
  // Note: Commented out until we have the exact API details
  // const conversation = useConversation()

  // Helper to add system messages
  const addSystemMessage = useCallback((text: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: text,
      parts: [{ type: 'text', text }]
    }
    setMessages(prev => [...prev, systemMessage])
  }, [])

  // For now, we'll provide a fallback implementation until the exact ElevenLabs API is confirmed
  const [status] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected')
  const isSpeaking = false
  const isConnected = status === 'connected'
  const isListening = false
  const isProcessing = false
  
  // Fallback functions for missing API
  const startConversation = useCallback(async (config: unknown) => {
    console.log("Starting conversation with config:", config)
    addSystemMessage("Conversational AI mode requires ElevenLabs agent configuration.")
  }, [addSystemMessage])
  
  const endConversation = useCallback(async () => {
    console.log("Ending conversation")
    addSystemMessage("Conversation ended.")
  }, [addSystemMessage])
  
  const sendTextInput = useCallback(async (text: string) => {
    console.log("Sending text:", text)
    addSystemMessage(`Echo: ${text}`)
  }, [addSystemMessage])
  
  const sendAudioInput = useCallback(async (audio: Blob) => {
    console.log("Sending audio:", audio)
    addSystemMessage("Audio received (mock response)")
  }, [addSystemMessage])
  
  const setVolume = useCallback((volume: number) => {
    console.log("Setting volume:", volume)
  }, [])
  
  const error = null

  // Start conversation with configuration
  const handleStartConversation = useCallback(async () => {
    if (!startConversation) return
    
    try {
      await startConversation({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'default-agent',
        overrides: {
          agent: {
            prompt: {
              prompt: `${currentRobot.systemPrompt} Respond in a ${preferences.responseStyle} manner.`,
              firstMessage: currentRobot.welcomeMessage,
              language: 'en'
            }
          },
          tts: {
            voiceId: currentRobot.voice_id,
            model: 'eleven_flash_v2_5',
            stability: 0.5,
            similarityBoost: 0.8,
            style: 0.0,
            useSpeakerBoost: true
          }
        }
      })
    } catch (err) {
      console.error("Failed to start conversation:", err)
      addSystemMessage("Failed to start conversation. Please try again.")
    }
  }, [startConversation, currentRobot, preferences.responseStyle, addSystemMessage])

  // Handle text input
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !isConnected || !sendTextInput) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      parts: [{ type: 'text', text }]
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    
    try {
      await sendTextInput(text)
    } catch (err) {
      console.error("Failed to send text:", err)
      addSystemMessage("Failed to send message. Please try again.")
    }
  }, [isConnected, sendTextInput, addSystemMessage])

  // Handle voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      audioChunksRef.current = []
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      })
      
      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        try {
          if (sendAudioInput) {
            await sendAudioInput(audioBlob)
          }
        } catch (err) {
          console.error("Failed to send audio:", err)
          addSystemMessage("Failed to send audio. Please try again.")
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
      })
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to start recording:", err)
      addSystemMessage("Could not access microphone. Please check permissions.")
    }
  }, [sendAudioInput, addSystemMessage])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // Handle interruption
  const handleInterrupt = useCallback(async () => {
    if (isSpeaking && preferences.interruptionEnabled && endConversation) {
      await endConversation()
      // Restart conversation after brief delay
      setTimeout(() => {
        handleStartConversation()
      }, 500)
    }
  }, [isSpeaking, preferences.interruptionEnabled, endConversation, handleStartConversation])

  // Update volume when preference changes
  useEffect(() => {
    if (setVolume) {
      setVolume(preferences.volume)
    }
  }, [preferences.volume, setVolume])

  // Update system prompt when preferences change
  useEffect(() => {
    if (isConnected && preferences.responseStyle && sendTextInput) {
      sendTextInput(`Please adjust your responses to be more ${preferences.responseStyle}.`)
    }
  }, [preferences.responseStyle, isConnected, sendTextInput])

  // Handle conversation events
  useEffect(() => {
    if (status === 'connected') {
      addSystemMessage("Connected to Robot Friend! Ready to chat.")
    } else if (status === 'disconnected') {
      addSystemMessage("Conversation ended.")
    }
  }, [status, addSystemMessage])

  // Handle errors
  useEffect(() => {
    if (error) {
      addSystemMessage(`Error: ${String(error)}`)
    }
  }, [error, addSystemMessage])

  // Show welcome message when no messages exist
  const displayMessages = messages.length === 0 
    ? [{
        id: "welcome",
        role: "assistant" as const,
        content: currentRobot.welcomeMessage,
        parts: [{
          type: "text" as const,
          text: currentRobot.welcomeMessage
        }]
      }]
    : messages

  // Get status text
  const getStatusText = () => {
    if (error) return `❌ ${String(error)}`
    if (isListening) return "🎤 Listening..."
    if (isSpeaking) return "🔊 Speaking..."
    if (isProcessing) return "🤔 Thinking..."
    if (isConnected) return "✅ Connected"
    if (status === 'connecting') return "🔄 Connecting..."
    return "💬 Ready to chat"
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="p-4 bg-white/80 backdrop-blur border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-4xl"
              >
                {currentRobot.emoji}
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">{currentRobot.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {getStatusText()}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Connection Controls */}
              {!isConnected ? (
                <Button
                  onClick={handleStartConversation}
                  disabled={status === 'connecting'}
                  className="flex items-center gap-2"
                  aria-label="Start conversation"
                >
                  {status === 'connecting' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Start Conversation
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={endConversation}
                  className="flex items-center gap-2"
                  aria-label="End conversation"
                >
                  <WifiOff className="h-4 w-4" />
                  End Conversation
                </Button>
              )}

              {/* Preferences */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPreferences(!showPreferences)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* Voice Controls */}
              {isConnected && (
                <>
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="h-12 w-12"
                    aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                  >
                    {isRecording ? <MicOff /> : <Mic />}
                  </Button>

                  {isSpeaking && preferences.interruptionEnabled && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleInterrupt}
                      className="h-12 w-12"
                      aria-label="interrupt"
                    >
                      <VolumeX />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preferences Panel */}
          <AnimatePresence>
            {showPreferences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="font-semibold mb-2">Conversation Preferences</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Response Style</label>
                    <div className="flex gap-2 mt-1">
                      {(['concise', 'detailed', 'casual'] as const).map(style => (
                        <label key={style} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="responseStyle"
                            value={style}
                            checked={preferences.responseStyle === style}
                            onChange={() => setPreferences(prev => ({ ...prev, responseStyle: style }))}
                          />
                          <span className="text-sm capitalize">{style}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Allow Interruptions</label>
                    <input
                      type="checkbox"
                      checked={preferences.interruptionEnabled}
                      onChange={(e) => setPreferences(prev => ({ ...prev, interruptionEnabled: e.target.checked }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Volume: {Math.round(preferences.volume * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={preferences.volume}
                      onChange={(e) => setPreferences(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{String(error)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartConversation}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-3 w-3" />
                Retry
              </Button>
            </div>
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
              handleSendMessage(input)
            }}
            isGenerating={isProcessing}
            stop={() => {}}
            append={(message) => handleSendMessage(message.content)}
            transcribeAudio={async (blob) => {
              // For now, send audio directly through conversational AI
              await sendAudioInput(blob)
              return "Audio sent"
            }}
            suggestions={
              isConnected 
                ? [
                    "Tell me about yourself",
                    "What can you help me with?",
                    "Let's play a game!",
                    "Teach me something new"
                  ]
                : []
            }
          />
        </div>
      </div>
    </div>
  )
}