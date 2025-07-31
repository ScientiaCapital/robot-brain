"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ROBOT_PERSONALITIES, type RobotId } from "@/lib/robot-config";
import { Volume2, Brain, Zap } from "lucide-react";

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

interface RobotCircleProps {
  robots: RobotId[];
  conversation: ConversationMessage[];
  currentSpeaker: RobotId | null;
}

export function RobotCircle({ robots, conversation, currentSpeaker }: RobotCircleProps) {
  // Calculate robot positions in a circle
  const getPosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2; // Start from top
    const radius = total <= 3 ? 80 : total <= 4 ? 90 : 100;
    const centerX = 150;
    const centerY = 150;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Get robot's thinking style explanation
  const getThinkingStyle = (robotId: RobotId) => {
    const styles = {
      friend: "Uses empathy and kindness to understand others",
      nerd: "Analyzes facts and explains things step by step", 
      zen: "Thinks deeply and shares wisdom through stories",
      pirate: "Approaches problems with bold adventure and creativity",
      drama: "Expresses ideas with passion and theatrical flair"
    };
    return styles[robotId] || "Thinks in their own unique way";
  };

  // Count messages per robot for activity indicator
  const getMessageCount = (robotId: RobotId) => {
    return conversation.filter(msg => msg.robotId === robotId).length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Thinking Circle
        </h3>
        <p className="text-sm text-muted-foreground">
          Watch how different AI personalities think and respond to each other
        </p>
      </div>

      {/* Robot Circle */}
      <div className="flex-1 relative">
        <svg
          width="300"
          height="300"
          className="mx-auto"
          viewBox="0 0 300 300"
        >
          {/* Connection lines between robots (when they respond to each other) */}
          {conversation.map((message, index) => {
            if (!message.respondingTo) return null;
            
            const speakerIndex = robots.indexOf(message.robotId);
            const targetMessage = conversation.find(m => m.id === message.respondingTo);
            if (!targetMessage) return null;
            
            const targetIndex = robots.indexOf(targetMessage.robotId);
            if (speakerIndex === -1 || targetIndex === -1) return null;

            const speakerPos = getPosition(speakerIndex, robots.length);
            const targetPos = getPosition(targetIndex, robots.length);

            return (
              <motion.line
                key={`connection-${message.id}`}
                x1={speakerPos.x}
                y1={speakerPos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="rgb(99 102 241 / 0.3)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            );
          })}

          {/* Robot avatars */}
          {robots.map((robotId, index) => {
            const robot = ROBOT_PERSONALITIES[robotId];
            const position = getPosition(index, robots.length);
            const isCurrentSpeaker = currentSpeaker === robotId;
            const messageCount = getMessageCount(robotId);
            const hasSpoken = messageCount > 0;

            return (
              <g key={robotId}>
                {/* Glow effect for current speaker */}
                {isCurrentSpeaker && (
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r="35"
                    fill="none"
                    stroke="rgb(99 102 241 / 0.5)"
                    strokeWidth="3"
                    initial={{ r: 25, opacity: 0 }}
                    animate={{ r: 35, opacity: 1 }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  />
                )}

                {/* Robot avatar background */}
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r="25"
                  fill={hasSpoken ? "rgb(34 197 94 / 0.1)" : "rgb(156 163 175 / 0.1)"}
                  stroke={hasSpoken ? "rgb(34 197 94 / 0.3)" : "rgb(156 163 175 / 0.3)"}
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                />

                {/* Robot emoji */}
                <motion.text
                  x={position.x}
                  y={position.y + 5}
                  textAnchor="middle"
                  fontSize="20"
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: isCurrentSpeaker ? [1, 1.2, 1] : 1,
                    rotate: isCurrentSpeaker ? [0, -5, 5, 0] : 0 
                  }}
                  transition={{ 
                    duration: isCurrentSpeaker ? 0.6 : 0.5,
                    repeat: isCurrentSpeaker ? Infinity : 0,
                    delay: index * 0.1 
                  }}
                >
                  {robot.emoji}
                </motion.text>

                {/* Speaking indicator */}
                {isCurrentSpeaker && (
                  <motion.g>
                    <circle
                      cx={position.x + 20}
                      cy={position.y - 20}
                      r="8"
                      fill="rgb(34 197 94)"
                    />
                    <Volume2
                      x={position.x + 15}
                      y={position.y - 25}
                      width="10"
                      height="10"
                      fill="white"
                    />
                  </motion.g>
                )}

                {/* Activity indicator (message count) */}
                {messageCount > 0 && (
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <circle
                      cx={position.x + 18}
                      cy={position.y + 18}
                      r="8"
                      fill="rgb(99 102 241)"
                    />
                    <text
                      x={position.x + 18}
                      y={position.y + 22}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                    >
                      {messageCount}
                    </text>
                  </motion.g>
                )}

                {/* Robot name label */}
                <motion.text
                  x={position.x}
                  y={position.y + 45}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="500"
                  fill="currentColor"
                  initial={{ opacity: 0, y: position.y + 35 }}
                  animate={{ opacity: 1, y: position.y + 45 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {robot.name}
                </motion.text>
              </g>
            );
          })}

          {/* Center label */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <circle
              cx="150"
              cy="150"
              r="25"
              fill="rgb(99 102 241 / 0.1)"
              stroke="rgb(99 102 241 / 0.3)"
              strokeWidth="2"
            />
            <Zap
              x="145"
              y="145"
              width="10"
              height="10"
              fill="rgb(99 102 241)"
            />
            <text
              x="150"
              y="165"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fontWeight="500"
            >
              AI Discussion
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Robot Details Panel */}
      <div className="mt-4 space-y-3 max-h-48 overflow-y-auto">
        <h4 className="font-medium text-sm">How Each Robot Thinks:</h4>
        {robots.map((robotId) => {
          const robot = ROBOT_PERSONALITIES[robotId];
          const messageCount = getMessageCount(robotId);
          const isActive = currentSpeaker === robotId;
          
          return (
            <motion.div
              key={robotId}
              className={`p-3 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-muted/50 border-border'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: robots.indexOf(robotId) * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{robot.emoji}</span>
                  <span className="font-medium text-sm">{robot.name}</span>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Speaking
                    </Badge>
                  )}
                </div>
                {messageCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {messageCount} message{messageCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {getThinkingStyle(robotId)}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {robot.traits.slice(0, 2).map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}