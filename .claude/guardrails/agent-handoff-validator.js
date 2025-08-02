#!/usr/bin/env node

/**
 * Agent Handoff Validator - Core Guardrails System
 * Prevents agent reliability issues by validating deliverables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class AgentHandoffValidator {
  constructor() {
    this.guardrailsDir = path.join(process.cwd(), '.claude', 'guardrails');
    this.checkpointsDir = path.join(this.guardrailsDir, 'checkpoints');
    this.reportsDir = path.join(this.guardrailsDir, 'reports');
    this.metricsFile = path.join(this.guardrailsDir, 'reliability-metrics.json');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.checkpointsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      check: '🔍'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Create a pre-agent checkpoint
   */
  createCheckpoint(agentType, sessionId = null) {
    const checkpointId = sessionId || `${agentType}_${Date.now()}`;
    const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
    
    this.log(`Creating checkpoint for ${agentType}...`, 'check');
    
    // Capture current state
    const checkpoint = {
      checkpointId,
      agentType,
      timestamp: new Date().toISOString(),
      gitState: this.captureGitState(),
      fileState: this.captureFileState(),
      buildState: this.captureBuildState()
    };
    
    // Create git snapshot
    try {
      execSync(`git add -A && git commit -m "Pre-${agentType} checkpoint [${checkpointId}]"`, { stdio: 'pipe' });
      checkpoint.gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      this.log(`Git checkpoint failed: ${error.message}`, 'warn');
      checkpoint.gitCommit = null;
    }
    
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
    this.log(`Checkpoint created: ${checkpointId}`, 'info');
    
    return checkpointId;
  }

  /**
   * Validate agent deliverables against checkpoint
   */
  validateHandoff(checkpointId, claimedDeliverables) {
    const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
    
    if (!fs.existsSync(checkpointPath)) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    const currentState = {
      gitState: this.captureGitState(),
      fileState: this.captureFileState(),
      buildState: this.captureBuildState()
    };
    
    this.log(`Validating handoff for ${checkpoint.agentType}...`, 'check');
    
    const validation = {
      checkpointId,
      agentType: checkpoint.agentType,
      timestamp: new Date().toISOString(),
      claimedDeliverables,
      actualDeliverables: this.detectActualChanges(checkpoint, currentState),
      validationResults: [],
      reliability: {
        claimedVsActual: 0,
        phantomClaims: [],
        missedChanges: [],
        verified: []
      }
    };
    
    // Validate each claimed deliverable
    claimedDeliverables.forEach(claim => {
      const result = this.validateDeliverable(claim, checkpoint, currentState);
      validation.validationResults.push(result);
      
      if (result.status === 'verified') {
        validation.reliability.verified.push(claim);
      } else if (result.status === 'phantom') {
        validation.reliability.phantomClaims.push(claim);
      }
    });
    
    // Check for unreported changes
    validation.reliability.missedChanges = this.findMissedChanges(
      validation.actualDeliverables,
      claimedDeliverables
    );
    
    // Calculate reliability score
    const totalClaims = claimedDeliverables.length;
    const verifiedClaims = validation.reliability.verified.length;
    validation.reliability.claimedVsActual = totalClaims > 0 ? (verifiedClaims / totalClaims) * 100 : 100;
    
    // Save validation report
    const reportPath = path.join(this.reportsDir, `validation_${checkpointId}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
    
    // Update reliability metrics
    this.updateReliabilityMetrics(checkpoint.agentType, validation.reliability);
    
    this.generateValidationReport(validation);
    
    return validation;
  }

  validateDeliverable(claim, checkpoint, currentState) {
    const result = {
      claim,
      status: 'unknown',
      evidence: [],
      issues: []
    };
    
    switch (claim.type) {
      case 'file_created':
        result.status = fs.existsSync(claim.path) ? 'verified' : 'phantom';
        if (result.status === 'verified') {
          result.evidence.push(`File exists at ${claim.path}`);
          
          if (claim.expectedContent) {
            const content = fs.readFileSync(claim.path, 'utf8');
            const hasExpectedContent = content.includes(claim.expectedContent);
            if (!hasExpectedContent) {
              result.issues.push('File exists but lacks expected content');
              result.status = 'partial';
            }
          }
        } else {
          result.issues.push(`File does not exist at ${claim.path}`);
        }
        break;
        
      case 'file_modified':
        if (!fs.existsSync(claim.path)) {
          result.status = 'phantom';
          result.issues.push(`File does not exist at ${claim.path}`);
        } else {
          const currentHash = this.getFileHash(claim.path);
          const originalHash = checkpoint.fileState.hashes[claim.path];
          
          if (currentHash !== originalHash) {
            result.status = 'verified';
            result.evidence.push(`File modified: hash changed from ${originalHash} to ${currentHash}`);
          } else {
            result.status = 'phantom';
            result.issues.push('File exists but was not actually modified');
          }
        }
        break;
        
      case 'command_executed':
        // For commands, we can check if expected side effects occurred
        result.status = 'partial'; // Commands are harder to verify directly
        result.evidence.push('Command execution cannot be directly verified');
        break;
        
      default:
        result.status = 'unknown';
        result.issues.push(`Unknown deliverable type: ${claim.type}`);
    }
    
    return result;
  }

  captureGitState() {
    try {
      return {
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { encoding: 'utf8' }).trim(),
        staged: execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean),
        modified: execSync('git diff --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  captureFileState() {
    const fileState = {
      timestamp: new Date().toISOString(),
      hashes: {},
      structure: {}
    };
    
    // Recursively hash important files
    const scanDir = (dir, prefix = '') => {
      try {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const relativePath = path.join(prefix, item);
          
          // Skip node_modules, .git, and other unnecessary directories
          if (['node_modules', '.git', 'coverage', '.next'].includes(item)) {
            return;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            fileState.structure[relativePath] = 'directory';
            scanDir(fullPath, relativePath);
          } else if (stat.isFile()) {
            fileState.structure[relativePath] = 'file';
            fileState.hashes[relativePath] = this.getFileHash(fullPath);
          }
        });
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    scanDir(process.cwd());
    return fileState;
  }

  captureBuildState() {
    const buildState = {
      timestamp: new Date().toISOString(),
      tests: 'unknown',
      typecheck: 'unknown',
      lint: 'unknown',
      build: 'unknown'
    };
    
    // Quick checks for build state
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 30000 });
      buildState.typecheck = 'pass';
    } catch (error) {
      buildState.typecheck = 'fail';
    }
    
    return buildState;
  }

  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  detectActualChanges(checkpoint, currentState) {
    const changes = [];
    
    // Compare file hashes to detect actual changes
    Object.keys(currentState.fileState.hashes).forEach(filePath => {
      const currentHash = currentState.fileState.hashes[filePath];
      const originalHash = checkpoint.fileState.hashes[filePath];
      
      if (!originalHash) {
        changes.push({
          type: 'file_created',
          path: filePath,
          evidence: 'New file detected'
        });
      } else if (currentHash !== originalHash) {
        changes.push({
          type: 'file_modified',
          path: filePath,
          evidence: `Hash changed: ${originalHash} → ${currentHash}`
        });
      }
    });
    
    // Check for deleted files
    Object.keys(checkpoint.fileState.hashes).forEach(filePath => {
      if (!currentState.fileState.hashes[filePath]) {
        changes.push({
          type: 'file_deleted',
          path: filePath,
          evidence: 'File no longer exists'
        });
      }
    });
    
    return changes;
  }

  findMissedChanges(actualChanges, claimedDeliverables) {
    const claimedPaths = new Set(claimedDeliverables.map(claim => claim.path));
    
    return actualChanges.filter(change => {
      return !claimedPaths.has(change.path);
    });
  }

  updateReliabilityMetrics(agentType, reliability) {
    let metrics = {};
    
    if (fs.existsSync(this.metricsFile)) {
      metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    }
    
    if (!metrics[agentType]) {
      metrics[agentType] = {
        totalSessions: 0,
        averageReliability: 0,
        phantomClaimsCount: 0,
        verifiedDeliverables: 0,
        totalClaims: 0
      };
    }
    
    const agent = metrics[agentType];
    agent.totalSessions++;
    agent.phantomClaimsCount += reliability.phantomClaims.length;
    agent.verifiedDeliverables += reliability.verified.length;
    agent.totalClaims += reliability.verified.length + reliability.phantomClaims.length;
    
    if (agent.totalClaims > 0) {
      agent.averageReliability = (agent.verifiedDeliverables / agent.totalClaims) * 100;
    }
    
    metrics.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
  }

  generateValidationReport(validation) {
    this.log('\n📊 AGENT HANDOFF VALIDATION REPORT', 'info');
    this.log(`Agent: ${validation.agentType}`, 'info');
    this.log(`Reliability Score: ${validation.reliability.claimedVsActual.toFixed(1)}%`, 'info');
    
    if (validation.reliability.verified.length > 0) {
      this.log(`\n✅ VERIFIED DELIVERABLES (${validation.reliability.verified.length}):`, 'info');
      validation.reliability.verified.forEach(claim => {
        this.log(`  ${claim.type}: ${claim.path}`, 'info');
      });
    }
    
    if (validation.reliability.phantomClaims.length > 0) {
      this.log(`\n👻 PHANTOM CLAIMS (${validation.reliability.phantomClaims.length}):`, 'error');
      validation.reliability.phantomClaims.forEach(claim => {
        this.log(`  ${claim.type}: ${claim.path} - ${claim.description}`, 'error');
      });
    }
    
    if (validation.reliability.missedChanges.length > 0) {
      this.log(`\n❓ UNREPORTED CHANGES (${validation.reliability.missedChanges.length}):`, 'warn');
      validation.reliability.missedChanges.forEach(change => {
        this.log(`  ${change.type}: ${change.path}`, 'warn');
      });
    }
    
    const isReliable = validation.reliability.claimedVsActual >= 90;
    this.log(`\n${isReliable ? '✅' : '❌'} Agent handoff ${isReliable ? 'VERIFIED' : 'FAILED'}`, isReliable ? 'info' : 'error');
    
    return isReliable;
  }

  // CLI interface
  static cli() {
    const args = process.argv.slice(2);
    const validator = new AgentHandoffValidator();
    
    if (args[0] === 'checkpoint') {
      const agentType = args[1];
      const sessionId = args[2];
      
      if (!agentType) {
        console.error('Usage: agent-handoff-validator.js checkpoint <agent-type> [session-id]');
        process.exit(1);
      }
      
      const checkpointId = validator.createCheckpoint(agentType, sessionId);
      console.log(checkpointId);
      
    } else if (args[0] === 'validate') {
      const checkpointId = args[1];
      const deliverables = JSON.parse(args[2] || '[]');
      
      if (!checkpointId) {
        console.error('Usage: agent-handoff-validator.js validate <checkpoint-id> <deliverables-json>');
        process.exit(1);
      }
      
      const validation = validator.validateHandoff(checkpointId, deliverables);
      const isReliable = validation.reliability.claimedVsActual >= 90;
      process.exit(isReliable ? 0 : 1);
      
    } else {
      console.error('Usage: agent-handoff-validator.js <checkpoint|validate> ...');
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  AgentHandoffValidator.cli();
}

module.exports = AgentHandoffValidator;