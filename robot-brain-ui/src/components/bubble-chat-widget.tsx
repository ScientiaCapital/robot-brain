"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConversationalAIChat } from "@/components/conversational-ai-chat"

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor: string
  bubbleColor: string
  fullScreenOnMobile: boolean
}


export function BubbleChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<WidgetConfig>({
    position: 'bottom-right',
    primaryColor: '#7c3aed',
    bubbleColor: '#7c3aed',
    fullScreenOnMobile: true
  })

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const getPositionStyles = () => {
    const base = "fixed z-50"
    switch (config.position) {
      case 'bottom-right':
        return `${base} bottom-4 right-4`
      case 'bottom-left':
        return `${base} bottom-4 left-4`
      case 'top-right':
        return `${base} top-4 right-4`
      case 'top-left':
        return `${base} top-4 left-4`
    }
  }

  return (
    <>
      {/* Custom Bubble Button */}
      <div className={getPositionStyles()}>
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Button
                onClick={handleOpen}
                className="h-14 w-14 rounded-full shadow-lg"
                style={{ backgroundColor: config.bubbleColor }}
                aria-label="Open chat"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-2"
            >
              <Button
                onClick={handleClose}
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: config.position.includes('right') ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: config.position.includes('right') ? 100 : -100 }}
            className={`fixed z-40 bg-white rounded-lg shadow-xl p-6 w-80 ${
              config.position.includes('right') ? 'right-20' : 'left-20'
            } ${
              config.position.includes('bottom') ? 'bottom-4' : 'top-4'
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Widget Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Position</label>
                <select
                  value={config.position}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    position: e.target.value as WidgetConfig['position'] 
                  }))}
                  className="w-full mt-1 p-2 border rounded"
                  aria-label="Position"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    primaryColor: e.target.value 
                  }))}
                  className="w-full mt-1 h-10"
                  aria-label="Primary color"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bubble Color</label>
                <input
                  type="color"
                  value={config.bubbleColor}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    bubbleColor: e.target.value 
                  }))}
                  className="w-full mt-1 h-10"
                  aria-label="Bubble color"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fullscreen-mobile"
                  checked={config.fullScreenOnMobile}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    fullScreenOnMobile: e.target.checked 
                  }))}
                />
                <label htmlFor="fullscreen-mobile" className="text-sm">
                  Full screen on mobile
                </label>
              </div>
            </div>

            <Button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6"
            >
              Close Settings
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`
                fixed bg-white rounded-lg shadow-2xl overflow-hidden
                ${config.fullScreenOnMobile && window.innerWidth < 768 
                  ? 'inset-4' 
                  : 'w-96 h-[500px] bottom-20 right-4'
                }
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationalAIChat />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}