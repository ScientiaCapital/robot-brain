#!/usr/bin/env node

/**
 * Agent Verification CLI - Agent Guardrails System
 * Command-line tool for verifying agent deliverables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AgentHandoffValidator = require('./agent-handoff-validator');
const ExecutionTracker = require('./execution-tracker');

class AgentVerificationCLI {
  constructor() {
    this.validator = new AgentHandoffValidator();
    this.tracker = ExecutionTracker.getInstance();
    this.guardrailsDir = path.join(process.cwd(), '.claude', 'guardrails');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      check: '🔍',
      action: '🚀'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Verify a specific agent session
   */
  async verifyAgent(agentType, sessionId, options = {}) {
    this.log(`Starting verification for ${agentType} session: ${sessionId}`, 'action');
    
    try {
      // Load checkpoint and session data
      const checkpoint = this.loadCheckpoint(sessionId);
      const executionReport = this.loadExecutionReport(sessionId);
      
      if (!checkpoint) {
        this.log(`No checkpoint found for session ${sessionId}`, 'error');
        return false;
      }
      
      // Run comprehensive verification
      const results = {
        checkpointValidation: null,
        executionProof: executionReport,
        functionalTests: null,
        buildValidation: null,
        overallScore: 0,
        passed: false
      };
      
      // 1. Checkpoint validation
      if (options.skipCheckpoint !== true) {
        this.log('Running checkpoint validation...', 'check');
        results.checkpointValidation = await this.runCheckpointValidation(sessionId, checkpoint);
      }
      
      // 2. Functional tests
      if (options.skipTests !== true) {
        this.log('Running functional tests...', 'check');
        results.functionalTests = await this.runFunctionalTests();
      }
      
      // 3. Build validation
      if (options.skipBuild !== true) {
        this.log('Running build validation...', 'check');
        results.buildValidation = await this.runBuildValidation();
      }
      
      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results);
      results.passed = results.overallScore >= 80;
      
      // Generate verification report
      this.generateVerificationReport(agentType, sessionId, results);
      
      this.log(`Verification ${results.passed ? 'PASSED' : 'FAILED'} (Score: ${results.overallScore.toFixed(1)}%)`, 
               results.passed ? 'info' : 'error');
      
      return results.passed;
      
    } catch (error) {
      this.log(`Verification failed with error: ${error.message}`, 'error');
      return false;
    }
  }

  loadCheckpoint(sessionId) {
    const checkpointPath = path.join(this.guardrailsDir, 'checkpoints', `${sessionId}.json`);
    
    if (!fs.existsSync(checkpointPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  }

  loadExecutionReport(sessionId) {
    const reportPath = path.join(this.guardrailsDir, 'reports', `execution-proof-${sessionId}.json`);
    
    if (!fs.existsSync(reportPath)) {
      this.log(`No execution report found for session ${sessionId}`, 'warn');
      return null;
    }
    
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  }

  async runCheckpointValidation(sessionId, checkpoint) {
    // Extract claimed deliverables from various sources
    const claimedDeliverables = this.extractClaimedDeliverables(sessionId);
    
    if (claimedDeliverables.length === 0) {
      this.log('No deliverables found to validate', 'warn');
      return { score: 100, message: 'No deliverables to validate' };
    }
    
    // Run validation
    const validation = this.validator.validateHandoff(sessionId, claimedDeliverables);
    
    return {
      score: validation.reliability.claimedVsActual,
      verifiedCount: validation.reliability.verified.length,
      phantomCount: validation.reliability.phantomClaims.length,
      missedCount: validation.reliability.missedChanges.length,
      details: validation
    };
  }

  extractClaimedDeliverables(sessionId) {
    const deliverables = [];
    
    // Try to extract from execution tracker data
    const executionLogPath = path.join(this.guardrailsDir, 'execution-log.jsonl');
    
    if (fs.existsSync(executionLogPath)) {
      const logLines = fs.readFileSync(executionLogPath, 'utf8').split('\n').filter(Boolean);
      
      logLines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          if (entry.sessionId === sessionId) {
            
            // Convert tool executions to deliverable format
            if (entry.toolName === 'Write' && entry.success) {
              deliverables.push({
                type: 'file_created',
                path: entry.parameters.file_path,
                description: `Created file via Write tool`,
                tool: 'Write'
              });
            } else if (['Edit', 'MultiEdit'].includes(entry.toolName) && entry.success) {
              deliverables.push({
                type: 'file_modified',
                path: entry.parameters.file_path,
                description: `Modified file via ${entry.toolName} tool`,
                tool: entry.toolName
              });
            } else if (entry.toolName === 'Bash' && entry.success) {
              deliverables.push({
                type: 'command_executed',
                command: entry.parameters.command,
                description: `Executed command: ${entry.parameters.command}`,
                tool: 'Bash'
              });
            }
          }
        } catch (error) {
          // Skip malformed log entries
        }
      });
    }
    
    // Also check for manually recorded claims
    const sessionLogPath = path.join(this.guardrailsDir, 'session-log.json');
    if (fs.existsSync(sessionLogPath)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionLogPath, 'utf8'));
        if (sessionData.sessionId === sessionId && sessionData.claims) {
          sessionData.claims.forEach(claimRecord => {
            claimRecord.claims.forEach(claim => {
              deliverables.push(claim);
            });
          });
        }
      } catch (error) {
        // Skip malformed session data
      }
    }
    
    return deliverables;
  }

  async runFunctionalTests() {
    const testResults = {
      typecheck: 'unknown',
      lint: 'unknown',
      unitTests: 'unknown',
      score: 0,
      details: {}
    };
    
    // TypeScript compilation check
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 60000 });
      testResults.typecheck = 'pass';
      testResults.details.typecheck = 'TypeScript compilation successful';
    } catch (error) {
      testResults.typecheck = 'fail';
      testResults.details.typecheck = `TypeScript errors: ${error.message}`;
    }
    
    // Linting check
    try {
      execSync('npm run lint', { stdio: 'pipe', timeout: 30000 });
      testResults.lint = 'pass';
      testResults.details.lint = 'Linting passed';
    } catch (error) {
      testResults.lint = 'fail';
      testResults.details.lint = `Lint errors: ${error.message}`;
    }
    
    // Unit tests (if available and not too slow)
    try {
      const testOutput = execSync('npm run test:ci 2>&1 || echo "TESTS_FAILED"', { 
        encoding: 'utf8', 
        timeout: 120000 
      });
      
      if (testOutput.includes('TESTS_FAILED') || testOutput.includes('FAIL')) {
        testResults.unitTests = 'fail';
        testResults.details.unitTests = 'Some unit tests failed';
      } else {
        testResults.unitTests = 'pass';
        testResults.details.unitTests = 'Unit tests passed';
      }
    } catch (error) {
      testResults.unitTests = 'timeout';
      testResults.details.unitTests = 'Tests timed out or errored';
    }
    
    // Calculate score
    const checks = [testResults.typecheck, testResults.lint, testResults.unitTests];
    const passCount = checks.filter(check => check === 'pass').length;
    testResults.score = (passCount / checks.length) * 100;
    
    return testResults;
  }

  async runBuildValidation() {
    const buildResults = {
      buildSuccess: 'unknown',
      bundleSize: 'unknown',
      score: 0,
      details: {}
    };
    
    // Production build test
    try {
      const buildOutput = execSync('npm run build', { 
        encoding: 'utf8', 
        timeout: 180000,
        stdio: 'pipe' 
      });
      
      buildResults.buildSuccess = 'pass';
      buildResults.details.buildSuccess = 'Production build successful';
      
      // Try to extract bundle information
      if (buildOutput.includes('First Load JS')) {
        const sizeMatch = buildOutput.match(/First Load JS shared by all\s+(\d+(?:\.\d+)?)\s*(\w+)/);
        if (sizeMatch) {
          buildResults.bundleSize = `${sizeMatch[1]} ${sizeMatch[2]}`;
          buildResults.details.bundleSize = `Shared bundle size: ${buildResults.bundleSize}`;
        }
      }
      
    } catch (error) {
      buildResults.buildSuccess = 'fail';
      buildResults.details.buildSuccess = `Build failed: ${error.message}`;
    }
    
    // Score based on build success
    buildResults.score = buildResults.buildSuccess === 'pass' ? 100 : 0;
    
    return buildResults;
  }

  calculateOverallScore(results) {
    const weights = {
      checkpointValidation: 0.4,  // Deliverables accuracy
      executionProof: 0.2,        // Execution tracking
      functionalTests: 0.3,       // Code quality
      buildValidation: 0.1        // Production readiness
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    if (results.checkpointValidation) {
      totalScore += results.checkpointValidation.score * weights.checkpointValidation;
      totalWeight += weights.checkpointValidation;
    }
    
    if (results.executionProof) {
      totalScore += results.executionProof.reliabilityScore * weights.executionProof;
      totalWeight += weights.executionProof;
    }
    
    if (results.functionalTests) {
      totalScore += results.functionalTests.score * weights.functionalTests;
      totalWeight += weights.functionalTests;
    }
    
    if (results.buildValidation) {
      totalScore += results.buildValidation.score * weights.buildValidation;
      totalWeight += weights.buildValidation;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  generateVerificationReport(agentType, sessionId, results) {
    const report = {
      agentType,
      sessionId,
      timestamp: new Date().toISOString(),
      overallScore: results.overallScore,
      passed: results.passed,
      checkpointValidation: results.checkpointValidation,
      executionProof: results.executionProof ? {
        reliabilityScore: results.executionProof.reliabilityScore,
        totalExecutions: results.executionProof.executionSummary.totalExecutions,
        discrepancyCount: results.executionProof.discrepancies.length
      } : null,
      functionalTests: results.functionalTests,
      buildValidation: results.buildValidation
    };
    
    // Save detailed report
    const reportPath = path.join(this.guardrailsDir, 'reports', `verification-${sessionId}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    this.printVerificationSummary(report);
    
    return report;
  }

  printVerificationSummary(report) {
    this.log('\n📋 AGENT VERIFICATION SUMMARY', 'info');
    this.log(`Agent: ${report.agentType}`, 'info');
    this.log(`Session: ${report.sessionId}`, 'info');
    this.log(`Overall Score: ${report.overallScore.toFixed(1)}%`, 'info');
    this.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`, report.passed ? 'info' : 'error');
    
    if (report.checkpointValidation) {
      this.log('\n🔍 Checkpoint Validation:', 'info');
      this.log(`  Deliverables Score: ${report.checkpointValidation.score.toFixed(1)}%`, 'info');
      this.log(`  Verified: ${report.checkpointValidation.verifiedCount}`, 'info');
      this.log(`  Phantom Claims: ${report.checkpointValidation.phantomCount}`, 'info');
    }
    
    if (report.executionProof) {
      this.log('\n📊 Execution Proof:', 'info');
      this.log(`  Reliability Score: ${report.executionProof.reliabilityScore.toFixed(1)}%`, 'info');
      this.log(`  Total Executions: ${report.executionProof.totalExecutions}`, 'info');
      this.log(`  Discrepancies: ${report.executionProof.discrepancyCount}`, 'info');
    }
    
    if (report.functionalTests) {
      this.log('\n🧪 Functional Tests:', 'info');
      this.log(`  Test Score: ${report.functionalTests.score.toFixed(1)}%`, 'info');
      this.log(`  TypeCheck: ${report.functionalTests.typecheck}`, 'info');
      this.log(`  Lint: ${report.functionalTests.lint}`, 'info');
      this.log(`  Unit Tests: ${report.functionalTests.unitTests}`, 'info');
    }
    
    if (report.buildValidation) {
      this.log('\n🏗️  Build Validation:', 'info');
      this.log(`  Build Score: ${report.buildValidation.score.toFixed(1)}%`, 'info');
      this.log(`  Build Status: ${report.buildValidation.buildSuccess}`, 'info');
    }
  }

  /**
   * List all available sessions for verification
   */
  listSessions() {
    const checkpointsDir = path.join(this.guardrailsDir, 'checkpoints');
    
    if (!fs.existsSync(checkpointsDir)) {
      this.log('No checkpoints directory found', 'warn');
      return [];
    }
    
    const sessions = [];
    const files = fs.readdirSync(checkpointsDir);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const checkpoint = JSON.parse(fs.readFileSync(path.join(checkpointsDir, file), 'utf8'));
          sessions.push({
            sessionId: checkpoint.checkpointId,
            agentType: checkpoint.agentType,
            timestamp: checkpoint.timestamp,
            file: file
          });
        } catch (error) {
          // Skip malformed checkpoints
        }
      }
    });
    
    return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * CLI interface
   */
  static async cli() {
    const args = process.argv.slice(2);
    const cli = new AgentVerificationCLI();
    
    if (args[0] === 'verify') {
      const sessionId = args[1];
      const agentType = args[2] || 'unknown';
      
      if (!sessionId) {
        console.error('Usage: verify-agent.js verify <session-id> [agent-type] [--skip-tests] [--skip-build]');
        process.exit(1);
      }
      
      const options = {
        skipTests: args.includes('--skip-tests'),
        skipBuild: args.includes('--skip-build'),
        skipCheckpoint: args.includes('--skip-checkpoint')
      };
      
      const passed = await cli.verifyAgent(agentType, sessionId, options);
      process.exit(passed ? 0 : 1);
      
    } else if (args[0] === 'list') {
      const sessions = cli.listSessions();
      
      if (sessions.length === 0) {
        cli.log('No sessions found', 'info');
      } else {
        cli.log('\n📋 Available Sessions:', 'info');
        sessions.forEach(session => {
          cli.log(`  ${session.sessionId} (${session.agentType}) - ${session.timestamp}`, 'info');
        });
      }
      
    } else {
      console.error('Usage: verify-agent.js <verify|list> ...');
      console.error('');
      console.error('Commands:');
      console.error('  verify <session-id> [agent-type] [--skip-tests] [--skip-build]');
      console.error('  list');
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  AgentVerificationCLI.cli().catch(error => {
    console.error('CLI error:', error);
    process.exit(1);
  });
}

module.exports = AgentVerificationCLI;