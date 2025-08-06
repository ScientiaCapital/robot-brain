#!/usr/bin/env node

/**
 * Universal Agent Creator Platform - Consolidated Database Setup
 * Creates all required tables for the multi-agent platform
 * Consolidated from basic + enhanced schemas to eliminate redundancy
 * 
 * Features:
 * - User management with professional/kid/parent types
 * - Agent creation and team management
 * - Workflow orchestration and marketplace
 * - Voice interaction sessions and educational progress
 * - Automatic schema creation and migration
 * - Compatibility with Neon PostgreSQL
 * - Error recovery and rollback support
 * - Performance optimization checks
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');
// Consolidated comprehensive schema (formerly enhanced schema)
const COMPREHENSIVE_SCHEMA = `
-- ============================================
-- Universal Agent Creator Platform - Consolidated Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT, -- Optional for OAuth users
    full_name VARCHAR(255),
    user_type VARCHAR(50) NOT NULL DEFAULT 'professional', -- 'professional', 'kid', 'parent', 'enterprise'
    parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For kid accounts
    avatar_url TEXT,
    bio TEXT,
    company VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    api_quota INTEGER DEFAULT 1000,
    api_quota_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 month',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AGENT MANAGEMENT
-- ============================================

-- Agents table for user-created agents
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    agent_type VARCHAR(100) NOT NULL, -- 'assistant', 'specialist', 'creative', 'analytical', 'custom'
    capabilities TEXT[], -- Array of capability strings
    configuration JSONB NOT NULL DEFAULT '{}', -- Full agent configuration
    system_prompt TEXT,
    model_settings JSONB DEFAULT '{}', -- LLM settings (model, temperature, etc.)
    tools JSONB DEFAULT '[]', -- Available tools configuration
    knowledge_base JSONB DEFAULT '[]', -- References to knowledge sources
    personality_traits JSONB DEFAULT '{}',
    voice_config JSONB DEFAULT '{}', -- Voice synthesis settings
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    template_category VARCHAR(100), -- For marketplace templates
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'archived', 'under_review'
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent teams for multi-agent collaboration
CREATE TABLE IF NOT EXISTS agent_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_type VARCHAR(100) NOT NULL, -- 'collaborative', 'hierarchical', 'swarm', 'custom'
    configuration JSONB DEFAULT '{}', -- Team configuration and rules
    orchestration_strategy VARCHAR(100) DEFAULT 'round_robin', -- 'round_robin', 'leader_based', 'consensus', 'custom'
    communication_protocol JSONB DEFAULT '{}', -- How agents communicate
    shared_memory JSONB DEFAULT '{}', -- Shared context/memory
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    max_agents INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team members relationship
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES agent_teams(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- 'leader', 'member', 'specialist', 'reviewer'
    responsibilities TEXT[],
    permissions JSONB DEFAULT '{}',
    communication_channels TEXT[], -- Which channels this agent monitors
    priority INTEGER DEFAULT 0, -- Execution priority
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, agent_id)
);

-- ============================================
-- WORKFLOW MANAGEMENT
-- ============================================

-- Workflows for complex multi-step processes
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES agent_teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(100) NOT NULL, -- 'sequential', 'parallel', 'conditional', 'loop', 'custom'
    definition JSONB NOT NULL, -- Complete workflow definition (steps, conditions, etc.)
    input_schema JSONB DEFAULT '{}', -- Expected input format
    output_schema JSONB DEFAULT '{}', -- Expected output format
    triggers JSONB DEFAULT '[]', -- Workflow triggers (manual, scheduled, event-based)
    timeout_seconds INTEGER DEFAULT 3600,
    retry_policy JSONB DEFAULT '{}',
    error_handling JSONB DEFAULT '{}',
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,
    success_rate DECIMAL(5, 2),
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES agent_teams(id) ON DELETE SET NULL,
    execution_status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    execution_log JSONB DEFAULT '[]', -- Step-by-step execution log
    error_details JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}', -- Performance metrics
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    parent_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE -- For nested workflows
);

-- ============================================
-- EDUCATIONAL FEATURES
-- ============================================

-- Kids progress tracking
CREATE TABLE IF NOT EXISTS kids_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_category VARCHAR(100) NOT NULL, -- 'coding', 'logic', 'creativity', 'problem_solving'
    skill_name VARCHAR(255) NOT NULL,
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]',
    learning_path JSONB DEFAULT '{}',
    completed_lessons JSONB DEFAULT '[]',
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    parent_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_category, skill_name)
);

-- ============================================
-- MARKETPLACE
-- ============================================

-- Marketplace listings for agents and workflows
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'agent', 'workflow', 'team', 'knowledge_pack'
    item_id UUID NOT NULL, -- References agents.id or workflows.id or agent_teams.id
    title VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    price_type VARCHAR(50) NOT NULL, -- 'free', 'one_time', 'subscription', 'usage_based'
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    subscription_period VARCHAR(20), -- 'monthly', 'yearly'
    usage_pricing JSONB DEFAULT '{}', -- For usage-based pricing
    demo_available BOOLEAN DEFAULT false,
    demo_url TEXT,
    documentation_url TEXT,
    support_url TEXT,
    screenshots TEXT[],
    video_url TEXT,
    features JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '{}',
    installation_count INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
    rejection_reason TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(item_type, item_id)
);

-- ============================================
-- VOICE INTERACTIONS
-- ============================================

-- Voice interaction sessions
CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    voice_provider VARCHAR(50) NOT NULL, -- 'elevenlabs', 'azure', 'google', 'amazon'
    voice_id VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'en-US',
    audio_format VARCHAR(20) DEFAULT 'mp3',
    conversation_mode VARCHAR(50) DEFAULT 'turn_based', -- 'turn_based', 'continuous', 'push_to_talk'
    transcript JSONB DEFAULT '[]', -- Full conversation transcript
    audio_urls JSONB DEFAULT '[]', -- Stored audio file references
    total_duration_seconds INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    interruption_count INTEGER DEFAULT 0,
    sentiment_analysis JSONB DEFAULT '{}',
    quality_metrics JSONB DEFAULT '{}', -- Audio quality, latency, etc.
    cost DECIMAL(10, 4) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' -- 'active', 'paused', 'ended', 'error'
);

-- ============================================
-- CONTENT MODERATION & SAFETY
-- ============================================

-- Content moderation logs
CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    session_id UUID,
    content_type VARCHAR(50) NOT NULL, -- 'text', 'audio', 'image', 'agent_config'
    content TEXT,
    content_hash VARCHAR(255),
    moderation_result VARCHAR(50) NOT NULL, -- 'approved', 'flagged', 'blocked', 'review_needed'
    risk_scores JSONB DEFAULT '{}', -- Different risk categories and scores
    detected_issues TEXT[],
    action_taken VARCHAR(100),
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For manual review
    moderator_notes TEXT,
    auto_moderated BOOLEAN DEFAULT true,
    appeal_status VARCHAR(50), -- 'none', 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- LEGACY COMPATIBILITY TABLES
-- ============================================

-- Conversations table (maintain compatibility with existing API)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    robot_personality VARCHAR NOT NULL,
    user_message TEXT NOT NULL,
    robot_response TEXT NOT NULL,
    session_id VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (legacy)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent interactions (renamed from robot_interactions for consistency)
CREATE TABLE IF NOT EXISTS agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100) NOT NULL,
    user_input TEXT,
    agent_response TEXT,
    context JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tool usage tracking
CREATE TABLE IF NOT EXISTS tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    tool_name VARCHAR NOT NULL,
    parameters JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding size
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics for performance monitoring
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_expires_at);

-- Agent indexes
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_public ON agents(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_agents_template ON agents(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_agents_tags ON agents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_agents_search ON agents USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Team indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner ON agent_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_agent ON team_members(agent_id);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_owner ON workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_team ON workflows(team_id);
CREATE INDEX IF NOT EXISTS idx_workflows_public ON workflows(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_workflow_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_user ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_status ON workflow_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_started ON workflow_executions(started_at DESC);

-- Educational indexes
CREATE INDEX IF NOT EXISTS idx_kids_progress_user ON kids_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_kids_progress_category ON kids_progress(skill_category);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON marketplace_listings(item_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON marketplace_listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_search ON marketplace_listings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Voice session indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_agent ON voice_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_token ON voice_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started ON voice_sessions(started_at DESC);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_moderation_user ON content_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_agent ON content_moderation(agent_id);
CREATE INDEX IF NOT EXISTS idx_moderation_result ON content_moderation(moderation_result);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON content_moderation(created_at DESC);

-- Legacy table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_session ON agent_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_user ON agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created ON agent_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_teams_updated_at BEFORE UPDATE ON agent_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_progress_updated_at BEFORE UPDATE ON kids_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'User accounts with role-based access for professionals, kids, and parents';
COMMENT ON TABLE agents IS 'AI agents created by users with full configuration and capabilities';
COMMENT ON TABLE agent_teams IS 'Multi-agent teams for collaborative AI workflows';
COMMENT ON TABLE team_members IS 'Membership and roles within agent teams';
COMMENT ON TABLE workflows IS 'Complex multi-step processes orchestrated by agents';
COMMENT ON TABLE workflow_executions IS 'Execution history and logs for workflows';
COMMENT ON TABLE kids_progress IS 'Educational progress tracking for kid users';
COMMENT ON TABLE marketplace_listings IS 'Marketplace for sharing and selling agents and workflows';
COMMENT ON TABLE voice_sessions IS 'Voice interaction sessions with agents';
COMMENT ON TABLE content_moderation IS 'Content moderation and safety logs';
COMMENT ON TABLE agent_interactions IS 'Individual interactions between users and agents';
COMMENT ON TABLE conversations IS 'Legacy conversation storage for backward compatibility';
`;
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const SETUP_START_TIME = Date.now();

// Terminal colors for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}🔧${colors.reset} ${msg}`)
};

async function checkEnvironment() {
  log.step('Checking environment configuration...');
  
  // Check for environment file
  if (!fs.existsSync(ENV_FILE)) {
    log.error('.env.local not found');
    
    if (fs.existsSync(ENV_EXAMPLE)) {
      log.info('Creating .env.local from template...');
      
      try {
        // Auto-create .env.local from .env.example
        fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
        log.success('.env.local created from template');
        log.warning('Please configure your database URL in .env.local');
        
        // Show instructions
        console.log(`\n${colors.cyan}Quick Setup Instructions:${colors.reset}`);
        console.log('1. Get your database URL from: https://console.neon.tech/');
        console.log('2. Add it to .env.local as NEON_DATABASE_URL=...');
        console.log('3. Run this script again: npm run setup:database');
        return false;
      } catch (error) {
        log.error(`Failed to create .env.local: ${error.message}`);
        log.info('Manually run: cp .env.example .env.local');
        return false;
      }
    } else {
      log.error('No .env.example found to use as template');
      return false;
    }
  }
  
  // Load environment variables
  require('dotenv').config({ path: ENV_FILE });
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    log.error('Database URL not configured in .env.local');
    log.info('Get your database URL from: https://console.neon.tech/');
    console.log(`\n${colors.cyan}Step-by-step guide:${colors.reset}`);
    console.log('1. Sign up at https://console.neon.tech/ (free tier available)');
    console.log('2. Create a new project');
    console.log('3. Copy the connection string');
    console.log('4. Add to .env.local: NEON_DATABASE_URL="your-connection-string"');
    return false;
  }
  
  // Validate database URL format
  if (!dbUrl.includes('postgresql://') && !dbUrl.includes('postgres://')) {
    log.error('Invalid database URL format');
    log.info('URL should start with postgresql:// or postgres://');
    return false;
  }
  
  log.success('Environment configured correctly');
  return true;
}

async function testDatabaseConnection() {
  log.step('Testing database connection...');
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT current_database(), version(), current_user`;
    
    log.success(`Connected to database: ${result[0].current_database}`);
    log.info(`PostgreSQL ${result[0].version.split(' ')[1]}`);
    log.info(`Connected as: ${result[0].current_user}`);
    
    return sql;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    log.info('Please check your NEON_DATABASE_URL in .env.local');
    return null;
  }
}

async function createTables(sql, retryOnError = true) {
  log.step('Creating comprehensive database schema...');
  
  const createdObjects = [];
  const errors = [];
  
  try {
    // Use the consolidated comprehensive schema
    const schemaSQL = COMPREHENSIVE_SCHEMA;
    
    // Split by semicolons but keep them for execution
    const statements = schemaSQL
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    log.info(`Found ${statements.length} SQL statements to execute`);
    
    // Start transaction for rollback support
    let successCount = 0;
    let inTransaction = false;
    
    try {
      // Begin transaction for atomic operations
      await sql`BEGIN`;
      inTransaction = true;
      
      // Execute each statement
      for (const statement of statements) {
        // Skip comments-only statements
        if (statement.replace(/--.*$/gm, '').trim().length === 0) {
          continue;
        }
        
        try {
          // Extract object names for logging
          const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          const triggerMatch = statement.match(/CREATE TRIGGER (\w+)/i);
          const functionMatch = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/i);
          const extensionMatch = statement.match(/CREATE EXTENSION IF NOT EXISTS "?(\w+)"?/i);
          
          await sql`${statement}`;
          
          if (tableMatch) {
            log.success(`  Table '${tableMatch[1]}' ready`);
            createdObjects.push({ type: 'table', name: tableMatch[1] });
            successCount++;
          } else if (indexMatch) {
            log.success(`  Index '${indexMatch[1]}' created`);
            createdObjects.push({ type: 'index', name: indexMatch[1] });
            successCount++;
          } else if (triggerMatch) {
            log.success(`  Trigger '${triggerMatch[1]}' created`);
            createdObjects.push({ type: 'trigger', name: triggerMatch[1] });
            successCount++;
          } else if (functionMatch) {
            log.success(`  Function '${functionMatch[1]}' created`);
            createdObjects.push({ type: 'function', name: functionMatch[1] });
            successCount++;
          } else if (extensionMatch) {
            log.success(`  Extension '${extensionMatch[1]}' configured`);
            createdObjects.push({ type: 'extension', name: extensionMatch[1] });
            successCount++;
          } else if (statement.includes('COMMENT ON')) {
            successCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          // Check if it's an "already exists" error which is OK
          if (error.message.includes('already exists')) {
            const objectName = error.message.match(/"([^"]+)"/)?.[1] || 'object';
            log.info(`  Skipped (already exists): ${objectName}`);
          } else if (error.message.includes('permission denied')) {
            log.warning(`  Permission denied: ${error.message}`);
            errors.push(error.message);
            // Continue with other statements
          } else {
            throw error; // Re-throw to trigger rollback
          }
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      log.success(`Database schema setup complete (${successCount} operations)`);
      
      return { success: true, createdObjects, errors };
      
    } catch (error) {
      // Rollback on error
      if (inTransaction) {
        try {
          await sql`ROLLBACK`;
          log.warning('Transaction rolled back due to error');
        } catch (rollbackError) {
          log.error(`Rollback failed: ${rollbackError.message}`);
        }
      }
      
      errors.push(error.message);
      
      // Retry once with individual statements (non-transactional)
      if (retryOnError) {
        log.warning('Retrying with non-transactional approach...');
        
        // Execute statements individually without transaction
        for (const statement of statements) {
          if (statement.replace(/--.*$/gm, '').trim().length === 0) {
            continue;
          }
          
          try {
            await sql`${statement}`;
            successCount++;
          } catch (err) {
            if (!err.message.includes('already exists')) {
              errors.push(err.message);
            }
          }
        }
        
        if (successCount > 0) {
          log.success(`Partial success: ${successCount} operations completed`);
          return { success: true, createdObjects, errors };
        }
      }
      
      throw error;
    }
    
  } catch (error) {
    log.error(`Schema creation failed: ${error.message}`);
    return { success: false, createdObjects, errors };
  }
}

async function validateSchema(sql) {
  log.step('Validating database schema...');
  
  const requiredTables = [
    // Core Phase B tables
    'users', 'agents', 'agent_teams', 'team_members',
    'workflows', 'workflow_executions', 'kids_progress',
    'marketplace_listings', 'voice_sessions', 'content_moderation',
    // Legacy compatibility tables
    'sessions', 'conversations', 'agent_interactions', 'tool_usage', 'embeddings', 'analytics'
  ];
  const existingTables = [];
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        )
      `;
      
      if (result[0].exists) {
        existingTables.push(table);
      } else {
        missingTables.push(table);
      }
    } catch (error) {
      missingTables.push(table);
    }
  }
  
  if (existingTables.length > 0) {
    log.success(`Found ${existingTables.length} tables: ${existingTables.join(', ')}`);
  }
  
  if (missingTables.length > 0) {
    log.warning(`Missing ${missingTables.length} tables: ${missingTables.join(', ')}`);
    return false;
  }
  
  return true;
}

async function checkExtensions(sql) {
  log.step('Checking required PostgreSQL extensions...');
  
  try {
    // Check for UUID extension
    const uuidResult = await sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      ) as exists
    `;
    
    if (uuidResult[0].exists) {
      log.success('UUID extension is installed');
    } else {
      log.warning('UUID extension not found, will be installed during setup');
    }
    
    // Check for pgvector extension (optional but recommended)
    const vectorResult = await sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists
    `;
    
    if (vectorResult[0].exists) {
      log.success('pgvector extension is installed (for embeddings)');
    } else {
      log.info('pgvector extension not found (optional, for semantic search)');
    }
    
    return true;
  } catch (error) {
    log.warning('Could not check extensions: ' + error.message);
    return false;
  }
}

async function getTableStats(sql) {
  log.step('Checking database statistics...');
  
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM sessions) as sessions,
        (SELECT COUNT(*) FROM agent_interactions) as interactions,
        (SELECT COUNT(*) FROM tool_usage) as tool_usage,
        (SELECT COUNT(*) FROM analytics) as analytics
    `;
    
    const s = stats[0];
    log.info(`Database Statistics:`);
    log.info(`  • Conversations: ${s.conversations}`);
    log.info(`  • Sessions: ${s.sessions}`);
    log.info(`  • Agent Interactions: ${s.interactions}`);
    log.info(`  • Tool Usage: ${s.tool_usage}`);
    log.info(`  • Analytics Events: ${s.analytics}`);
    
    return true;
  } catch (error) {
    // Tables might not exist yet, which is OK
    return false;
  }
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Universal Agent Creator Platform - Database Setup${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Consolidated Schema: Professional + Kids + Marketplace + Multi-Agent Teams${colors.reset}\n`);
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    console.log(`\n${colors.red}Setup failed. Please configure your environment first.${colors.reset}`);
    process.exit(1);
  }
  
  // Test connection
  const sql = await testDatabaseConnection();
  if (!sql) {
    console.log(`\n${colors.red}Cannot proceed without database connection.${colors.reset}`);
    process.exit(1);
  }
  
  // Check extensions
  console.log('');
  await checkExtensions(sql);
  
  // Check existing schema
  console.log('');
  const schemaExists = await validateSchema(sql);
  
  if (!schemaExists) {
    console.log('');
    const answer = await promptUser(`${colors.yellow}Would you like to create the database tables now? (y/n): ${colors.reset}`);
    
    if (answer === 'y' || answer === 'yes') {
      console.log('');
      const result = await createTables(sql);
      
      if (!result.success) {
        log.error('Failed to create tables. Please check the errors above.');
        if (result.errors.length > 0) {
          console.log(`\n${colors.red}Errors encountered:${colors.reset}`);
          result.errors.forEach(err => console.log(`  • ${err}`));
        }
        process.exit(1);
      }
      
      // Show what was created
      if (result.createdObjects.length > 0) {
        console.log(`\n${colors.green}Created objects:${colors.reset}`);
        const grouped = result.createdObjects.reduce((acc, obj) => {
          if (!acc[obj.type]) acc[obj.type] = [];
          acc[obj.type].push(obj.name);
          return acc;
        }, {});
        
        Object.entries(grouped).forEach(([type, names]) => {
          console.log(`  ${type}s: ${names.join(', ')}`);
        });
      }
      
      // Validate again after creation
      console.log('');
      const valid = await validateSchema(sql);
      if (!valid) {
        log.error('Schema validation failed after creation.');
        process.exit(1);
      }
    } else {
      log.warning('Skipping table creation. You can run this script again later.');
    }
  } else {
    log.success('All required tables are present');
  }
  
  // Get statistics
  console.log('');
  await getTableStats(sql);
  
  // Calculate setup time
  const setupTime = ((Date.now() - SETUP_START_TIME) / 1000).toFixed(1);
  
  // Check for required API keys
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}✨ Database setup complete in ${setupTime} seconds!${colors.reset}`);
  
  if (parseFloat(setupTime) < 300) {
    log.success(`Setup completed under 5 minutes as promised! ⚡`);
  }
  
  console.log('');
  log.step('Next steps:');
  
  const missingKeys = [];
  if (!process.env.ANTHROPIC_API_KEY) {
    missingKeys.push('ANTHROPIC_API_KEY (for AI conversation)');
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    missingKeys.push('ELEVENLABS_API_KEY (for voice synthesis)');
  }
  
  if (missingKeys.length > 0) {
    log.warning('Add these API keys to .env.local:');
    missingKeys.forEach(key => console.log(`     • ${key}`));
    console.log('');
  }
  
  console.log(`  1. Configure your agent: ${colors.cyan}edit config/agent.json${colors.reset}`);
  console.log(`     • Set agentName to your agent's name`);
  console.log(`     • Choose personality from config/personalities.json`);
  console.log(`     • Configure industry-specific settings`);
  console.log('');
  console.log(`  2. Start development: ${colors.cyan}npm run dev${colors.reset}`);
  console.log(`  3. Open browser: ${colors.cyan}http://localhost:3000${colors.reset}`);
  
  // Show platform capabilities
  console.log(`\n${colors.cyan}Platform Capabilities:${colors.reset}`);
  console.log(`  • Professional Agents: Business, construction, healthcare, support`);
  console.log(`  • Educational Agents: Kids learning (Spanish, math, coding, art)`);
  console.log(`  • Multi-Agent Teams: Collaborative AI workflows`);
  console.log(`  • Agent Marketplace: Share and monetize agent creations`);
  console.log(`  • Voice Interactions: Natural conversation with agents`);
  console.log(`  • Progress Tracking: Educational milestones for kids`);
  
  console.log(`\n${colors.blue}Ready to build the future of AI agents! 🤖✨${colors.reset}\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}