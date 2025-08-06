#!/usr/bin/env node

/**
 * Quick Database Test
 * Simple validation script for template users to verify their database setup
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`)
};

async function quickTest() {
  console.log(`\n${colors.bright}${colors.cyan}🧪 Quick Database Test${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // Load environment
  const envFile = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envFile)) {
    log.error('.env.local not found');
    log.info('Run: cp .env.example .env.local');
    log.info('Then add your NEON_DATABASE_URL');
    process.exit(1);
  }
  
  require('dotenv').config({ path: envFile });
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log.error('NEON_DATABASE_URL not configured in .env.local');
    log.info('Get your database URL from: https://console.neon.tech/');
    process.exit(1);
  }
  
  try {
    const sql = neon(dbUrl);
    
    // Test connection
    await sql`SELECT 1 as test`;
    log.success('Database connection successful');
    
    // Check tables
    const requiredTables = ['sessions', 'conversations', 'agent_interactions', 'tool_usage', 'embeddings', 'analytics'];
    let foundTables = 0;
    
    for (const table of requiredTables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${table}
        )
      `;
      
      if (result[0].exists) {
        foundTables++;
      } else {
        log.warning(`Table '${table}' not found`);
      }
    }
    
    if (foundTables === requiredTables.length) {
      log.success(`All ${requiredTables.length} required tables found`);
    } else {
      log.warning(`Found ${foundTables}/${requiredTables.length} tables`);
      log.info('Run: npm run setup:database');
    }
    
    // Test UUID extension
    try {
      await sql`SELECT uuid_generate_v4() as test_uuid`;
      log.success('UUID extension working');
    } catch (error) {
      log.warning('UUID extension not available');
    }
    
    // Test data insertion
    try {
      const sessionResult = await sql`
        INSERT INTO sessions (user_id, agent_type, agent_config)
        VALUES ('quick-test', 'assistant', '{"test": true}')
        RETURNING id
      `;
      
      const sessionId = sessionResult[0].id;
      
      await sql`
        INSERT INTO conversations (session_id, agent_personality, user_message, agent_response, metadata)
        VALUES (
          ${sessionId},
          'test',
          'Test message',
          'Test response',
          '{"test": true}'
        )
      `;
      
      // Clean up
      await sql`DELETE FROM conversations WHERE session_id = ${sessionId}`;
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
      
      log.success('Data insertion test passed');
      
    } catch (error) {
      log.error(`Data insertion failed: ${error.message}`);
      log.info('Your database schema may need to be created or updated');
    }
    
    console.log(`\n${colors.green}🎉 Database is ready for your AI agent!${colors.reset}`);
    
  } catch (error) {
    log.error(`Database test failed: ${error.message}`);
    log.info('Check your NEON_DATABASE_URL and ensure the database is accessible');
    process.exit(1);
  }
}

if (require.main === module) {
  quickTest();
}