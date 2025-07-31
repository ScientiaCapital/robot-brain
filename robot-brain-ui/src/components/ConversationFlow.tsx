"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROBOT_PERSONALITIES, type RobotId } from "@/lib/robot-config";
import { 
  MessageSquare, 
  ArrowRight, 
  Clock, 
  Lightbulb,
  Heart,
  Brain as BrainIcon,
  Anchor,
  Theater,
  CheckCircle,
  Users
} from "lucide-react";

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

interface ConversationFlowProps {
  conversation: ConversationMessage[];
  isComplete: boolean;
  totalMessages: number;
  currentIndex: number;
}

export function ConversationFlow({ 
  conversation, 
  isComplete, 
  totalMessages, 
  currentIndex 
}: ConversationFlowProps) {
  
  // Get robot-specific styling
  const getRobotStyle = (robotId: RobotId) => {
    const styles = {
      friend: { 
        bg: "bg-pink-50 dark:bg-pink-950/30", 
        border: "border-pink-200 dark:border-pink-800",
        icon: Heart,
        color: "text-pink-600 dark:text-pink-400"
      },
      nerd: { 
        bg: "bg-blue-50 dark:bg-blue-950/30", 
        border: "border-blue-200 dark:border-blue-800",
        icon: BrainIcon,
        color: "text-blue-600 dark:text-blue-400"
      },
      zen: { 
        bg: "bg-green-50 dark:bg-green-950/30", 
        border: "border-green-200 dark:border-green-800",
        icon: Lightbulb,
        color: "text-green-600 dark:text-green-400"
      },
      pirate: { 
        bg: "bg-orange-50 dark:bg-orange-950/30", 
        border: "border-orange-200 dark:border-orange-800",
        icon: Anchor,
        color: "text-orange-600 dark:text-orange-400"
      },
      drama: { 
        bg: "bg-purple-50 dark:bg-purple-950/30", 
        border: "border-purple-200 dark:border-purple-800",
        icon: Theater,
        color: "text-purple-600 dark:text-purple-400"
      }
    };
    return styles[robotId] || styles.friend;
  };

  // Group messages by rounds
  const messagesByRound = conversation.reduce((acc, message) => {
    if (!acc[message.round]) {
      acc[message.round] = [];
    }
    acc[message.round].push(message);
    return acc;
  }, {} as Record<number, ConversationMessage[]>);

  const rounds = Object.keys(messagesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  if (conversation.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Getting robots ready...</h3>
          <p className="text-muted-foreground">
            The AI robots are thinking about what to say!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress Header */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation Progress
          </h3>
          {isComplete && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentIndex} of {totalMessages} messages</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / totalMessages) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Conversation Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {rounds.map((roundNum) => (
            <motion.div
              key={roundNum}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Round Header */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-background">
                  <Clock className="h-3 w-3 mr-1" />
                  {roundNum === 0 ? "Opening Thoughts" : `Discussion Round ${roundNum}`}
                </Badge>
                <div className="flex-1 border-t" />
              </div>

              {/* Messages in this round */}
              <div className="space-y-4">
                <AnimatePresence>
                  {messagesByRound[roundNum].map((message, index) => {
                    const robot = ROBOT_PERSONALITIES[message.robotId];
                    const style = getRobotStyle(message.robotId);
                    const Icon = style.icon;
                    const isResponding = message.respondingTo !== undefined;
                    const respondingToMessage = conversation.find(m => m.id === message.respondingTo);

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 100
                        }}
                      >
                        <Card className={`${style.bg} ${style.border} shadow-sm`}>
                          <CardContent className="p-4">
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{robot.emoji}</span>
                                  <div>
                                    <h4 className="font-semibold text-sm">{robot.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Icon className="h-3 w-3" />
                                      <span>{robot.traits[0]} thinking</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Badge variant="secondary" className="text-xs">
                                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Badge>
                            </div>

                            {/* Responding To Indicator */}
                            {isResponding && respondingToMessage && (
                              <motion.div
                                className="mb-3 p-2 bg-muted/50 rounded-lg border-l-2 border-primary"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ delay: 0.2 }}
                              >
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>Responding to {respondingToMessage.robotName}</span>
                                </div>
                                <p className="text-xs truncate">
                                  &ldquo;{respondingToMessage.message.substring(0, 100)}...&rdquo;
                                </p>
                              </motion.div>
                            )}

                            {/* Message Content */}
                            <div className="prose prose-sm max-w-none">
                              <p className="text-sm leading-relaxed mb-0">
                                {message.message}
                              </p>
                            </div>

                            {/* Educational Insights */}
                            <motion.div
                              className="mt-3 pt-3 border-t border-muted/50"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500" />
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-medium">AI Insight:</span>
                                  <span className="ml-1">
                                    {message.robotId === 'friend' && "Using empathy to connect with others' feelings"}
                                    {message.robotId === 'nerd' && "Breaking down complex ideas into understandable parts"}
                                    {message.robotId === 'zen' && "Finding deeper meaning and wisdom in the topic"}
                                    {message.robotId === 'pirate' && "Approaching with bold creativity and adventure"}
                                    {message.robotId === 'drama' && "Expressing ideas with passion and theatrical flair"}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}

          {/* Completion Message */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Discussion Complete! 🎉</h3>
              <p className="text-muted-foreground mb-4">
                The robots shared their different perspectives and learned from each other.
                Notice how each AI thinks differently based on their personality!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.keys(ROBOT_PERSONALITIES).map((robotId) => {
                  const messagesFromRobot = conversation.filter(m => m.robotId === robotId).length;
                  if (messagesFromRobot === 0) return null;
                  
                  const robot = ROBOT_PERSONALITIES[robotId as RobotId];
                  return (
                    <Badge key={robotId} variant="secondary" className="text-xs">
                      {robot.emoji} {robot.name}: {messagesFromRobot} messages
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}