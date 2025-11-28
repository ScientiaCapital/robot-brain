"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { Send, Sparkles } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const MAX_DEMO_MESSAGES = 5
const DEMO_SESSION_ID = `demo-${Date.now()}`

const SAMPLE_PROMPTS = [
  "Tell me a fun fact!",
  "What's your favorite color?",
  "Can you tell me a joke?",
  "What makes you happy?",
]

export function DemoWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! I'm Robot Friend! 😊 Ask me anything - I'd love to chat with you!",
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking || messageCount >= MAX_DEMO_MESSAGES) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)
    setMessageCount((prev) => prev + 1)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          personality: "robot-friend",
          sessionId: DEMO_SESSION_ID,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Oops! Something went wrong. Try again? 😅",
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I couldn't connect. Check your internet? 🌐",
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }, [isThinking, messageCount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSamplePrompt = (prompt: string) => {
    if (messageCount < MAX_DEMO_MESSAGES) {
      sendMessage(prompt)
    }
  }

  const isLimitReached = messageCount >= MAX_DEMO_MESSAGES
  const isNearLimit = messageCount >= 3

  return (
    <section className="py-20 px-6 bg-landing-gradient">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Try It Out!
          </h2>
          <p className="text-lg md:text-xl text-slate-600">
            Chat with Robot Friend right now - no signup needed.
          </p>
        </div>

        {/* Demo Chat Widget */}
        <div className="demo-widget max-w-2xl mx-auto">
          {/* Chat Header */}
          <div className="bg-playful-blue px-6 py-4 flex items-center gap-4">
            <div className="relative">
              <span className={`text-4xl ${isThinking ? 'animate-wiggle' : 'animate-pulse-grow'}`}>
                😊
              </span>
              {isThinking && (
                <span className="absolute -top-1 -right-1 text-lg animate-sparkle">
                  ✨
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Robot Friend</h3>
              <p className="text-blue-100 text-sm">
                {isThinking ? "Thinking..." : "Online and ready to chat!"}
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-playful-blue text-white rounded-br-md"
                      : "bg-white text-slate-800 shadow-md rounded-bl-md"
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-playful-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-playful-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-playful-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Near limit warning */}
          {isNearLimit && !isLimitReached && (
            <div className="bg-yellow-50 px-4 py-2 text-center">
              <p className="text-yellow-700 text-sm">
                {MAX_DEMO_MESSAGES - messageCount} messages left in demo.
                <Link href="/chat" className="underline ml-1 font-medium hover:text-yellow-800">
                  Go to full chat
                </Link>
              </p>
            </div>
          )}

          {/* Limit reached */}
          {isLimitReached && (
            <div className="bg-playful-purple/10 px-4 py-4 text-center">
              <p className="text-slate-700 mb-3">
                You&apos;ve tried the demo! Ready for unlimited conversations? ✨
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-playful-blue text-white px-6 py-2 rounded-full font-medium hover:bg-playful-blue-dark transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Start Full Conversation
              </Link>
            </div>
          )}

          {/* Input Area */}
          {!isLimitReached && (
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full border-2 border-slate-200 focus:border-playful-blue focus:outline-none transition-colors"
                  disabled={isThinking}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="bg-playful-blue text-white px-5 py-3 rounded-full hover:bg-playful-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Sample prompts */}
              {messages.length <= 2 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500">Try:</span>
                  {SAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSamplePrompt(prompt)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
