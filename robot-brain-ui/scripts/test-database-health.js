#!/usr/bin/env node

/**
 * Database Health Test Runner
 * Executes comprehensive database health checks
 */

const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function fetchHealthCheck(endpoint, type = 'basic') {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/health/database?type=${type}`;
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function testDatabaseConnection() {
  logSection('Database Connection Test');
  
  try {
    const result = await fetchHealthCheck('database', 'basic');
    
    if (result.connection?.isConnected) {
      log(`✅ Database connected successfully`, 'green');
      log(`   Host: ${result.connection.host}`, 'green');
      log(`   Database: ${result.connection.database}`, 'green');
      log(`   Response time: ${result.connection.responseTime}ms`, 'green');
      testResults.passed++;
      
      if (result.connection.responseTime > 1000) {
        log(`⚠️  Warning: Connection time exceeds 1000ms`, 'yellow');
        testResults.warnings++;
      }
    } else {
      log(`❌ Database connection failed`, 'red');
      log(`   Error: ${result.connection?.error || 'Unknown error'}`, 'red');
      testResults.failed++;
    }
    
    if (result.pool) {
      log(`\n📊 Connection Pool Status:`, 'blue');
      log(`   Total: ${result.pool.total}`, 'blue');
      log(`   Active: ${result.pool.active}`, 'blue');
      log(`   Idle: ${result.pool.idle}`, 'blue');
      
      const utilization = (result.pool.active / result.pool.total) * 100;
      if (utilization > 80) {
        log(`⚠️  Warning: Pool utilization at ${utilization.toFixed(1)}%`, 'yellow');
        testResults.warnings++;
      }
    }
    
    return result;
  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, 'red');
    testResults.failed++;
    return null;
  }
}

async function testSchemaValidation() {
  logSection('Schema Validation Test');
  
  try {
    const result = await fetchHealthCheck('database', 'schema');
    
    const tables = ['conversations', 'sessions', 'embeddings', 'robot_interactions', 'tool_usage'];
    
    for (const table of tables) {
      if (result.schemas?.[table]?.exists) {
        log(`✅ Table '${table}' exists with ${result.schemas[table].columns.length} columns`, 'green');
        testResults.passed++;
      } else {
        log(`❌ Table '${table}' not found or invalid`, 'red');
        testResults.failed++;
      }
    }
    
    // Check indexes
    if (result.indexes) {
      log(`\n📋 Index Validation:`, 'blue');
      for (const [table, indexes] of Object.entries(result.indexes)) {
        if (indexes.length > 0) {
          log(`   ${table}: ${indexes.length} indexes`, 'green');
          testResults.passed++;
        } else {
          log(`   ${table}: No indexes found`, 'yellow');
          testResults.warnings++;
        }
      }
    }
    
    // Check relationships
    if (result.relationships?.valid) {
      log(`✅ Foreign key relationships valid`, 'green');
      testResults.passed++;
    } else {
      log(`⚠️  Foreign key relationship issues detected`, 'yellow');
      testResults.warnings++;
    }
    
    return result;
  } catch (error) {
    log(`❌ Schema validation failed: ${error.message}`, 'red');
    testResults.failed++;
    return null;
  }
}

async function testDataIntegrity() {
  logSection('Data Integrity Test');
  
  try {
    const result = await fetchHealthCheck('database', 'integrity');
    
    // Check conversation integrity
    if (result.integrity?.conversations) {
      const conv = result.integrity.conversations;
      
      if (conv.nullViolations === 0) {
        log(`✅ No null violations in conversations`, 'green');
        testResults.passed++;
      } else {
        log(`❌ ${conv.nullViolations} null violations found`, 'red');
        testResults.failed++;
      }
      
      if (conv.constraintViolations === 0) {
        log(`✅ No constraint violations`, 'green');
        testResults.passed++;
      } else {
        log(`❌ ${conv.constraintViolations} constraint violations found`, 'red');
        testResults.failed++;
      }
      
      if (conv.orphanedRecords === 0) {
        log(`✅ No orphaned records`, 'green');
        testResults.passed++;
      } else {
        log(`⚠️  ${conv.orphanedRecords} orphaned records found`, 'yellow');
        testResults.warnings++;
      }
    }
    
    // Check session expiry
    if (result.integrity?.sessions) {
      const sess = result.integrity.sessions;
      
      if (sess.count > 0) {
        log(`⚠️  ${sess.count} expired sessions need cleanup`, 'yellow');
        testResults.warnings++;
      } else {
        log(`✅ No expired sessions`, 'green');
        testResults.passed++;
      }
    }
    
    // Check JSONB validation
    if (result.integrity?.jsonb) {
      const jsonb = result.integrity.jsonb;
      
      if (jsonb.conversations.invalidCount === 0 && jsonb.sessions.invalidCount === 0) {
        log(`✅ All JSONB data valid`, 'green');
        testResults.passed++;
      } else {
        log(`❌ Invalid JSONB data detected`, 'red');
        testResults.failed++;
      }
    }
    
    return result;
  } catch (error) {
    log(`❌ Data integrity test failed: ${error.message}`, 'red');
    testResults.failed++;
    return null;
  }
}

async function testPerformance() {
  logSection('Performance Test');
  
  try {
    const result = await fetchHealthCheck('database', 'performance');
    
    if (result.metrics) {
      log(`📊 Performance Metrics:`, 'blue');
      log(`   Active connections: ${result.metrics.activeConnections}`, 'blue');
      log(`   Query count: ${result.metrics.queryCount}`, 'blue');
      log(`   Average query time: ${result.metrics.averageQueryTime?.toFixed(2)}ms`, 'blue');
      log(`   Slow queries: ${result.metrics.slowQueries}`, 'blue');
      
      if (result.metrics.averageQueryTime < 100) {
        log(`✅ Excellent query performance`, 'green');
        testResults.passed++;
      } else if (result.metrics.averageQueryTime < 500) {
        log(`⚠️  Query performance could be improved`, 'yellow');
        testResults.warnings++;
      } else {
        log(`❌ Poor query performance`, 'red');
        testResults.failed++;
      }
    }
    
    if (result.report?.recommendations && result.report.recommendations.length > 0) {
      log(`\n📋 Recommendations:`, 'yellow');
      result.report.recommendations.forEach(rec => {
        log(`   • ${rec}`, 'yellow');
      });
    }
    
    if (result.report?.bottlenecks && result.report.bottlenecks.length > 0) {
      log(`\n⚠️  Bottlenecks Detected:`, 'yellow');
      result.report.bottlenecks.forEach(bottleneck => {
        log(`   • ${bottleneck.description} (${bottleneck.impact})`, 'yellow');
      });
    }
    
    return result;
  } catch (error) {
    log(`❌ Performance test failed: ${error.message}`, 'red');
    testResults.failed++;
    return null;
  }
}

async function testTransactions() {
  logSection('Transaction Management Test');
  
  try {
    const result = await fetchHealthCheck('database', 'transaction');
    
    if (result.transactions) {
      const tx = result.transactions;
      
      // Isolation level
      if (tx.isolation?.isolationLevel === 'READ COMMITTED') {
        log(`✅ Correct isolation level: ${tx.isolation.isolationLevel}`, 'green');
        testResults.passed++;
      } else {
        log(`⚠️  Unexpected isolation level: ${tx.isolation?.isolationLevel}`, 'yellow');
        testResults.warnings++;
      }
      
      // Rollback capability
      if (tx.rollback?.rollbackSuccessful && tx.rollback?.dataConsistent) {
        log(`✅ Transaction rollback working correctly`, 'green');
        testResults.passed++;
      } else {
        log(`❌ Transaction rollback issues detected`, 'red');
        testResults.failed++;
      }
      
      // Concurrent transactions
      if (tx.concurrent) {
        const successRate = (tx.concurrent.successCount / 5) * 100;
        log(`📊 Concurrent transactions: ${successRate}% success rate`, 'blue');
        
        if (successRate === 100) {
          log(`✅ All concurrent transactions successful`, 'green');
          testResults.passed++;
        } else if (successRate >= 80) {
          log(`⚠️  Some concurrent transaction failures`, 'yellow');
          testResults.warnings++;
        } else {
          log(`❌ High concurrent transaction failure rate`, 'red');
          testResults.failed++;
        }
        
        if (tx.concurrent.deadlockCount > 0) {
          log(`⚠️  ${tx.concurrent.deadlockCount} deadlocks detected`, 'yellow');
          testResults.warnings++;
        }
      }
    }
    
    return result;
  } catch (error) {
    log(`❌ Transaction test failed: ${error.message}`, 'red');
    testResults.failed++;
    return null;
  }
}

async function generateReport() {
  logSection('Test Summary Report');
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? (testResults.passed / total) * 100 : 0;
  
  log(`\n📊 Test Results:`, 'bold');
  log(`   ✅ Passed: ${testResults.passed}`, 'green');
  log(`   ❌ Failed: ${testResults.failed}`, 'red');
  log(`   ⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log(`   Success Rate: ${successRate.toFixed(1)}%`, successRate >= 80 ? 'green' : 'red');
  
  // Calculate health score
  let healthScore = 100;
  healthScore -= testResults.failed * 10;
  healthScore -= testResults.warnings * 2;
  healthScore = Math.max(0, healthScore);
  
  log(`\n🏥 Database Health Score: ${healthScore}/100`, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red');
  
  // Overall status
  if (healthScore >= 80) {
    log(`\n✅ Database is healthy and ready for production!`, 'green');
  } else if (healthScore >= 60) {
    log(`\n⚠️  Database has some issues that should be addressed`, 'yellow');
  } else {
    log(`\n❌ Database has critical issues that must be resolved`, 'red');
  }
  
  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    healthScore,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'
  };
  
  require('fs').writeFileSync(
    'database-health-report.json',
    JSON.stringify(report, null, 2)
  );
  
  log(`\n📄 Detailed report saved to database-health-report.json`, 'blue');
}

async function runAllTests() {
  log(`${'='.repeat(60)}`, 'magenta');
  log(`  DATABASE HEALTH VERIFICATION TEST SUITE`, 'magenta');
  log(`  Component 2: Production Health Verification`, 'magenta');
  log(`  Timestamp: ${new Date().toISOString()}`, 'magenta');
  log(`${'='.repeat(60)}`, 'magenta');
  
  // Check if running locally or in CI
  const isLocal = !process.env.CI && !process.env.VERCEL;
  if (isLocal) {
    log(`\n🏠 Running in local environment`, 'blue');
  } else {
    log(`\n☁️  Running in CI/production environment`, 'blue');
  }
  
  // Run all tests
  await testDatabaseConnection();
  await testSchemaValidation();
  await testDataIntegrity();
  await testPerformance();
  await testTransactions();
  
  // Generate final report
  await generateReport();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error}`, 'red');
  process.exit(1);
});

// Run tests
runAllTests();