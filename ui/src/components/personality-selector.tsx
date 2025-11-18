"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAvailableRobots, type RobotConfig } from '@/lib/robot-config';
import { Check } from 'lucide-react';

interface PersonalitySelectorProps {
  currentRobotId: string;
  onSelect: (robot: RobotConfig) => void;
  className?: string;
}

export function PersonalitySelector({ currentRobotId, onSelect, className = '' }: PersonalitySelectorProps) {
  const robots = getAvailableRobots();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className={`grid grid-cols-2 gap-3 p-4 ${className}`}>
      {robots.map(robot => {
        const isSelected = robot.id === currentRobotId;
        const isHovered = robot.id === hoveredId;

        return (
          <Card
            key={robot.id}
            className={`
              relative p-4 cursor-pointer transition-all duration-200
              ${isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-md'}
            `}
            style={{
              borderColor: isSelected ? robot.color : undefined,
              ringColor: robot.color
            }}
            onClick={() => onSelect(robot)}
            onMouseEnter={() => setHoveredId(robot.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {isSelected && (
              <div
                className="absolute top-2 right-2 rounded-full p-1"
                style={{ backgroundColor: robot.color }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}

            <div className="text-center">
              <span className="text-3xl">{robot.emoji}</span>
              <h3 className="font-semibold mt-2 text-sm">{robot.name}</h3>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {robot.traits.slice(0, 2).map(trait => (
                  <span
                    key={trait}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {(isHovered || isSelected) && (
              <div className="mt-3 text-xs text-gray-500 text-center line-clamp-2">
                {robot.welcomeMessage.slice(0, 60)}...
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

interface PersonalitySelectorModalProps {
  isOpen: boolean;
  currentRobotId: string;
  onSelect: (robot: RobotConfig) => void;
  onClose: () => void;
}

export function PersonalitySelectorModal({
  isOpen,
  currentRobotId,
  onSelect,
  onClose
}: PersonalitySelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-center">Choose Your Robot</h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            Each robot has a unique personality!
          </p>
        </div>

        <PersonalitySelector
          currentRobotId={currentRobotId}
          onSelect={(robot) => {
            onSelect(robot);
            onClose();
          }}
        />

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
