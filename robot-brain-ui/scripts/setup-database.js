#!/usr/bin/env node

/**
 * Database Setup Script
 * Validates database connection and ensures proper setup
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');

async function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');
  
  if (!fs.existsSync(ENV_FILE)) {
    console.log('❌ .env.local not found');
    
    if (fs.existsSync(ENV_EXAMPLE)) {
      console.log('📋 Copy .env.example to .env.local and configure your database URL');
      console.log('💡 Run: cp .env.example .env.local');
    }
    return false;
  }
  
  // Load environment variables
  require('dotenv').config({ path: ENV_FILE });
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ Database URL not configured in .env.local');
    return false;
  }
  
  console.log('✅ Environment file exists');
  return true;
}

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT current_database(), version()`;
    
    console.log(`✅ Connected to database: ${result[0].current_database}`);
    console.log(`📊 PostgreSQL version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function validateSchema() {
  console.log('📋 Validating database schema...');
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const sql = neon(dbUrl);
  
  const requiredTables = ['conversations', 'sessions', 'embeddings', 'robot_interactions', 'tool_usage'];
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
        console.log(`  ✅ ${table} table exists`);
      } else {
        console.log(`  ❌ ${table} table missing`);
        missingTables.push(table);
      }
    } catch (error) {
      console.log(`  ❌ ${table} table check failed: ${error.message}`);
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    console.log('💡 You may need to run database migrations');
    return false;
  }
  
  return true;
}

async function getTableCounts() {
  console.log('📊 Checking table data...');
  
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const sql = neon(dbUrl);
  
  try {
    const conversations = await sql`SELECT COUNT(*) as count FROM conversations`;
    const sessions = await sql`SELECT COUNT(*) as count FROM sessions`;
    
    console.log(`  📝 Conversations: ${conversations[0].count}`);
    console.log(`  🔐 Sessions: ${sessions[0].count}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Failed to get table counts: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Robot Brain Database Setup\n');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    process.exit(1);
  }
  
  // Test connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    process.exit(1);
  }
  
  // Validate schema
  const schemaOk = await validateSchema();
  if (!schemaOk) {
    console.log('\n⚠️  Schema validation failed, but connection works');
    console.log('💡 This might be expected if you\'re setting up for the first time');
  }
  
  // Get data counts
  if (schemaOk) {
    await getTableCounts();
  }
  
  console.log('\n🎉 Database setup validation complete!');
  console.log('\n💡 Next steps:');
  console.log('  - Run tests: npm test');
  console.log('  - Start development: npm run dev');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('  - Add ANTHROPIC_API_KEY to .env.local for AI features');
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('  - Add ELEVENLABS_API_KEY to .env.local for voice features');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}