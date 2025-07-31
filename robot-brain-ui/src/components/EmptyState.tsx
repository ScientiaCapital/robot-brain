import { motion } from "framer-motion";

interface EmptyStateProps {
  robotName: string;
  robotEmoji: string;
}

export function EmptyState({ robotName, robotEmoji }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-6xl mb-4"
      >
        {robotEmoji}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold mb-2"
      >
        Chat with {robotName}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-sm"
      >
        Start a conversation by typing a message below or use one of the quick actions!
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-wrap gap-2 justify-center"
      >
        <div className="text-xs text-muted-foreground">
          Try saying: "Hello!" • "Tell me about yourself" • "What can you do?"
        </div>
      </motion.div>
    </div>
  );
}