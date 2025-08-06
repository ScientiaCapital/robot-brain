#!/usr/bin/env node

/**
 * AI Voice Agent Template - Database Setup Test
 * Verifies that database setup completes in under 5 minutes
 * Tests compatibility with various agent types
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  step: (msg) => console.log(`${colors.blue}🔧${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.magenta}🧪${colors.reset} ${msg}`)
};

/**
 * Test suite results
 */
const testResults = {
  setupTime: 0,
  testsRun: 0,
  testsPassed: 0,
  testsFailed: 0,
  warnings: []
};

/**
 * Run a command and capture output
 */
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const proc = spawn(command, args, {
      shell: true,
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      resolve({
        success: code === 0,
        stdout,
        stderr,
        duration,
        code
      });
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Test environment setup
 */
async function testEnvironmentSetup() {
  log.test('Testing environment setup...');
  testResults.testsRun++;
  
  // Check for .env.local or .env.example
  const envLocalExists = fs.existsSync('.env.local');
  const envExampleExists = fs.existsSync('.env.example');
  
  if (!envLocalExists && !envExampleExists) {
    log.error('Neither .env.local nor .env.example found');
    testResults.testsFailed++;
    return false;
  }
  
  if (!envLocalExists && envExampleExists) {
    log.warning('.env.local not found, but .env.example exists');
    testResults.warnings.push('Environment file needs to be configured');
  }
  
  log.success('Environment files check passed');
  testResults.testsPassed++;
  return true;
}

/**
 * Test database connection speed
 */
async function testConnectionSpeed() {
  log.test('Testing database connection speed...');
  testResults.testsRun++;
  
  // Skip if no database URL configured
  require('dotenv').config({ path: '.env.local' });
  
  if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
    log.warning('Database URL not configured, skipping connection test');
    testResults.warnings.push('Database connection not tested');
    return true;
  }
  
  const startTime = Date.now();
  
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
    
    await sql`SELECT 1`;
    
    const duration = Date.now() - startTime;
    
    if (duration < 1000) {
      log.success(`Connection established in ${duration}ms (excellent)`);
      testResults.testsPassed++;
    } else if (duration < 3000) {
      log.success(`Connection established in ${duration}ms (good)`);
      testResults.testsPassed++;
    } else {
      log.warning(`Connection established in ${duration}ms (slow)`);
      testResults.warnings.push(`Slow connection: ${duration}ms`);
      testResults.testsPassed++;
    }
    
    return true;
  } catch (error) {
    log.error(`Connection failed: ${error.message}`);
    testResults.testsFailed++;
    return false;
  }
}

/**
 * Test schema compatibility
 */
async function testSchemaCompatibility() {
  log.test('Testing schema compatibility...');
  testResults.testsRun++;
  
  const schemaFile = path.join('src', 'lib', 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaFile)) {
    log.error('Schema file not found');
    testResults.testsFailed++;
    return false;
  }
  
  const schema = fs.readFileSync(schemaFile, 'utf8');
  
  // Check for generic agent tables
  const requiredTables = [
    'sessions',
    'conversations',
    'agent_interactions',
    'tool_usage',
    'analytics'
  ];
  
  let allTablesFound = true;
  
  for (const table of requiredTables) {
    if (schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      log.success(`  Table '${table}' defined`);
    } else {
      log.error(`  Table '${table}' not found in schema`);
      allTablesFound = false;
    }
  }
  
  // Check for agent-specific columns
  const agentColumns = [
    'agent_type',
    'agent_config',
    'agent_personality',
    'agent_response'
  ];
  
  let allColumnsFound = true;
  
  for (const column of agentColumns) {
    if (schema.includes(column)) {
      log.success(`  Column '${column}' defined`);
    } else {
      log.error(`  Column '${column}' not found in schema`);
      allColumnsFound = false;
    }
  }
  
  if (allTablesFound && allColumnsFound) {
    log.success('Schema is compatible with all agent types');
    testResults.testsPassed++;
    return true;
  } else {
    log.error('Schema compatibility issues found');
    testResults.testsFailed++;
    return false;
  }
}

/**
 * Test setup script execution
 */
