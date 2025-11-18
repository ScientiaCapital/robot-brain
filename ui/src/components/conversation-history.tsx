"use client"

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Trash2, ChevronRight, X } from 'lucide-react';

interface Conversation {
  id: string;
  session_id: string;
  robot_personality: string;
  user_message: string;
  robot_response: string;
  created_at: string;
}

interface ConversationHistoryProps {
  onClose?: () => void;
  onSelectSession?: (sessionId: string) => void;
  className?: string;
}

export function ConversationHistory({ onClose, onSelectSession, className = '' }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<Conversation[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions list
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = search
        ? `/api/history?search=${encodeURIComponent(search)}`
        : '/api/history';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSessions(data.conversations || []);
    } catch (err) {
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Fetch messages for a session
  const fetchMessages = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/history?sessionId=${sessionId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMessages(data.conversations || []);
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
    }
  }, [selectedSession, fetchMessages]);

  // Export as JSON
  const exportJSON = () => {
    const data = selectedSession ? messages : sessions;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-brain-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as text
  const exportText = () => {
    const data = selectedSession ? messages : sessions;
    let text = 'Robot Brain Conversation History\n';
    text += '================================\n\n';

    data.forEach(conv => {
      const date = new Date(conv.created_at).toLocaleString();
      text += `[${date}]\n`;
      text += `You: ${conv.user_message}\n`;
      text += `Robot: ${conv.robot_response}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-brain-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      await fetch(`/api/history?sessionId=${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to delete conversation');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {selectedSession ? 'Conversation' : 'History'}
        </h2>
        <div className="flex items-center gap-2">
          {selectedSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedSession(null);
                setMessages([]);
              }}
            >
              Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportJSON} title="Export as JSON">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportText} title="Export as Text">
            TXT
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {!selectedSession && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : selectedSession ? (
          // Messages view
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-purple-100 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">{msg.user_message}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">{msg.robot_response}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-gray-500 py-8">No messages found</p>
            )}
          </div>
        ) : (
          // Sessions list
          <div className="space-y-2">
            {sessions.map(session => (
              <Card
                key={session.session_id}
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedSession(session.session_id);
                  onSelectSession?.(session.session_id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.user_message}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.robot_response}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.session_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No conversations yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
