#!/usr/bin/env node

/**
 * Execution Proof Tracker - Agent Guardrails System
 * Tracks actual tool executions vs agent claims
 */

const fs = require('fs');
const path = require('path');

class ExecutionTracker {
  constructor() {
    this.guardrailsDir = path.join(process.cwd(), '.claude', 'guardrails');
    this.executionLogPath = path.join(this.guardrailsDir, 'execution-log.jsonl');
    this.sessionLogPath = path.join(this.guardrailsDir, 'session-log.json');
    this.currentSession = null;
    
    this.ensureDirectories();
    this.loadSession();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.guardrailsDir)) {
      fs.mkdirSync(this.guardrailsDir, { recursive: true });
    }
  }

  loadSession() {
    if (fs.existsSync(this.sessionLogPath)) {
      this.currentSession = JSON.parse(fs.readFileSync(this.sessionLogPath, 'utf8'));
    }
  }

  saveSession() {
    if (this.currentSession) {
      fs.writeFileSync(this.sessionLogPath, JSON.stringify(this.currentSession, null, 2));
    }
  }

  /**
   * Start tracking a new agent session
   */
  startSession(agentType, sessionId = null) {
    const id = sessionId || `${agentType}_${Date.now()}`;
    
    this.currentSession = {
      sessionId: id,
      agentType,
      startTime: new Date().toISOString(),
      toolCalls: [],
      claims: [],
      status: 'active'
    };
    
    this.saveSession();
    this.log(`Started tracking session: ${id}`, 'info');
    return id;
  }

  /**
   * Record a tool execution
   */
  recordExecution(toolName, parameters, result, timestamp = null) {
    if (!this.currentSession) {
      this.log('No active session - starting anonymous session', 'warn');
      this.startSession('anonymous');
    }
    
    const execution = {
      timestamp: timestamp || new Date().toISOString(),
      toolName,
      parameters: this.sanitizeParameters(parameters),
      result: this.sanitizeResult(result),
      success: !result.error,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.currentSession.toolCalls.push(execution);
    this.saveSession();
    
    // Also append to execution log (JSONL format for easy parsing)
    const logEntry = {
      sessionId: this.currentSession.sessionId,
      ...execution
    };
    
    fs.appendFileSync(this.executionLogPath, JSON.stringify(logEntry) + '\n');
    
    this.log(`Recorded ${toolName} execution: ${execution.success ? 'SUCCESS' : 'FAILED'}`, 'info');
    return execution.executionId;
  }

  /**
   * Record agent claims about what they accomplished
   */
  recordClaims(claims) {
    if (!this.currentSession) {
      this.log('No active session to record claims', 'error');
      return;
    }
    
    const claimRecord = {
      timestamp: new Date().toISOString(),
      claims: Array.isArray(claims) ? claims : [claims],
      claimId: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.currentSession.claims.push(claimRecord);
    this.saveSession();
    
    this.log(`Recorded ${claimRecord.claims.length} agent claims`, 'info');
    return claimRecord.claimId;
  }

  /**
   * End current session and generate proof report
   */
  endSession() {
    if (!this.currentSession) {
      this.log('No active session to end', 'warn');
      return null;
    }
    
    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.status = 'completed';
    
    const proofReport = this.generateProofReport();
    this.saveSession();
    
    const sessionId = this.currentSession.sessionId;
    this.currentSession = null;
    this.saveSession();
    
    this.log(`Session ${sessionId} ended`, 'info');
    return proofReport;
  }

  /**
   * Generate execution proof report
   */
  generateProofReport() {
    if (!this.currentSession) {
      throw new Error('No active session for proof report');
    }
    
    const report = {
      sessionId: this.currentSession.sessionId,
      agentType: this.currentSession.agentType,
      duration: new Date(this.currentSession.endTime) - new Date(this.currentSession.startTime),
      timestamp: new Date().toISOString(),
      executionSummary: this.analyzeExecutions(),
      claimAnalysis: this.analyzeClaims(),
      reliabilityScore: 0,
      discrepancies: [],
      recommendations: []
    };
    
    // Cross-reference claims with actual executions
    report.verification = this.verifyClaims();
    report.reliabilityScore = this.calculateReliabilityScore(report.verification);
    report.discrepancies = this.findDiscrepancies(report.verification);
    report.recommendations = this.generateRecommendations(report);
    
    // Save report
    const reportPath = path.join(this.guardrailsDir, 'reports', `execution-proof-${this.currentSession.sessionId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.generateProofSummary(report);
    return report;
  }

  analyzeExecutions() {
    const executions = this.currentSession.toolCalls;
    
    const summary = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.success).length,
      failedExecutions: executions.filter(e => !e.success).length,
      toolBreakdown: {},
      fileOperations: [],
      commandExecutions: []
    };
    
    executions.forEach(exec => {
      // Count by tool
      summary.toolBreakdown[exec.toolName] = (summary.toolBreakdown[exec.toolName] || 0) + 1;
      
      // Categorize operations
      if (['Write', 'Edit', 'MultiEdit'].includes(exec.toolName)) {
        summary.fileOperations.push({
          tool: exec.toolName,
          path: exec.parameters.file_path || exec.parameters.path,
          success: exec.success,
          timestamp: exec.timestamp
        });
      } else if (exec.toolName === 'Bash') {
        summary.commandExecutions.push({
          command: exec.parameters.command,
          success: exec.success,
          timestamp: exec.timestamp
        });
      }
    });
    
    return summary;
  }

  analyzeClaims() {
    const allClaims = this.currentSession.claims.flatMap(c => c.claims);
    
    return {
      totalClaims: allClaims.length,
      claimTypes: this.categorizeClaimTypes(allClaims),
      claimsByTime: this.currentSession.claims.map(c => ({
        timestamp: c.timestamp,
        count: c.claims.length,
        claims: c.claims
      }))
    };
  }

  categorizeClaimTypes(claims) {
    const types = {};
    
    claims.forEach(claim => {
      const type = this.inferClaimType(claim);
      types[type] = (types[type] || 0) + 1;
    });
    
    return types;
  }

  inferClaimType(claim) {
    if (typeof claim === 'string') {
      if (claim.includes('created') || claim.includes('wrote')) return 'file_creation';
      if (claim.includes('modified') || claim.includes('updated') || claim.includes('edited')) return 'file_modification';
      if (claim.includes('ran') || claim.includes('executed') || claim.includes('installed')) return 'command_execution';
      if (claim.includes('fixed') || claim.includes('resolved')) return 'bug_fix';
      if (claim.includes('deployed') || claim.includes('published')) return 'deployment';
      return 'general';
    } else if (claim.type) {
      return claim.type;
    }
    
    return 'unknown';
  }

  verifyClaims() {
    const executions = this.currentSession.toolCalls;
    const allClaims = this.currentSession.claims.flatMap(c => c.claims);
    
    const verification = {
      verifiedClaims: [],
      unverifiedClaims: [],
      executionsWithoutClaims: [],
      matchingAccuracy: 0
    };
    
    // Check each claim against executions
    allClaims.forEach(claim => {
      const matchingExecution = this.findMatchingExecution(claim, executions);
      
      if (matchingExecution) {
        verification.verifiedClaims.push({
          claim,
          execution: matchingExecution,
          confidence: this.calculateMatchConfidence(claim, matchingExecution)
        });
      } else {
        verification.unverifiedClaims.push(claim);
      }
    });
    
    // Check for executions without corresponding claims
    executions.forEach(execution => {
      const matchingClaim = allClaims.find(claim => 
        this.findMatchingExecution(claim, [execution])
      );
      
      if (!matchingClaim && this.isSignificantExecution(execution)) {
        verification.executionsWithoutClaims.push(execution);
      }
    });
    
    // Calculate accuracy
    const totalClaims = allClaims.length;
    const verifiedClaims = verification.verifiedClaims.length;
    verification.matchingAccuracy = totalClaims > 0 ? (verifiedClaims / totalClaims) * 100 : 100;
    
    return verification;
  }

  findMatchingExecution(claim, executions) {
    // Try to match claims with actual tool executions
    const claimStr = typeof claim === 'string' ? claim.toLowerCase() : JSON.stringify(claim).toLowerCase();
    
    return executions.find(exec => {
      // Direct path matching for file operations
      if (claim.path && exec.parameters.file_path) {
        return claim.path === exec.parameters.file_path;
      }
      
      // Tool name matching
      if (claim.tool && exec.toolName) {
        return claim.tool.toLowerCase() === exec.toolName.toLowerCase();
      }
      
      // Content-based matching
      if (claimStr.includes('created') || claimStr.includes('wrote')) {
        return exec.toolName === 'Write';
      }
      
      if (claimStr.includes('modified') || claimStr.includes('edited')) {
        return ['Edit', 'MultiEdit'].includes(exec.toolName);
      }
      
      if (claimStr.includes('ran') || claimStr.includes('executed')) {
        return exec.toolName === 'Bash';
      }
      
      // Command matching
      if (claim.command && exec.parameters.command) {
        return exec.parameters.command.includes(claim.command);
      }
      
      return false;
    });
  }

  calculateMatchConfidence(claim, execution) {
    let confidence = 0.5; // Base confidence
    
    // Exact path match
    if (claim.path === execution.parameters.file_path) {
      confidence += 0.4;
    }
    
    // Tool type match
    if (claim.tool === execution.toolName) {
      confidence += 0.3;
    }
    
    // Success status
    if (execution.success) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  isSignificantExecution(execution) {
    // Consider file operations and important commands as significant
    const significantTools = ['Write', 'Edit', 'MultiEdit'];
    const significantCommands = ['npm', 'git', 'vercel', 'npx'];
    
    if (significantTools.includes(execution.toolName)) {
      return true;
    }
    
    if (execution.toolName === 'Bash') {
      const command = execution.parameters.command || '';
      return significantCommands.some(cmd => command.startsWith(cmd));
    }
    
    return false;
  }

  calculateReliabilityScore(verification) {
    const weights = {
      claimAccuracy: 0.5,  // How many claims were verified
      executionCoverage: 0.3,  // How many significant executions had claims
      phantomPenalty: 0.2   // Penalty for phantom claims
    };
    
    const totalClaims = verification.verifiedClaims.length + verification.unverifiedClaims.length;
    const claimAccuracy = totalClaims > 0 ? verification.verifiedClaims.length / totalClaims : 1;
    
    const totalSignificantExecutions = this.currentSession.toolCalls.filter(e => this.isSignificantExecution(e)).length;
    const executionCoverage = totalSignificantExecutions > 0 ? 
      (totalSignificantExecutions - verification.executionsWithoutClaims.length) / totalSignificantExecutions : 1;
    
    const phantomPenalty = verification.unverifiedClaims.length * 0.1;
    
    const score = (
      claimAccuracy * weights.claimAccuracy +
      executionCoverage * weights.executionCoverage -
      phantomPenalty * weights.phantomPenalty
    ) * 100;
    
    return Math.max(0, Math.min(100, score));
  }

  findDiscrepancies(verification) {
    const discrepancies = [];
    
    // Phantom claims (claims without executions)
    verification.unverifiedClaims.forEach(claim => {
      discrepancies.push({
        type: 'phantom_claim',
        severity: 'high',
        description: `Agent claimed: "${typeof claim === 'string' ? claim : JSON.stringify(claim)}" but no matching execution found`,
        claim
      });
    });
    
    // Missing claims (executions without claims)
    verification.executionsWithoutClaims.forEach(execution => {
      discrepancies.push({
        type: 'missing_claim',
        severity: 'medium',
        description: `Execution performed but not claimed: ${execution.toolName}`,
        execution
      });
    });
    
    return discrepancies;
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    if (report.reliabilityScore < 80) {
      recommendations.push({
        type: 'reliability_improvement',
        priority: 'high',
        message: 'Agent reliability is below 80%. Review claims vs actual executions.'
      });
    }
    
    if (report.discrepancies.filter(d => d.type === 'phantom_claim').length > 2) {
      recommendations.push({
        type: 'phantom_claims',
        priority: 'high',
        message: 'Multiple phantom claims detected. Agent may be overstating accomplishments.'
      });
    }
    
    if (report.executionSummary.failedExecutions > report.executionSummary.successfulExecutions) {
      recommendations.push({
        type: 'execution_failures',
        priority: 'medium',
        message: 'More failed executions than successful ones. Check error handling.'
      });
    }
    
    return recommendations;
  }

  generateProofSummary(report) {
    this.log('\n🔍 EXECUTION PROOF REPORT', 'info');
    this.log(`Session: ${report.sessionId} (${report.agentType})`, 'info');
    this.log(`Reliability Score: ${report.reliabilityScore.toFixed(1)}%`, 'info');
    
    this.log(`\n📊 Execution Summary:`, 'info');
    this.log(`  Total Executions: ${report.executionSummary.totalExecutions}`, 'info');
    this.log(`  Successful: ${report.executionSummary.successfulExecutions}`, 'info');
    this.log(`  Failed: ${report.executionSummary.failedExecutions}`, 'info');
    
    this.log(`\n📝 Claim Analysis:`, 'info');
    this.log(`  Total Claims: ${report.claimAnalysis.totalClaims}`, 'info');
    this.log(`  Verified: ${report.verification.verifiedClaims.length}`, 'info');
    this.log(`  Phantom: ${report.verification.unverifiedClaims.length}`, 'info');
    
    if (report.discrepancies.length > 0) {
      this.log(`\n⚠️  Discrepancies Found:`, 'warn');
      report.discrepancies.forEach(disc => {
        this.log(`  ${disc.type}: ${disc.description}`, 'warn');
      });
    }
    
    if (report.recommendations.length > 0) {
      this.log(`\n💡 Recommendations:`, 'info');
      report.recommendations.forEach(rec => {
        this.log(`  ${rec.priority.toUpperCase()}: ${rec.message}`, 'info');
      });
    }
  }

  sanitizeParameters(params) {
    // Remove sensitive data from parameters
    const sanitized = { ...params };
    
    // Remove potentially large content
    if (sanitized.content && sanitized.content.length > 1000) {
      sanitized.content = sanitized.content.substring(0, 1000) + '...[truncated]';
    }
    
    if (sanitized.new_string && sanitized.new_string.length > 1000) {
      sanitized.new_string = sanitized.new_string.substring(0, 1000) + '...[truncated]';
    }
    
    return sanitized;
  }

  sanitizeResult(result) {
    // Remove large outputs from results
    if (typeof result === 'string' && result.length > 2000) {
      return result.substring(0, 2000) + '...[truncated]';
    }
    
    return result;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Static methods for integration
  static getInstance() {
    if (!this.instance) {
      this.instance = new ExecutionTracker();
    }
    return this.instance;
  }

  static recordExecution(toolName, parameters, result) {
    return this.getInstance().recordExecution(toolName, parameters, result);
  }

  static recordClaims(claims) {
    return this.getInstance().recordClaims(claims);
  }
}

module.exports = ExecutionTracker;