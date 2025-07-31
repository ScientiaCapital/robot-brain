"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RobotCircle } from "@/components/RobotCircle";
import { ConversationFlow } from "@/components/ConversationFlow";
import { ROBOT_PERSONALITIES, type RobotId } from "@/lib/robot-config";
import { 
  Play, 
  Users, 
  MessageCircle, 
  Lightbulb, 
  Brain,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface ConversationMessage {
  id: number;
  robotId: RobotId;
  robotName: string;
  robotEmoji: string;
  message: string;
  timestamp: string;
  round: number;
  respondingTo?: number;
}

interface MultiRobotResponse {
  conversationId: string;
  mode: string;
  topic: string;
  robots: RobotId[];
  conversation: ConversationMessage[];
  totalMessages: number;
  rounds: number;
}

export function MultiRobotChat({ onBack }: { onBack?: () => void }) {
  const [topic, setTopic] = useState("");
  const [selectedRobots, setSelectedRobots] = useState<RobotId[]>([]);
  const [mode, setMode] = useState<"discussion" | "debate" | "brainstorm">("discussion");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"setup" | "watching" | "complete">("setup");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Kid-friendly topic suggestions
  const topicSuggestions = [
    "Should robots be friends with humans?",
    "What makes a good friend?",
    "How can we help save the environment?",
    "What's the best way to learn new things?",
    "Why is it important to be kind to others?",
    "What would make school more fun?",
    "How do we solve problems when friends disagree?",
    "What makes someone brave?",
    "Why do we need rules and why should we follow them?",
    "What's the most important invention ever made?"
  ];

  const modes = [
    {
      id: "discussion" as const,
      name: "Discussion",
      icon: MessageCircle,
      description: "Robots share their thoughts and build on each other's ideas",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    },
    {
      id: "debate" as const,
      name: "Debate",
      icon: Users,
      description: "Robots present different viewpoints and argue respectfully",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    },
    {
      id: "brainstorm" as const,
      name: "Brainstorm",
      icon: Lightbulb,
      description: "Robots work together to solve problems creatively",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  ];

  const toggleRobot = (robotId: RobotId) => {
    setSelectedRobots(prev => 
      prev.includes(robotId)
        ? prev.filter(id => id !== robotId)
        : [...prev, robotId]
    );
  };

  const startConversation = async () => {
    if (!topic.trim() || selectedRobots.length < 2) return;

    setIsLoading(true);
    setCurrentStep("watching");
    setCurrentMessageIndex(0);

    try {
      const response = await fetch('https://robot-brain.tkipper.workers.dev/api/multi-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          topic: topic.trim(),
          robots: selectedRobots,
          rounds: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data: MultiRobotResponse = await response.json();
      setConversation(data.conversation);
      
      // Start revealing messages one by one
      setTimeout(() => {
        setCurrentMessageIndex(1);
      }, 1000);

    } catch (error) {
      console.error('Error starting conversation:', error);
      setCurrentStep("setup");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-advance message display
  useEffect(() => {
    if (currentStep === "watching" && currentMessageIndex < conversation.length) {
      const timer = setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
      }, 2000); // Show each message for 2 seconds

      return () => clearTimeout(timer);
    } else if (currentStep === "watching" && currentMessageIndex >= conversation.length && conversation.length > 0) {
      // Conversation complete
      setTimeout(() => {
        setCurrentStep("complete");
      }, 1000);
    }
  }, [currentStep, currentMessageIndex, conversation.length]);

  if (currentStep === "setup") {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="border-b px-4 py-3 sm:px-6 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold sm:text-2xl flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Robot Discussion
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Watch AI robots talk and learn together!
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Choose Conversation Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {modes.map((modeOption) => {
                    const Icon = modeOption.icon;
                    return (
                      <motion.div
                        key={modeOption.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all ${
                            mode === modeOption.id 
                              ? 'ring-2 ring-primary shadow-md' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setMode(modeOption.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <h3 className="font-semibold mb-1">{modeOption.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {modeOption.description}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Robot Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Robots (Choose at least 2)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(ROBOT_PERSONALITIES).map(([robotId, robot]) => (
                    <motion.div
                      key={robotId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all ${
                          selectedRobots.includes(robotId as RobotId)
                            ? 'ring-2 ring-primary shadow-md'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => toggleRobot(robotId as RobotId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{robot.emoji}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{robot.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {robot.traits.slice(0, 2).join(", ")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                {selectedRobots.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm font-medium">Selected:</span>
                    {selectedRobots.map(robotId => (
                      <Badge key={robotId} variant="secondary">
                        {ROBOT_PERSONALITIES[robotId].emoji} {ROBOT_PERSONALITIES[robotId].name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Discussion Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What should the robots talk about?"
                    className="flex-1"
                  />
                  <Button
                    onClick={startConversation}
                    disabled={!topic.trim() || selectedRobots.length < 2 || isLoading}
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Topic Suggestions */}
                <div>
                  <p className="text-sm font-medium mb-2">💡 Try these topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions.slice(0, 6).map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setTopic(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 sm:px-6 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentStep("setup");
                setConversation([]);
                setCurrentMessageIndex(0);
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Robot Discussion: {topic}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Badge>
                <span>•</span>
                <span>{selectedRobots.length} robots</span>
              </div>
            </div>
          </div>
          
          {currentStep === "complete" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentStep("setup");
                setConversation([]);
                setCurrentMessageIndex(0);
                setTopic("");
                setSelectedRobots([]);
              }}
            >
              New Discussion
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Robot Circle */}
        <div className="w-1/3 min-w-[300px] border-r p-4">
          <RobotCircle
            robots={selectedRobots}
            conversation={conversation.slice(0, currentMessageIndex)}
            currentSpeaker={
              currentMessageIndex > 0 && currentMessageIndex <= conversation.length
                ? conversation[currentMessageIndex - 1]?.robotId
                : null
            }
          />
        </div>

        {/* Conversation Flow */}
        <div className="flex-1 flex flex-col">
          <ConversationFlow
            conversation={conversation.slice(0, currentMessageIndex)}
            isComplete={currentStep === "complete"}
            totalMessages={conversation.length}
            currentIndex={currentMessageIndex}
          />
        </div>
      </main>
    </div>
  );
}