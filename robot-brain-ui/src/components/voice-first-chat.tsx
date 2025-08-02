"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from "lucide-react"

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

export function VoiceFirstChat() {
  const selectedRobot: RobotId = "robot-friend" // Single robot for MVP
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [conversationMode, setConversationMode] = useState<'text' | 'voice'>('text')

  // Handle TTS playback using ElevenLabs
  const speakResponse = useCallback(async (text: string) => {
    if (isSpeaking) return
    
    setIsSpeaking(true)
    try {
      const response = await fetch("/api/voice/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          personality: selectedRobot
        })
      })

      if (response.ok) {
        const { audio } = await response.json()
        const audioElement = new Audio(`data:audio/mpeg;base64,${audio}`)
        
        audioElement.onended = () => {
          setIsSpeaking(false)
          // In voice mode, we'll trigger listening from a useEffect
        }
        
        audioElement.onerror = () => {
          console.error("Audio playback error")
          setIsSpeaking(false)
        }
        
        await audioElement.play()
      } else {
        console.error("TTS API error:", await response.text())
        setIsSpeaking(false)
      }
    } catch (error) {
      console.error("TTS playback failed:", error)
      setIsSpeaking(false)
    }
  }, [isSpeaking, selectedRobot])

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
    setInput("")
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          personality: selectedRobot,
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
    }
  }, [selectedRobot, sessionId, speakResponse])

  // Simple speech recognition for voice input
  const startVoiceInput = useCallback(async () => {
    try {
      if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome.')
        return
      }

      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        sendMessage(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (error) {
      console.error('Error starting voice input:', error)
      alert('Could not start voice input. Please check your microphone permissions.')
    }
  }, [sendMessage])

  // Auto-restart voice input after speaking in voice mode
  useEffect(() => {
    if (conversationMode === 'voice' && !isSpeaking && !isListening && !isGenerating) {
      const timer = setTimeout(() => {
        startVoiceInput()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [conversationMode, isSpeaking, isListening, isGenerating, startVoiceInput])
  
  // Show welcome message when no messages exist
  const displayMessages = messages.length === 0 
    ? [{
        id: "welcome",
        role: "assistant" as const,
        content: ROBOT_PERSONALITIES[selectedRobot].welcomeMessage,
        parts: [{
          type: "text" as const,
          text: ROBOT_PERSONALITIES[selectedRobot].welcomeMessage
        }]
      }]
    : messages

  const currentRobot = ROBOT_PERSONALITIES[selectedRobot]

  // Placeholder for transcribeAudio - this would be implemented with a real transcription service
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    console.log("Audio transcription not yet implemented", audioBlob)
    return "Audio transcription coming soon!"
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Header with Robot Selector */}
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
                  {conversationMode === 'voice' && isListening && "🎤 Listening..."}
                  {conversationMode === 'voice' && isSpeaking && "🔊 Speaking..."}
                  {conversationMode === 'voice' && isGenerating && "🤔 Thinking..."}
                  {conversationMode === 'voice' && !isListening && !isSpeaking && !isGenerating && "👂 Ready to listen"}
                  {conversationMode === 'text' && "💬 Type your message"}
                </p>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={conversationMode === 'voice' ? "default" : "outline"}
                size="sm"
                onClick={() => setConversationMode(conversationMode === 'voice' ? 'text' : 'voice')}
                className="flex items-center gap-2"
              >
                {conversationMode === 'voice' ? <Mic className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                {conversationMode === 'voice' ? 'Voice Mode' : 'Text Mode'}
              </Button>
              
              {conversationMode === 'voice' && (
                <>
                  <Button
                    variant={isListening ? "destructive" : "default"}
                    size="icon"
                    onClick={startVoiceInput}
                    disabled={isListening || isGenerating}
                    className="h-12 w-12"
                  >
                    {isListening ? <MicOff /> : <Mic />}
                  </Button>
                  
                  <Button
                    variant={isSpeaking ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => setIsSpeaking(!isSpeaking)}
                    className="h-12 w-12"
                  >
                    {isSpeaking ? <VolumeX /> : <Volume2 />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

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
}