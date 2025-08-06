# Agent Implementation Guide

## 🎯 Quick Start Guide for Enhanced Agent Processes

This guide shows how to implement the new agent lockdown procedures immediately.

---

## 🚀 How to Use Enhanced Agent Processes

### Step 1: Select Appropriate Template
From `AGENT_PROMPT_TEMPLATES.md`, copy the template for your specific agent type:
- `neon-database-architect` for database work
- `react-performance-engineer` for frontend performance
- `typescript-api-specialist` for API development
- `ai-integration-engineer` for AI service integration
- `mvp-testing-strategist` for testing frameworks
- `github-workflow-automator` for CI/CD pipelines
- `general-purpose` for coordination tasks

### Step 2: Customize Template
1. Replace `[PROJECT DESCRIPTION]` with actual project context
2. Replace `[TASK DESCRIPTION]` with specific task requirements
3. Keep ALL checklists and requirements intact
4. Do NOT modify the universal prompt header

### Step 3: Validate Agent Follows Process
The agent MUST provide evidence for each phase:
- **Pre-work**: Show they read docs, checked dependencies, verified build state
- **RED Phase**: Show failing tests with expected errors
- **GREEN Phase**: Show tests passing with minimal implementation
- **REFACTOR Phase**: Show improved code with tests still passing
- **Completion**: Show build success and integration verification

### Step 4: Quality Enforcement
Use `AGENT_QUALITY_ENFORCEMENT.md` to verify:
- All deliverables provided with proper evidence
- Build succeeds (npm run build output required)
- Tests pass (npm test output required)
- Integration works with existing functionality
- Agent reliability score calculated

---

## 🔧 Implementation Example

### Before (Old Way):
```
Create database health checks for the Neon database.
```

### After (New Enhanced Process):
```
You are the neon-database-architect for Robot Brain Project Component 2: Production Health Verification Test Suite.

**CRITICAL: MANDATORY PRE-WORK VALIDATION**

Before starting ANY work, you MUST complete this validation checklist:

□ Read `/robot-brain/CLAUDE.md` for rules and patterns
□ Read `/robot-brain/ProjectContextEngineering.md` for technical architecture  
□ Read `/robot-brain/ProjectTasks.md` for current priorities
□ Read `package.json` to identify EXACT dependencies available
□ Run `npm run build` to verify current build state (must succeed)
□ Check existing code patterns in your work area
□ Identify existing environment variable naming conventions

**TDD METHODOLOGY - MANDATORY:**
- RED PHASE: Write failing tests, run them, confirm they fail
- GREEN PHASE: Write minimal code to pass tests, verify success
- REFACTOR PHASE: Improve code while maintaining test success
- Run `npm run build` after each phase to ensure no compilation errors

**COMPLETION REQUIREMENTS:**
- `npm run build` succeeds with ZERO errors
- All relevant tests pass consistently  
- Integration with existing functionality verified
- No breaking changes to existing API contracts

**DATABASE SPECIALIST REQUIREMENTS:**

**CRITICAL DATABASE VALIDATIONS:**
□ Verify `@neondatabase/serverless` is in package.json (the ONLY database package allowed)
□ NEVER use pg, mysql2, sqlite3, or any other database drivers
□ Check existing database files in `/src/lib/` for connection patterns
□ Verify environment variables: NEON_DATABASE_URL (primary), DATABASE_URL (fallback)
□ Test existing database connections work before making any changes

**SPECIFIC TASK:** Create comprehensive database health verification tests that validate connection, schema, and performance for the Robot Brain production system.

**DELIVERABLES:**
1. Database health check service using @neondatabase/serverless exclusively
2. Integration tests with actual database connectivity
3. Proof of build success: npm run build output
4. Proof of test success: npm test output for database tests
5. Verification that existing API routes continue working

Remember: Any failure of npm run build or existing tests = immediate stop and escalation.
```

---

## 📊 Success Metrics

### Immediate Improvements Expected:
- **100% Build Success Rate**: No more build-breaking agent commits
- **95%+ Test Pass Rate**: Tests work on first attempt
- **Zero Package Conflicts**: Correct package usage every time
- **100% Process Compliance**: All agents follow their checklists

### Measurement Method:
Track each agent task with:
```
TASK ID: [unique identifier]
AGENT TYPE: [specialist type]
PROCESS COMPLIANCE SCORE: ___/100
BUILD SUCCESS: ✅/❌
TEST SUCCESS: ___/__ tests passing
INTEGRATION SUCCESS: ✅/❌
REWORK REQUIRED: ✅/❌
```

---

## 🔄 Next Steps

1. **✅ COMPLETED**: Universal Agent Standards created
2. **✅ COMPLETED**: Agent-Specific Requirements defined  
3. **✅ COMPLETED**: Enhanced Prompt Templates created
4. **✅ COMPLETED**: Quality Enforcement Framework established
5. **⏳ IN PROGRESS**: Test with current database error fix
6. **⏳ PENDING**: Validate with additional agent tasks
7. **⏳ PENDING**: Refine processes based on results

---

**Version**: 1.0  
**Last Updated**: August 6, 2025  
**Ready for immediate implementation**