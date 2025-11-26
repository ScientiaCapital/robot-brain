-- ===========================================
-- Robot Brain Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor or via CLI:
-- supabase db push
-- ===========================================

-- Conversations table (stores all chat interactions)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id varchar,
  robot_personality varchar NOT NULL DEFAULT 'robot-friend',
  user_message text NOT NULL,
  robot_response text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Sessions table (tracks user sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar,
  started_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- RLS Policies (allow all for now - can be tightened later)
CREATE POLICY "Allow all operations on conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON conversations TO anon, authenticated;
GRANT ALL ON sessions TO anon, authenticated;

-- ===========================================
-- Schema complete!
-- Tables created:
--   - conversations (chat history)
--   - sessions (user sessions)
-- ===========================================
