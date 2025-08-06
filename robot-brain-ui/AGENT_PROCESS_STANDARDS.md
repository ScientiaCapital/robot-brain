# Agent Process Standards - Universal Requirements

## 🎯 Purpose
This document establishes mandatory standards for ALL agents working on the Robot Brain project to prevent code incompatibility, build failures, and technical debt.

## 🚨 Universal Pre-Work Validation Checklist

**EVERY agent MUST complete these steps before starting ANY work:**

### 1. Context Understanding
- [ ] Read and understand `/robot-brain/CLAUDE.md` completely
- [ ] Read and understand `/robot-brain/ProjectContextEngineering.md` 
- [ ] Read and understand `/robot-brain/ProjectTasks.md`
- [ ] Review project memory and existing context

### 2. Architecture Validation
- [ ] Read `package.json` to identify EXACT dependencies available
- [ ] Check existing code patterns in relevant directories
- [ ] Identify existing environment variable naming conventions
- [ ] Verify current build state: run `npm run build` and confirm success

### 3. Tool and Resource Identification
- [ ] List all available MCP tools relevant to your specialization
- [ ] Identify Context7 resources needed for your domain
- [ ] Check existing API endpoints and integration patterns
- [ ] Verify access to required environment variables

## 🔴 TDD Methodology Enforcement

**ALL agents MUST follow this exact TDD process:**

### RED Phase Requirements
- [ ] Write failing tests that specify expected behavior
- [ ] Run tests to confirm they fail with expected error messages
- [ ] Document what needs to be implemented to make tests pass
- [ ] NO implementation code during RED phase

### GREEN Phase Requirements  
- [ ] Write ONLY the minimum code necessary to make tests pass
- [ ] Run tests after each small change to verify progress
- [ ] Ensure all new tests pass without breaking existing tests
- [ ] Run `npm run build` to verify no compilation errors

### REFACTOR Phase Requirements
- [ ] Improve code quality while maintaining test success
- [ ] Run full test suite after each refactoring change
- [ ] Optimize performance without changing functionality
- [ ] Update documentation and comments as needed

## ✅ Universal Completion Criteria

**NO agent can claim completion without meeting ALL these requirements:**

### Build Verification
- [ ] `npm run build` succeeds with ZERO errors
- [ ] Zero TypeScript compilation errors
- [ ] All new code follows existing architectural patterns
- [ ] No build warnings without explicit justification

### Test Verification
- [ ] All newly created tests pass consistently
- [ ] All existing tests continue to pass
- [ ] No flaky or intermittent test failures introduced
- [ ] Test coverage maintained or improved

### Integration Verification
- [ ] New code integrates properly with existing functionality
- [ ] No breaking changes to existing API contracts
- [ ] Environment variables used correctly
- [ ] Security best practices followed (no exposed secrets)

### Documentation Verification
- [ ] Any new patterns documented for future agents
- [ ] Complex implementations explained in code comments
- [ ] Changes reflected in relevant documentation files
- [ ] Knowledge base updated with lessons learned

## 🚫 Prohibited Actions

**NEVER do these things:**

### Package and Dependency Violations
- ❌ Never assume a package is available - always check package.json first
- ❌ Never install new packages without explicit approval
- ❌ Never use incompatible package versions
- ❌ Never mix different database drivers (only @neondatabase/serverless)

### Architecture Violations
- ❌ Never create new patterns when existing ones work
- ❌ Never ignore existing error handling patterns  
- ❌ Never break existing API contracts
- ❌ Never expose API keys or secrets in client-side code

### Process Violations
- ❌ Never claim completion without running build verification
- ❌ Never skip TDD phases (RED-GREEN-REFACTOR)
- ❌ Never submit code that breaks existing functionality
- ❌ Never ignore failing tests or build errors

## 🆘 Failure Protocols

### Immediate Stop Conditions
**Stop work immediately and escalate if:**
- `npm run build` fails at any point
- Existing tests start failing after your changes
- You discover missing dependencies needed for your work
- Integration with existing code proves impossible

### Escalation Process
1. **Document the exact error** (build output, test results, etc.)
2. **Report what was attempted** and why it failed
3. **Request guidance** from coordinator agent
4. **Do not proceed** until issue is resolved

### Recovery Procedures
- **Revert changes** that caused build failures
- **Restore previous working state** before attempting fixes
- **Ask for architectural guidance** rather than guessing solutions
- **Collaborate with other agents** for complex integrations

## 📊 Success Metrics

**These metrics will be tracked for all agents:**

- **Build Success Rate**: Must be 100% (zero build-breaking commits)
- **Test Pass Rate**: Must be 95%+ on first attempt  
- **Package Compatibility**: Zero wrong package usage incidents
- **Integration Success**: 100% successful integrations with existing code
- **Rework Rate**: <5% of tasks requiring significant rework

## 🔄 Continuous Improvement

**This document will be updated based on:**
- Lessons learned from agent failures
- New architectural patterns adopted
- Tool and framework updates
- Performance optimization discoveries

---

**Version**: 1.0  
**Last Updated**: August 6, 2025  
**Next Review**: After every 10 agent tasks completed