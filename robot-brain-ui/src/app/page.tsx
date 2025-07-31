"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RobotCard } from "@/components/RobotCard";
import { RobotCardSkeleton } from "@/components/RobotCardSkeleton";
import { ChatBubble } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { MultiRobotChat } from "@/components/MultiRobotChat";
import { ROBOT_PERSONALITIES, ROBOT_TOOLS, type RobotId } from "@/lib/robot-config";
import { Send, Menu, Moon, Sun, Settings, Sparkles, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper function for safe tool checks
const robotHasTool = (robot: typeof ROBOT_PERSONALITIES[keyof typeof ROBOT_PERSONALITIES] | null, tool: string): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return robot?.tools.includes(tool as any) ?? false;
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "robot";
}

export default function RobotBrainApp() {
  const [selectedRobot, setSelectedRobot] = useState<RobotId | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [robotsLoading, setRobotsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"selection" | "chat" | "multiRobot">("selection");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for dark mode preference on mount
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    
    // Simulate loading robots
    setTimeout(() => setRobotsLoading(false), 800);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const selectRobot = (robotId: RobotId) => {
    setSelectedRobot(robotId);
    setMessages([]);
    setCurrentView("chat");
    const robot = ROBOT_PERSONALITIES[robotId];
    
    // Add welcome message with delay
    setTimeout(() => {
      setMessages([{
        id: Date.now().toString(),
        text: robot.welcomeMessage,
        sender: "robot"
      }]);
    }, 300);
    
    // Focus input on desktop
    setTimeout(() => {
      if (window.innerWidth > 640) {
        inputRef.current?.focus();
      }
    }, 400);
  };

  const goBackToSelection = () => {
    setCurrentView("selection");
    setSelectedRobot(null);
    setMessages([]);
  };

  const openMultiRobotChat = () => {
    setCurrentView("multiRobot");
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedRobot || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user"
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('https://robot-brain.tkipper.workers.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personality: selectedRobot,
          message: userMessage.text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const robotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || `${ROBOT_PERSONALITIES[selectedRobot].emoji} Sorry, I couldn't process that request.`,
        sender: "robot"
      };

      setMessages(prev => [...prev, robotMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRobot = selectedRobot ? ROBOT_PERSONALITIES[selectedRobot] : null;

  // Show multi-robot chat view
  if (currentView === "multiRobot") {
    return <MultiRobotChat onBack={goBackToSelection} />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 sm:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Robot Brain
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Chat with AI Robot Friends!
                </p>
              </div>
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentView === "selection" ? (
        // Robot Selection Screen
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  Choose Your Robot Friend
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-muted-foreground">
                  Each robot has unique skills and personality traits
                </p>
              </div>
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={openMultiRobotChat}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Multi-Robot Chat
                </Button>
              </motion.div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  NEW: Watch Robots Talk Together!
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                See how different AI personalities discuss topics and learn from each other. 
                Perfect for understanding how AI collaboration works!
              </p>
            </div>
          </motion.div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {robotsLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <RobotCardSkeleton key={i} />
              ))
            ) : (
              // Actual robot cards
              Object.entries(ROBOT_PERSONALITIES).map(([id], index) => (
                <RobotCard
                  key={id}
                  robotId={id as RobotId}
                  onClick={() => selectRobot(id as RobotId)}
                  index={index}
                />
              ))
            )}
          </div>
        </main>
      ) : (
        // Chat Interface
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat Header */}
          <motion.div 
            className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToSelection}
                  className="sm:hidden -ml-2"
                >
                  ← Back
                </Button>
                <motion.div 
                  className="text-2xl"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {currentRobot?.emoji}
                </motion.div>
                <div className="flex-1">
                  <h2 className="font-semibold flex items-center gap-2">
                    {currentRobot?.name}
                    {messages.length > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Active
                      </motion.span>
                    )}
                  </h2>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentRobot?.tools.slice(0, 3).map((toolId, i) => {
                      const tool = ROBOT_TOOLS[toolId];
                      return (
                        <motion.div
                          key={toolId}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Badge variant="outline" className="text-xs">
                            {tool.icon} {tool.name}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBackToSelection}
                  className="hidden sm:flex"
                >
                  Change Robot
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <EmptyState 
                  robotName={currentRobot?.name || ""} 
                  robotEmoji={currentRobot?.emoji || ""} 
                />
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message.text}
                      sender={message.sender}
                      robotEmoji={message.sender === "robot" ? currentRobot?.emoji : undefined}
                      robotName={message.sender === "robot" ? currentRobot?.name : undefined}
                    />
                  ))}
                  {isLoading && (
                    <ChatBubble
                      message=""
                      sender="robot"
                      robotEmoji={currentRobot?.emoji}
                      robotName={currentRobot?.name}
                      isTyping={true}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex space-x-2"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-base"
                onFocus={() => {
                  // Scroll to bottom on mobile when keyboard opens
                  if (window.innerWidth < 640) {
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }
                }}
              />
              <motion.div
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="submit" 
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </form>
            
            {/* Quick Actions */}
            <motion.div 
              className="mt-3 flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {robotHasTool(currentRobot, "jokes") && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputValue("Tell me a joke!");
                      inputRef.current?.focus();
                    }}
                    className="text-xs sm:text-sm"
                  >
                    😂 Tell a joke
                  </Button>
                </motion.div>
              )}
              {robotHasTool(currentRobot, "games") && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputValue("Let's play a game!");
                      inputRef.current?.focus();
                    }}
                    className="text-xs sm:text-sm"
                  >
                    🎮 Play a game
                  </Button>
                </motion.div>
              )}
              {robotHasTool(currentRobot, "wisdom") && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputValue("Share some wisdom");
                      inputRef.current?.focus();
                    }}
                    className="text-xs sm:text-sm"
                  >
                    🦉 Share wisdom
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Mobile Menu Sheet */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Robot Friends
              </SheetTitle>
            </SheetHeader>
          </div>
          
          <Separator />
          
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-4 space-y-2">
              {Object.entries(ROBOT_PERSONALITIES).map(([id, robot], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={selectedRobot === id ? "default" : "ghost"}
                    className="w-full justify-start group"
                    onClick={() => {
                      selectRobot(id as RobotId);
                      setShowMobileMenu(false);
                    }}
                  >
                    <span className="mr-3 text-xl group-hover:scale-110 transition-transform">
                      {robot.emoji}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">{robot.name}</div>
                      <div className="text-xs opacity-70">{robot.traits[0]}</div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Developer Mode</h3>
              <p className="text-sm text-muted-foreground">
                Shows additional debugging information and model details.
              </p>
              <Button variant="outline" className="mt-2" disabled>
                Coming Soon
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">API Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure your API endpoint for robot responses.
              </p>
              <Input
                placeholder="https://your-api.com"
                className="mt-2"
                disabled
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}