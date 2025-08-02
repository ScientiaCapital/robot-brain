"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConversationalAIChat } from "@/components/conversational-ai-chat"
import { VoiceFirstChat } from "@/components/voice-first-chat"
import { BubbleChatWidget } from "@/components/bubble-chat-widget"

export default function DemoPage() {
  const [mode, setMode] = useState<'voice-first' | 'conv-ai' | 'bubble-widget'>('voice-first')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mode Selector */}
      <div className="p-4 bg-white border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">ElevenLabs Conversational AI Demo</h1>
          <div className="flex gap-2">
            <Button
              variant={mode === 'voice-first' ? 'default' : 'outline'}
              onClick={() => setMode('voice-first')}
            >
              Voice First Chat
            </Button>
            <Button
              variant={mode === 'conv-ai' ? 'default' : 'outline'}
              onClick={() => setMode('conv-ai')}
            >
              Conversational AI
            </Button>
            <Button
              variant={mode === 'bubble-widget' ? 'default' : 'outline'}
              onClick={() => setMode('bubble-widget')}
            >
              Bubble Widget
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="relative">
        {mode === 'voice-first' && <VoiceFirstChat />}
        {mode === 'conv-ai' && <ConversationalAIChat />}
        {mode === 'bubble-widget' && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-xl font-semibold mb-4">Bubble Chat Widget Demo</h2>
              <p className="text-gray-600 mb-4">
                The bubble chat widget will appear in the bottom-right corner.
                Click it to start a conversation with Robot Friend!
              </p>
              <div className="bg-gray-100 p-8 rounded-lg">
                <p>This is a demo page content area.</p>
                <p>The chat bubble should appear over this content.</p>
              </div>
            </div>
            <BubbleChatWidget />
          </div>
        )}
      </div>
    </div>
  )
}