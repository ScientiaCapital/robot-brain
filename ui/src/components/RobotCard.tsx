"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROBOT_PERSONALITIES, ROBOT_TOOLS, type RobotId } from "@/lib/robot-config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RobotCardProps {
  robotId: RobotId;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

export function RobotCard({ robotId, isSelected = false, onClick, index = 0 }: RobotCardProps) {
  const robot = ROBOT_PERSONALITIES[robotId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg overflow-hidden",
          isSelected && "ring-2 ring-primary shadow-lg"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-3">
            <motion.div 
              className="text-4xl"
              animate={isSelected ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {robot.emoji}
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{robot.name}</h3>
              <p className="text-sm text-muted-foreground">
                {robot.traits.join(", ")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {robot.tools?.slice(0, 3).map((toolId, i) => {
              const tool = ROBOT_TOOLS[toolId as keyof typeof ROBOT_TOOLS];
              return (
                <motion.div
                  key={toolId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    {tool.icon} {tool.name}
                  </Badge>
                </motion.div>
              );
            })}
            {(robot.tools?.length ?? 0) > 3 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{(robot.tools?.length ?? 0) - 3} more
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}