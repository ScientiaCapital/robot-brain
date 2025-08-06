#!/usr/bin/env node

/**
 * AI Voice Agent Template - Database Migration Tool
 * Handles automatic schema migrations for any agent type
 * Supports rollback and version tracking
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Terminal colors
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

/**
 * Initialize migrations table
 */
async function initMigrationsTable(sql) {
  log.step('Initializing migrations tracking...');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        rollback_sql TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      )
    `;
    
    log.success('Migrations table ready');
    return true;
  } catch (error) {
    log.error(`Failed to create migrations table: ${error.message}`);
    return false;
  }
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(sql) {
  try {
    const result = await sql`
      SELECT version, name, checksum, executed_at, success
      FROM schema_migrations
      WHERE success = true
      ORDER BY version ASC
    `;
    
    return result.map(row => ({
      version: row.version,
      name: row.name,
      checksum: row.checksum,
      executedAt: row.executed_at
    }));
  } catch (error) {
    // Table might not exist yet
    return [];
  }
}

/**
 * Calculate checksum for a migration file
 */
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load migration files
 */
function loadMigrationFiles() {
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    
    // Create initial migration file
    const initialMigration = `-- Initial migration: Generic agent tables
-- This migration transforms robot-specific tables to generic agent tables

-- Rename robot_personality column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'robot_personality'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN robot_personality TO agent_personality;
  END IF;
END $$;

-- Rename robot_response column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'robot_response'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN robot_response TO agent_response;
  END IF;
END $$;

-- Rename robot_interactions table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'robot_interactions'
  ) THEN
    ALTER TABLE robot_interactions RENAME TO agent_interactions;
  END IF;
END $$;

-- Add agent_type column to sessions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN agent_type VARCHAR(100);
  END IF;
END $$;

-- Add agent_config column to sessions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'agent_config'
  ) THEN
    ALTER TABLE sessions ADD COLUMN agent_config JSONB;
  END IF;
END $$;
`;
    
    fs.writeFileSync(
      path.join(MIGRATIONS_DIR, '001_generic_agent_schema.sql'),
      initialMigration
    );
    
    log.info('Created initial migration file');
  }
  
  // Read all migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files.map(filename => {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const version = filename.match(/^(\d+)/)?.[1] || '000';
    const name = filename.replace(/^\d+_/, '').replace('.sql', '');
    
    return {
      filename,
      version: version.padStart(3, '0'),
      name,
      content,
      checksum: calculateChecksum(content)
    };
  });
}

/**
 * Execute a migration
 */
async function executeMigration(sql, migration) {
  log.step(`Running migration: ${migration.version}_${migration.name}`);
  
  const startTime = Date.now();
  let success = false;
  let errorMessage = null;
  
  try {
    // Split migration into statements
    const statements = migration.content
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    // Execute in transaction
    await sql`BEGIN`;
    
    for (const statement of statements) {
      // Skip comments-only statements
      if (statement.replace(/--.*$/gm, '').trim().length === 0) {
        continue;
      }
      
      await sql(statement);
    }
    
    // Record successful migration
    const executionTime = Date.now() - startTime;
    
    await sql`
      INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success)
      VALUES (${migration.version}, ${migration.name}, ${migration.checksum}, ${executionTime}, true)
    `;
    
    await sql`COMMIT`;
    
    log.success(`  Migration completed in ${executionTime}ms`);
    success = true;
    
  } catch (error) {
    // Rollback transaction
    try {
      await sql`ROLLBACK`;
    } catch (rollbackError) {
      log.error(`  Rollback failed: ${rollbackError.message}`);
    }
    
    errorMessage = error.message;
    log.error(`  Migration failed: ${errorMessage}`);
    
    // Record failed migration
    try {
      await sql`
        INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success, error_message)
        VALUES (${migration.version}, ${migration.name}, ${migration.checksum}, ${Date.now() - startTime}, false, ${errorMessage})
      `;
    } catch (recordError) {
      // Ignore recording errors
    }
  }
  
  return { success, errorMessage };
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log(`\n${colors.bright}${colors.cyan}🔄 AI Voice Agent Template - Database Migrations${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // Load environment
  if (!fs.existsSync(ENV_FILE)) {
    log.error('.env.local not found. Run setup-database.js first.');
    process.exit(1);
  }
  
  require('dotenv').config({ path: ENV_FILE });
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    log.error('Database URL not configured');
    process.exit(1);
  }
  
  // Connect to database
  const sql = neon(dbUrl);
  
  // Initialize migrations table
  const tableReady = await initMigrationsTable(sql);
  if (!tableReady) {
    process.exit(1);
  }
  
  // Get executed migrations
  const executed = await getExecutedMigrations(sql);
  const executedVersions = new Set(executed.map(m => m.version));
  
  log.info(`Found ${executed.length} executed migrations`);
  
  // Load migration files
  const migrations = loadMigrationFiles();
  log.info(`Found ${migrations.length} migration files`);
  
  // Find pending migrations
  const pending = migrations.filter(m => !executedVersions.has(m.version));
  
  if (pending.length === 0) {
    log.success('Database is up to date!');
    return;
  }
  
  log.warning(`${pending.length} pending migrations to execute`);
  
  // Execute pending migrations
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of pending) {
    const result = await executeMigration(sql, migration);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      
      // Stop on first failure
      log.error('Migration failed. Stopping execution.');
      break;
    }
  }
  
  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (failCount === 0) {
    log.success(`✨ All migrations completed successfully!`);
    log.info(`  ${successCount} migrations executed`);
  } else {
    log.error(`Migration process failed`);
    log.info(`  ${successCount} succeeded, ${failCount} failed`);
    process.exit(1);
  }
}

/**
 * List all migrations and their status
 */
async function listMigrations() {
  console.log(`\n${colors.bright}${colors.cyan}📋 Migration Status${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // Load environment
  require('dotenv').config({ path: ENV_FILE });
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    log.error('Database URL not configured');
    process.exit(1);
  }
  
  const sql = neon(dbUrl);
  
  // Get executed migrations
  const executed = await getExecutedMigrations(sql);
  const executedMap = new Map(executed.map(m => [m.version, m]));
  
  // Load migration files
  const migrations = loadMigrationFiles();
  
  // Display status
  migrations.forEach(migration => {
    const exec = executedMap.get(migration.version);
    
    if (exec) {
      const date = new Date(exec.executedAt).toLocaleString();
      log.success(`${migration.version}_${migration.name} - Executed on ${date}`);
    } else {
      log.warning(`${migration.version}_${migration.name} - Pending`);
    }
  });
  
  console.log(`\n${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Total: ${migrations.length}`);
  console.log(`  Executed: ${executed.length}`);
  console.log(`  Pending: ${migrations.length - executed.length}`);
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'list') {
  listMigrations().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
} else if (command === 'run' || !command) {
  runMigrations().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
} else {
  console.log('Usage: node migrate-database.js [run|list]');
  console.log('  run  - Execute pending migrations (default)');
  console.log('  list - Show migration status');
  process.exit(1);
}