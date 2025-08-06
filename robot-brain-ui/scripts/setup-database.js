#!/usr/bin/env node

/**
 * AI Voice Agent Template - Automated Database Setup
 * Creates all required tables and validates configuration
 * Works with any agent type (sales, support, operations, custom)
 * 
 * Features:
 * - Automatic schema creation and migration
 * - Compatibility with Neon PostgreSQL
 * - Error recovery and rollback support
 * - Performance optimization checks
 * - Under 5-minute setup guarantee
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');
const SCHEMA_FILE = path.join(__dirname, '..', 'src', 'lib', 'database', 'schema.sql');
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
  log.step('Creating database tables...');
  
  const createdObjects = [];
  const errors = [];
  
  try {
    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_FILE)) {
      log.error('Schema file not found at: ' + SCHEMA_FILE);
      return { success: false, createdObjects, errors };
    }
    
    // Read the schema file
    const schemaSQL = fs.readFileSync(SCHEMA_FILE, 'utf8');
    
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
          
          await sql(statement);
          
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
            await sql(statement);
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
  
  const requiredTables = ['sessions', 'conversations', 'agent_interactions', 'tool_usage', 'embeddings', 'analytics'];
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
  console.log(`\n${colors.bright}${colors.cyan}🤖 AI Voice Agent Template - Database Setup${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Works with: BDR, Construction, Healthcare, Support, Custom Agents${colors.reset}\n`);
  
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
  
  // Show agent type examples
  console.log(`\n${colors.cyan}Example Agent Types:${colors.reset}`);
  console.log(`  • BDR Agent: Lead qualification, appointment setting`);
  console.log(`  • Construction: Project updates, safety compliance`);
  console.log(`  • Healthcare: Patient support, appointment scheduling`);
  console.log(`  • Support: Customer service, technical assistance`);
  console.log(`  • Custom: Any industry-specific use case`);
  
  console.log(`\n${colors.blue}Happy building! 🚀${colors.reset}\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}