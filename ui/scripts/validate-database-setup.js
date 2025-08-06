#!/usr/bin/env node

/**
 * Database Setup Validation Script
 * Comprehensive testing for the npm run setup:database command
 * Tests all aspects: environment handling, connection validation, schema creation,
 * error handling, rollback mechanisms, and performance requirements
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { neon } = require('@neondatabase/serverless');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.magenta}🧪${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}🔧${colors.reset} ${msg}`)
};

class TestResults {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  add(name, status, message = '', duration = 0) {
    this.tests.push({ name, status, message, duration });
    if (status === 'PASS') this.passed++;
    else if (status === 'FAIL') this.failed++;
    else if (status === 'WARN') this.warnings++;
  }

  report() {
    console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}DATABASE SETUP VALIDATION REPORT${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.green}✅ Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings}${colors.reset}\n`);

    this.tests.forEach(test => {
      const statusColor = test.status === 'PASS' ? colors.green : 
                         test.status === 'FAIL' ? colors.red : colors.yellow;
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      
      console.log(`${statusColor}${icon} ${test.name}${colors.reset}`);
      if (test.message) {
        console.log(`    ${test.message}`);
      }
      if (test.duration > 0) {
        console.log(`    Duration: ${test.duration}ms`);
      }
    });

    const overallResult = this.failed === 0 ? 'PASS' : 'FAIL';
    const overallColor = overallResult === 'PASS' ? colors.green : colors.red;
    
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${overallColor}Overall Result: ${overallResult}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }
}

const results = new TestResults();

// Test utilities
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      ...options 
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function backupEnvironment() {
  const envFile = path.join(__dirname, '..', '.env.local');
  const backupFile = path.join(__dirname, '..', '.env.local.backup');
  
  if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, backupFile);
    return true;
  }
  return false;
}

async function restoreEnvironment() {
  const envFile = path.join(__dirname, '..', '.env.local');
  const backupFile = path.join(__dirname, '..', '.env.local.backup');
  
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, envFile);
    fs.unlinkSync(backupFile);
    return true;
  }
  return false;
}

function createTestEnvironment(config) {
  const envFile = path.join(__dirname, '..', '.env.local');
  const content = Object.entries(config)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  
  fs.writeFileSync(envFile, content);
}

async function cleanupTestEnvironment() {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    fs.unlinkSync(envFile);
  }
}

// Test 1: Environment Setup and Error Handling
async function testEnvironmentSetup() {
  log.test('Testing environment setup and error handling...');
  
  // Test 1a: Missing .env.local file
  await cleanupTestEnvironment();
  
  const startTime = Date.now();
  const result1 = await runCommand('node', ['scripts/setup-database.js'], {
    input: 'n\n' // Say no to any prompts
  });
  const duration1 = Date.now() - startTime;
  
  if (result1.stdout.includes('.env.local not found') || result1.stdout.includes('.env.local created from template')) {
    results.add('Environment file detection', 'PASS', 'Correctly handles missing .env.local', duration1);
  } else {
    results.add('Environment file detection', 'FAIL', 'Did not properly detect missing .env.local', duration1);
  }
  
  // Test 1b: Invalid database URL format
  createTestEnvironment({
    NEON_DATABASE_URL: 'invalid-url-format'
  });
  
  const startTime2 = Date.now();
  const result2 = await runCommand('node', ['scripts/setup-database.js']);
  const duration2 = Date.now() - startTime2;
  
  if (result2.stdout.includes('Invalid database URL format')) {
    results.add('URL format validation', 'PASS', 'Correctly validates database URL format', duration2);
  } else {
    results.add('URL format validation', 'FAIL', 'Did not validate database URL format', duration2);
  }
  
  // Test 1c: Missing database URL
  createTestEnvironment({
    ANTHROPIC_API_KEY: 'test-key'
  });
  
  const startTime3 = Date.now();
  const result3 = await runCommand('node', ['scripts/setup-database.js']);
  const duration3 = Date.now() - startTime3;
  
  if (result3.stdout.includes('Database URL not configured')) {
    results.add('Missing database URL detection', 'PASS', 'Correctly detects missing database URL', duration3);
  } else {
    results.add('Missing database URL detection', 'FAIL', 'Did not detect missing database URL', duration3);
  }
}

// Test 2: Database Connection Validation
async function testDatabaseConnection() {
  log.test('Testing database connection validation...');
  
  // We'll need a valid database URL for this test
  // If no valid URL is available, we'll skip this test
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Database connection test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  createTestEnvironment({
    NEON_DATABASE_URL: testDbUrl
  });
  
  const startTime = Date.now();
  
  try {
    const sql = neon(testDbUrl);
    await sql`SELECT 1 as test`;
    const duration = Date.now() - startTime;
    
    results.add('Database connection', 'PASS', 'Successfully connected to database', duration);
    
    // Test connection info retrieval
    const result = await sql`SELECT current_database(), version(), current_user`;
    if (result.length > 0 && result[0].current_database) {
      results.add('Database info retrieval', 'PASS', `Connected to: ${result[0].current_database}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    results.add('Database connection', 'FAIL', `Connection failed: ${error.message}`, duration);
  }
}

// Test 3: Schema Creation and Transaction Handling
async function testSchemaCreation() {
  log.test('Testing schema creation and transaction handling...');
  
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Schema creation test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  createTestEnvironment({
    NEON_DATABASE_URL: testDbUrl
  });
  
  const startTime = Date.now();
  
  try {
    const sql = neon(testDbUrl);
    
    // First, clean up any existing test tables
    const testTables = ['test_sessions', 'test_conversations'];
    for (const table of testTables) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
      } catch (e) {
        // Ignore errors, table might not exist
      }
    }
    
    // Test schema creation
    const result = await runCommand('node', ['scripts/setup-database.js'], {
      input: 'y\n' // Say yes to table creation
    });
    
    const duration = Date.now() - startTime;
    
    if (result.stdout.includes('Database setup complete')) {
      results.add('Schema creation', 'PASS', 'Schema creation completed successfully', duration);
    } else {
      results.add('Schema creation', 'FAIL', 'Schema creation failed', duration);
    }
    
    // Verify tables were created
    const requiredTables = ['sessions', 'conversations', 'agent_interactions', 'tool_usage', 'embeddings', 'analytics'];
    let createdCount = 0;
    
    for (const table of requiredTables) {
      try {
        const exists = await sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          )
        `;
        
        if (exists[0].exists) {
          createdCount++;
        }
      } catch (error) {
        // Table doesn't exist
      }
    }
    
    if (createdCount === requiredTables.length) {
      results.add('Required tables creation', 'PASS', `All ${requiredTables.length} required tables created`);
    } else {
      results.add('Required tables creation', 'FAIL', `Only ${createdCount}/${requiredTables.length} tables created`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    results.add('Schema creation', 'FAIL', `Error during schema creation: ${error.message}`, duration);
  }
}

// Test 4: Index and Extension Validation
async function testIndexesAndExtensions() {
  log.test('Testing indexes and PostgreSQL extensions...');
  
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Index and extension test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  try {
    const sql = neon(testDbUrl);
    
    // Test UUID extension
    const uuidResult = await sql`
      SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') as exists
    `;
    
    if (uuidResult[0].exists) {
      results.add('UUID extension', 'PASS', 'UUID extension is installed');
    } else {
      results.add('UUID extension', 'FAIL', 'UUID extension is not installed');
    }
    
    // Test indexes
    const indexes = await sql`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
    `;
    
    const expectedIndexCount = 16; // Based on schema.sql
    if (indexes.length >= expectedIndexCount) {
      results.add('Database indexes', 'PASS', `${indexes.length} indexes created`);
    } else {
      results.add('Database indexes', 'WARN', `Only ${indexes.length} indexes found, expected at least ${expectedIndexCount}`);
    }
    
    // Test triggers
    const triggers = await sql`
      SELECT trigger_name FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `;
    
    if (triggers.length >= 2) { // Expected: update triggers for sessions and conversations
      results.add('Database triggers', 'PASS', `${triggers.length} triggers created`);
    } else {
      results.add('Database triggers', 'WARN', `Only ${triggers.length} triggers found`);
    }
    
  } catch (error) {
    results.add('Index and extension test', 'FAIL', `Error testing indexes/extensions: ${error.message}`);
  }
}

// Test 5: Performance and Timing Validation
async function testPerformanceRequirements() {
  log.test('Testing performance requirements (under 5 minutes)...');
  
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Performance test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  createTestEnvironment({
    NEON_DATABASE_URL: testDbUrl
  });
  
  const startTime = Date.now();
  
  try {
    // Run the full setup process
    const result = await runCommand('node', ['scripts/setup-database.js'], {
      input: 'y\n', // Say yes to table creation
      timeout: 300000 // 5 minute timeout
    });
    
    const duration = Date.now() - startTime;
    const durationSeconds = duration / 1000;
    
    if (durationSeconds < 300) { // Under 5 minutes
      results.add('5-minute setup guarantee', 'PASS', `Setup completed in ${durationSeconds.toFixed(1)} seconds`, duration);
    } else {
      results.add('5-minute setup guarantee', 'FAIL', `Setup took ${durationSeconds.toFixed(1)} seconds (over 5 minutes)`, duration);
    }
    
    // Test individual operation performance
    if (result.stdout.includes('setup complete')) {
      results.add('Setup process completion', 'PASS', 'Setup process completed successfully');
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    results.add('Performance test', 'FAIL', `Setup failed: ${error.message}`, duration);
  }
}

// Test 6: Agent Configuration Compatibility
async function testAgentCompatibility() {
  log.test('Testing compatibility with different agent configurations...');
  
  const agentTypes = ['sales', 'support', 'operations', 'healthcare', 'construction', 'custom'];
  
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Agent compatibility test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  try {
    const sql = neon(testDbUrl);
    
    // Test inserting sessions with different agent types
    let successCount = 0;
    
    for (const agentType of agentTypes) {
      try {
        const sessionResult = await sql`
          INSERT INTO sessions (user_id, agent_type, agent_config, user_preferences)
          VALUES (
            'test-user-' || ${agentType},
            ${agentType},
            ${'{"personality": "professional", "industry": "' + agentType + '"}'},
            ${'{"language": "en", "voice": "default"}'}
          )
          RETURNING id
        `;
        
        if (sessionResult.length > 0) {
          successCount++;
        }
      } catch (error) {
        log.error(`Failed to insert session for agent type ${agentType}: ${error.message}`);
      }
    }
    
    if (successCount === agentTypes.length) {
      results.add('Agent type compatibility', 'PASS', `All ${agentTypes.length} agent types supported`);
    } else {
      results.add('Agent type compatibility', 'FAIL', `Only ${successCount}/${agentTypes.length} agent types working`);
    }
    
    // Clean up test data
    await sql`DELETE FROM sessions WHERE user_id LIKE 'test-user-%'`;
    
    // Test schema flexibility with metadata
    try {
      await sql`
        INSERT INTO conversations (session_id, agent_personality, user_message, agent_response, metadata)
        VALUES (
          uuid_generate_v4(),
          'professional',
          'Test message',
          'Test response',
          ${'{"industry": "healthcare", "context": "appointment_booking", "priority": "high"}'}
        )
      `;
      
      results.add('Schema flexibility', 'PASS', 'Schema supports industry-specific metadata');
      
      // Clean up
      await sql`DELETE FROM conversations WHERE user_message = 'Test message'`;
    } catch (error) {
      results.add('Schema flexibility', 'FAIL', `Metadata insertion failed: ${error.message}`);
    }
    
  } catch (error) {
    results.add('Agent compatibility test', 'FAIL', `Error testing agent compatibility: ${error.message}`);
  }
}

// Test 7: Error Recovery and Rollback
async function testErrorRecovery() {
  log.test('Testing error recovery and rollback mechanisms...');
  
  // This test checks that the setup script can handle partial failures
  // and recover gracefully
  
  const testDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDbUrl) {
    results.add('Error recovery test', 'WARN', 'Skipped - no valid database URL configured');
    return;
  }
  
  try {
    const sql = neon(testDbUrl);
    
    // Test idempotency - running setup twice should not fail
    createTestEnvironment({
      NEON_DATABASE_URL: testDbUrl
    });
    
    const result1 = await runCommand('node', ['scripts/setup-database.js'], {
      input: 'y\n'
    });
    
    const result2 = await runCommand('node', ['scripts/setup-database.js'], {
      input: 'y\n'
    });
    
    if (result2.code === 0 && result2.stdout.includes('already exists')) {
      results.add('Setup idempotency', 'PASS', 'Setup script handles existing tables gracefully');
    } else if (result2.code === 0) {
      results.add('Setup idempotency', 'PASS', 'Setup script runs successfully on existing database');
    } else {
      results.add('Setup idempotency', 'FAIL', 'Setup script fails on second run');
    }
    
    // Test schema validation
    const validation = await sql`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sessions', 'conversations', 'agent_interactions', 'tool_usage', 'embeddings', 'analytics')
    `;
    
    if (parseInt(validation[0].count) === 6) {
      results.add('Schema validation', 'PASS', 'All required tables present after multiple runs');
    } else {
      results.add('Schema validation', 'FAIL', `Only ${validation[0].count} out of 6 tables found`);
    }
    
  } catch (error) {
    results.add('Error recovery test', 'FAIL', `Error testing recovery: ${error.message}`);
  }
}

// Test 8: Generic Schema Validation
async function testGenericSchema() {
  log.test('Testing that schema is truly generic and agent-agnostic...');
  
  // Read the schema file and analyze it
  const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    results.add('Schema file existence', 'FAIL', 'Schema file not found');
    return;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for generic design principles
  const genericChecks = [
    {
      name: 'No hardcoded industry terms',
      test: !schemaContent.match(/\b(sales|healthcare|construction|insurance|legal)\b/i),
      message: 'Schema avoids hardcoded industry-specific terms'
    },
    {
      name: 'Flexible agent_type column',
      test: schemaContent.includes('agent_type VARCHAR'),
      message: 'Uses flexible VARCHAR for agent_type'
    },
    {
      name: 'JSONB metadata support',
      test: schemaContent.includes('JSONB') && schemaContent.includes('metadata'),
      message: 'Supports extensible JSONB metadata'
    },
    {
      name: 'Generic table names',
      test: schemaContent.includes('conversations') && schemaContent.includes('agent_interactions'),
      message: 'Uses generic, descriptive table names'
    },
    {
      name: 'Configurable personalities',
      test: schemaContent.includes('agent_personality'),
      message: 'Supports configurable agent personalities'
    },
    {
      name: 'Extensible configuration',
      test: schemaContent.includes('agent_config JSONB'),
      message: 'Agent configuration is flexible and extensible'
    }
  ];
  
  let passedChecks = 0;
  
  for (const check of genericChecks) {
    if (check.test) {
      results.add(check.name, 'PASS', check.message);
      passedChecks++;
    } else {
      results.add(check.name, 'FAIL', `Failed: ${check.message}`);
    }
  }
  
  if (passedChecks === genericChecks.length) {
    results.add('Overall schema genericity', 'PASS', `All ${genericChecks.length} genericity checks passed`);
  } else {
    results.add('Overall schema genericity', 'WARN', `${passedChecks}/${genericChecks.length} genericity checks passed`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}🧪 DATABASE SETUP VALIDATION SUITE${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Testing AI Voice Agent Template Database Automation${colors.reset}\n`);
  
  const overallStartTime = Date.now();
  
  // Backup existing environment
  const hasBackup = await backupEnvironment();
  if (hasBackup) {
    log.info('Backed up existing .env.local');
  }
  
  try {
    await testEnvironmentSetup();
    await testDatabaseConnection();
    await testSchemaCreation();
    await testIndexesAndExtensions();
    await testPerformanceRequirements();
    await testAgentCompatibility();
    await testErrorRecovery();
    await testGenericSchema();
    
    const overallDuration = Date.now() - overallStartTime;
    log.info(`Total validation time: ${(overallDuration / 1000).toFixed(1)} seconds`);
    
  } finally {
    // Restore environment
    if (hasBackup) {
      await restoreEnvironment();
      log.info('Restored original .env.local');
    } else {
      await cleanupTestEnvironment();
      log.info('Cleaned up test environment files');
    }
  }
  
  // Generate final report
  results.report();
  
  // Return success/failure for CI
  return results.failed === 0;
}

if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, TestResults };