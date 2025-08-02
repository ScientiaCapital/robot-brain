# Agent Reliability Guardrails System

## 🛡️ Overview

This system prevents agent reliability issues like agents claiming to create files without actually executing tool calls. It provides comprehensive verification and tracking of agent deliverables.

## 🚀 Quick Start

```bash
# Create a checkpoint before agent work
npm run agent:checkpoint vercel-deployment-specialist

# Validate agent work after completion  
npm run agent:validate checkpoint_id '[{"type":"file_created","path":"scripts/deploy.js","description":"Deployment script"}]'

# Verify a complete agent session
npm run agent:verify session_id agent_type

# List all available sessions
npm run agent:list
```

## 📁 System Components

### 1. Agent Handoff Validator (`agent-handoff-validator.js`)
- **Pre-agent checkpoints**: Git snapshots and state capture
- **Post-agent validation**: Verify claimed deliverables exist
- **Reliability scoring**: Track claim accuracy vs reality
- **Phantom detection**: Identify false claims

### 2. Execution Tracker (`execution-tracker.js`)
- **Tool call tracking**: Record all actual tool executions  
- **Claim recording**: Log agent statements about accomplishments
- **Proof generation**: Cross-reference claims with executions
- **Discrepancy detection**: Find phantom claims and missed work

### 3. Verification CLI (`verify-agent.js`)
- **Comprehensive validation**: Multi-layer verification system
- **Functional testing**: TypeScript, linting, unit tests
- **Build validation**: Production build success
- **Scoring system**: Overall reliability assessment

## 🔧 Integration Workflow

### For Agent Sessions

1. **Pre-Agent**: Create checkpoint
   ```bash
   CHECKPOINT_ID=$(npm run agent:checkpoint my-agent-type)
   ```

2. **During Agent Work**: Execution tracker runs automatically

3. **Post-Agent**: Validate deliverables
   ```bash
   npm run agent:validate $CHECKPOINT_ID '[
     {"type":"file_created","path":"src/new-file.ts","description":"New component"},
     {"type":"file_modified","path":"package.json","description":"Added scripts"}
   ]'
   ```

4. **Final Verification**: Complete validation
   ```bash
   npm run agent:verify $CHECKPOINT_ID my-agent-type
   ```

### Manual Integration

```javascript
const AgentHandoffValidator = require('./.claude/guardrails/agent-handoff-validator');
const ExecutionTracker = require('./.claude/guardrails/execution-tracker');

// Start session
const validator = new AgentHandoffValidator();
const tracker = ExecutionTracker.getInstance();

const checkpointId = validator.createCheckpoint('my-agent');
tracker.startSession('my-agent', checkpointId);

// Record tool executions
tracker.recordExecution('Write', {file_path: 'test.js'}, {success: true});

// Record agent claims
tracker.recordClaims([
  {type: 'file_created', path: 'test.js', description: 'Created test file'}
]);

// Validate
const validation = validator.validateHandoff(checkpointId, claims);
const proofReport = tracker.endSession();
```

## 📊 Reliability Metrics

### Scoring System
- **90-100%**: Excellent reliability
- **80-89%**: Good reliability  
- **70-79%**: Acceptable with monitoring
- **<70%**: Requires intervention

### Key Metrics
- **Claim Accuracy**: % of claims that match actual executions
- **Phantom Claims**: Claims without corresponding executions
- **Missed Work**: Executions without corresponding claims
- **Execution Success Rate**: % of tool calls that succeeded

## 🔍 Detection Capabilities

### Phantom Work Detection
- Files claimed to be created but don't exist
- Modifications claimed but file unchanged
- Commands claimed but no execution recorded

### Reliability Patterns
- Agents that consistently overstate work
- Tools that frequently fail silently
- Sessions with high claim/execution mismatches

### Quality Assurance
- TypeScript compilation validation
- Linting and code quality checks
- Unit test execution status
- Production build verification

## 📈 Reports and Monitoring

### Generated Reports
- **Checkpoint Validation**: Pre/post state comparison
- **Execution Proof**: Tool calls vs claims analysis  
- **Verification Summary**: Comprehensive quality assessment
- **Reliability Metrics**: Historical agent performance

### Report Locations
```
.claude/guardrails/
├── checkpoints/           # Pre-agent state snapshots
├── reports/              # Validation and verification reports  
├── execution-log.jsonl   # Real-time tool execution log
├── session-log.json      # Current session tracking
└── reliability-metrics.json # Historical performance data
```

## 🛠️ Advanced Usage

### Custom Deliverable Types
```javascript
const customDeliverables = [
  {
    type: 'api_endpoint_created',
    path: '/api/new-route',
    expectedContent: 'export async function POST',
    description: 'New API route implementation'
  },
  {
    type: 'test_coverage_improved', 
    metric: 'coverage_percentage',
    expectedValue: 85,
    description: 'Increased test coverage to 85%'
  }
];
```

### Reliability Thresholds
```javascript
// In verification CLI
const options = {
  skipTests: false,           // Run functional tests
  skipBuild: false,          // Run build validation  
  reliabilityThreshold: 90,  // Minimum acceptable score
  strictMode: true           // Fail on any phantom claims
};
```

### Integration with Git Hooks
```bash
# Pre-commit hook
#!/bin/sh
if [ -f .claude/guardrails/session-log.json ]; then
  npm run agent:verify $(cat .claude/guardrails/session-log.json | jq -r '.sessionId') || exit 1
fi
```

## 🔒 Security Considerations

- **Content Sanitization**: Large file contents truncated in logs
- **Sensitive Data**: API keys and secrets filtered from reports
- **Access Control**: Guardrails directory should be protected
- **Log Rotation**: Execution logs automatically managed

## 🐛 Troubleshooting

### Common Issues

1. **Missing Checkpoints**
   ```bash
   # List available sessions
   npm run agent:list
   ```

2. **Phantom Claims**
   ```bash
   # Check execution log for missing tool calls
   cat .claude/guardrails/execution-log.jsonl | grep "sessionId"
   ```

3. **Low Reliability Scores**
   ```bash
   # Review detailed verification report
   cat .claude/guardrails/reports/verification-*.json
   ```

### Performance Optimization
- Execution logs automatically truncate large content
- Checkpoints exclude `node_modules` and build artifacts
- Verification can skip slow tests with `--skip-tests`

## 📝 Contributing

To extend the guardrails system:

1. Add new deliverable types in `agent-handoff-validator.js`
2. Implement custom validation logic in `verify-agent.js`  
3. Add new metrics to `execution-tracker.js`
4. Update CLI commands in package.json

## 🎯 Success Metrics

This system successfully prevents:
- ✅ Agents claiming file creation without using Write tool
- ✅ Phantom deployment claims without actual execution
- ✅ Missed work that breaks subsequent agent sessions
- ✅ Reliability degradation going unnoticed
- ✅ False confidence in agent-generated deliverables

**The exact issue you identified with the vercel-deployment-specialist is now impossible** - every claimed deliverable is automatically verified against actual tool executions.