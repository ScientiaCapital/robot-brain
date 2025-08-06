import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface ChatBubbleProps {
  message: string;
  sender: "user" | "robot";
  robotEmoji?: string;
  robotName?: string;
  isTyping?: boolean;
}

// Memoized typing indicator to prevent unnecessary re-renders
const TypingIndicator = memo(() => (
  <div className="flex gap-1 py-1">
    <motion.div
      className="w-2 h-2 bg-current rounded-full opacity-60"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
    />
    <motion.div
      className="w-2 h-2 bg-current rounded-full opacity-60"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="w-2 h-2 bg-current rounded-full opacity-60"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
    />
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

export const ChatBubble = memo(function ChatBubble({ 
  message, 
  sender, 
  robotEmoji, 
  robotName,
  isTyping = false 
}: ChatBubbleProps) {
  // Memoize expensive className calculations
  const containerClass = useMemo(() => cn(
    "flex gap-3",
    sender === "user" ? "justify-end" : "justify-start"
  ), [sender]);

  const bubbleClass = useMemo(() => cn(
    "px-4 py-2.5 rounded-2xl relative",
    sender === "user"
      ? "bg-primary text-primary-foreground rounded-br-sm"
      : "bg-muted rounded-bl-sm",
    isTyping && "min-w-[60px]"
  ), [sender, isTyping]);

  const contentWrapperClass = useMemo(() => cn(
    "max-w-[85%] sm:max-w-[80%]",
    sender === "robot" && "flex flex-col gap-1"
  ), [sender]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={containerClass}
    >
      {sender === "robot" && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarFallback className="text-lg sm:text-xl bg-primary/10">
            {robotEmoji}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={contentWrapperClass}>
        {sender === "robot" && robotName && (
          <span className="text-xs text-muted-foreground ml-3">
            {robotName}
          </span>
        )}
        
        <div className={bubbleClass}>
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <p className="text-sm sm:text-base leading-relaxed">{message}</p>
          )}
        </div>
      </div>
      
      {sender === "user" && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
});