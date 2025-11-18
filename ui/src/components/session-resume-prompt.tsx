"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sessionPersistence, type SessionState } from '@/lib/session-persistence';
import { getRobotById } from '@/lib/robot-config';
import { History, X, ArrowRight } from 'lucide-react';

interface SessionResumePromptProps {
  onResume: (session: SessionState) => void;
  onStartFresh: () => void;
  className?: string;
}

export function SessionResumePrompt({
  onResume,
  onStartFresh,
  className = ''
}: SessionResumePromptProps) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionPersistence.hasResumableSession()) {
      setSession(sessionPersistence.load());
    }
  }, []);

  if (!session || dismissed) return null;

  const robot = getRobotById(session.robotId);
  const messageCount = session.messages.length;
  const lastMessage = session.messages[session.messages.length - 1];
  const timeAgo = sessionPersistence.getSessionAge();

  const handleResume = () => {
    onResume(session);
    setDismissed(true);
  };

  const handleStartFresh = () => {
    sessionPersistence.clear();
    onStartFresh();
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <Card className={`p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <History className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Continue your conversation?</h3>
            <p className="text-xs text-gray-600 mt-1">
              You have {messageCount} message{messageCount === 1 ? '' : 's'} with{' '}
              {robot?.name || 'Robot Friend'} from {timeAgo}
            </p>
            {lastMessage && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                Last: "{lastMessage.content.slice(0, 50)}
                {lastMessage.content.length > 50 ? '...' : ''}"
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="default"
          size="sm"
          onClick={handleResume}
          className="flex-1"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartFresh}
          className="flex-1"
        >
          Start Fresh
        </Button>
      </div>
    </Card>
  );
}