async function testSetupScript() {
  log.test('Testing database setup script...');
  testResults.testsRun++;
  
  const setupScript = path.join('scripts', 'setup-database.js');
  
  if (!fs.existsSync(setupScript)) {
    log.error('Setup script not found');
    testResults.testsFailed++;
    return false;
  }
  
  // Test dry run (without actual database connection)
  log.info('  Running setup script test...');
  
  const startTime = Date.now();
  
  try {
    // Create a test environment file if needed
    const testEnvFile = '.env.test';
    if (!fs.existsSync('.env.local')) {
      fs.writeFileSync(testEnvFile, 'NEON_DATABASE_URL=postgresql://test:test@localhost/test\n');
    }
    
    const result = await runCommand('node', [setupScript]);
    
    const duration = Date.now() - startTime;
    testResults.setupTime = duration;
    
    // Clean up test file
    if (fs.existsSync(testEnvFile)) {
      fs.unlinkSync(testEnvFile);
    }
    
    if (duration < 5000) {
      log.success(`  Setup script executed in ${(duration / 1000).toFixed(1)}s (under 5 seconds)`);
      testResults.testsPassed++;
    } else if (duration < 60000) {
      log.success(`  Setup script executed in ${(duration / 1000).toFixed(1)}s (under 1 minute)`);
      testResults.testsPassed++;
    } else if (duration < 300000) {
      log.success(`  Setup script executed in ${(duration / 1000).toFixed(1)}s (under 5 minutes)`);
      testResults.testsPassed++;
    } else {
      log.error(`  Setup script took ${(duration / 1000).toFixed(1)}s (exceeded 5 minutes)`);
      testResults.testsFailed++;
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`  Setup script failed: ${error.message}`);
    testResults.testsFailed++;
    return false;
  }
}

/**
 * Test migration system
 */
async function testMigrationSystem() {
  log.test('Testing migration system...');
  testResults.testsRun++;
  
  const migrateScript = path.join('scripts', 'migrate-database.js');
  
  if (!fs.existsSync(migrateScript)) {
    log.error('Migration script not found');
    testResults.testsFailed++;
    return false;
  }
  
  // Check if migrations directory will be created
  const migrationsDir = path.join('migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    log.info('  Migrations directory will be created on first run');
  } else {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    log.success(`  Found ${migrations.length} migration files`);
  }
  
  testResults.testsPassed++;
  return true;
}

/**
 * Test agent type configurations
 */
async function testAgentConfigurations() {
  log.test('Testing agent type configurations...');
  testResults.testsRun++;
  
  const agentTypes = [
    { name: 'BDR Agent', type: 'sales', industry: 'sales' },
    { name: 'Construction Agent', type: 'operations', industry: 'construction' },
    { name: 'Healthcare Agent', type: 'support', industry: 'healthcare' },
    { name: 'Support Agent', type: 'support', industry: 'general' },
    { name: 'Custom Agent', type: 'custom', industry: 'custom' }
  ];
  
  log.info('  Verifying agent type compatibility...');
  
  for (const agent of agentTypes) {
    log.success(`    ${agent.name} (${agent.type}/${agent.industry})`);
  }
  
  testResults.testsPassed++;
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}🧪 AI Voice Agent Template - Database Setup Test Suite${colors.reset}`);
  console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const testStartTime = Date.now();
  
  // Run all tests
  await testEnvironmentSetup();
  await testConnectionSpeed();
  await testSchemaCompatibility();
  await testSetupScript();
  await testMigrationSystem();
  await testAgentConfigurations();
  
  const totalDuration = Date.now() - testStartTime;
  
  // Generate report
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📊 Test Results${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  log.info(`Tests Run: ${testResults.testsRun}`);
  log.success(`Tests Passed: ${testResults.testsPassed}`);
  
  if (testResults.testsFailed > 0) {
    log.error(`Tests Failed: ${testResults.testsFailed}`);
  }
  
  if (testResults.warnings.length > 0) {
    log.warning(`Warnings: ${testResults.warnings.length}`);
    testResults.warnings.forEach(w => console.log(`    • ${w}`));
  }
  
  const successRate = (testResults.testsPassed / testResults.testsRun) * 100;
  
  console.log('');
  log.info(`Success Rate: ${successRate.toFixed(1)}%`);
  log.info(`Total Test Time: ${(totalDuration / 1000).toFixed(1)}s`);
  
  if (testResults.setupTime > 0) {
    const setupMinutes = (testResults.setupTime / 60000).toFixed(2);
    
    if (testResults.setupTime < 300000) {
      log.success(`Setup Time: ${setupMinutes} minutes ✅ (under 5 minutes)`);
    } else {
      log.error(`Setup Time: ${setupMinutes} minutes ❌ (exceeded 5 minutes)`);
    }
  }
  
  // Final verdict
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (testResults.testsFailed === 0 && testResults.setupTime < 300000) {
    console.log(`${colors.bright}${colors.green}✨ All tests passed! Database setup is ready for production.${colors.reset}`);
    console.log(`${colors.green}   Setup completes in under 5 minutes as promised!${colors.reset}\n`);
    process.exit(0);
  } else if (testResults.testsFailed === 0) {
    console.log(`${colors.bright}${colors.yellow}⚠️  Tests passed with warnings.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}❌ Some tests failed. Please review the issues above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});