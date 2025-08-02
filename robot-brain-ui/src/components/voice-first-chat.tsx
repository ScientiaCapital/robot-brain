"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

import { Chat } from "@/components/ui/chat"
import { Button } from "@/components/ui/button"

import { ROBOT_PERSONALITIES, type RobotId } from "@/lib/robot-config"

interface VoiceFirstChatProps {
  initialRobot?: RobotId
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  parts: Array<{
    type: "text"
    text: string
  }>
}

export function VoiceFirstChat({ initialRobot = "robot-friend" }: VoiceFirstChatProps) {
  const [selectedRobot, setSelectedRobot] = useState<RobotId>(initialRobot)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Handle voice input transcription - simplified for MVP
  const transcribeAudio = async (): Promise<string> => {
    // TODO: Integrate with speech recognition
    return ""
  }

  // Handle TTS playback using ElevenLabs
  const speakResponse = useCallback(async (text: string) => {
    if (isSpeaking) return
    
    setIsSpeaking(true)
    try {
      const robot = ROBOT_PERSONALITIES[selectedRobot]
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          personality: selectedRobot,
          voice_id: robot.voice_id
        })
      })

      if (response.ok) {
        const { audio_data } = await response.json()
        const audio = new Audio(`data:audio/wav;base64,${audio_data}`)
        
        audio.onended = () => setIsSpeaking(false)
        audio.onerror = () => setIsSpeaking(false)
        
        await audio.play()
      }
    } catch (error) {
      console.error("TTS playback failed:", error)
      setIsSpeaking(false)
    }
  }, [isSpeaking, selectedRobot])

  // Handle sending a message
  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      parts: [{ type: "text", text }]
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    
    try {
      // TODO: Call your backend API here
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          personality: selectedRobot
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          parts: [{ type: "text", text: data.message }]
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-speak new assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "assistant" && lastMessage.content) {
      speakResponse(lastMessage.content)
    }
  }, [messages, speakResponse])
  
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
                  Voice-First Chat Experience
                </p>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "destructive" : "default"}
                size="icon"
                onClick={() => setIsListening(!isListening)}
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

        {/* Robot Quick Select */}
        <div className="p-4 bg-white/80 backdrop-blur border-t">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(ROBOT_PERSONALITIES).slice(0, 8).map(([id, robot]) => (
              <Button
                key={id}
                variant={selectedRobot === id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRobot(id as RobotId)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-lg">{robot.emoji}</span>
                <span>{robot.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}