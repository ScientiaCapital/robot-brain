#!/usr/bin/env node

/**
 * Simplified Database Setup for AI Voice Agent Template
 * Fixed for @neondatabase/serverless v1.0.1+ syntax requirements
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`)
};

async function setupDatabase() {
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log.error('Database URL not found in environment variables');
    process.exit(1);
  }
  
  try {
    log.info('Connecting to database...');
    const sql = neon(dbUrl);
    
    // Test connection
    await sql`SELECT 1 as test`;
    log.success('Database connected');
    
    // Create missing tables with direct SQL (avoiding template parsing issues)
    log.info('Creating missing tables...');
    
    // Enable UUID extension
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
      log.success('UUID extension ready');
    } catch (err) {
      log.warning('UUID extension may already exist');
    }
    
    // Create agent_interactions table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS agent_interactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id UUID,
          interaction_type VARCHAR(100) NOT NULL,
          agent_action VARCHAR(255),
          user_action VARCHAR(255),
          context JSONB DEFAULT '{}',
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          duration_ms INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      log.success('Table agent_interactions ready');
    } catch (err) {
      log.warning(`agent_interactions: ${err.message.includes('already exists') ? 'already exists' : err.message}`);
    }
    
    // Create analytics table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type VARCHAR(100) NOT NULL,
          event_data JSONB DEFAULT '{}',
          agent_id VARCHAR(100),
          session_id UUID,
          user_id VARCHAR(255),
          timestamp_utc TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'
        )
      `;
      log.success('Table analytics ready');
    } catch (err) {
      log.warning(`analytics: ${err.message.includes('already exists') ? 'already exists' : err.message}`);
    }
    
    // Add indexes for performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_agent_interactions_session_id ON agent_interactions(session_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp_utc)`;
      log.success('Performance indexes ready');
    } catch (err) {
      log.warning(`Indexes: ${err.message}`);
    }
    
    // Verify final state
    const tableResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tableNames = tableResult.map(row => row.table_name);
    log.success(`Database setup complete. Tables: ${tableNames.join(', ')}`);
    
    return true;
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    return false;
  }
}

if (require.main === module) {
  setupDatabase()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
      log.error(`Unexpected error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = setupDatabase;