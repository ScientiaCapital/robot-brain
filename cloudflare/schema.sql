-- Robot Brain D1 Database Schema

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS tool_usage;
DROP TABLE IF EXISTS robot_interactions;
DROP TABLE IF EXISTS conversations;

-- Conversations table for storing chat history
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    robot_personality TEXT NOT NULL,
    user_message TEXT NOT NULL,
    robot_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    metadata TEXT -- JSON field for additional data
);

-- Robot interactions table for multi-robot chats
CREATE TABLE robot_interactions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- discussion, debate, brainstorm
    participants TEXT NOT NULL, -- JSON array of robot names
    responses TEXT NOT NULL, -- JSON array of responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tool usage tracking
CREATE TABLE tool_usage (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    robot_personality TEXT,
    input_params TEXT NOT NULL, -- JSON
    output_result TEXT NOT NULL, -- JSON
    status TEXT NOT NULL, -- success, error
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_robot ON conversations(robot_personality);
CREATE INDEX idx_conversations_created ON conversations(created_at);
CREATE INDEX idx_tool_usage_tool ON tool_usage(tool_name);
CREATE INDEX idx_tool_usage_created ON tool_usage(created_at);
CREATE INDEX idx_robot_interactions_created ON robot_interactions(created_at);