# Agent-Specific Requirements and Lockdown Procedures

## 🎯 Purpose
This document provides specialized requirements for each agent type to prevent domain-specific errors and ensure expertise-focused quality.

---

## 🗄️ neon-database-architect

### Mandatory Pre-Work Checklist
- [ ] Verify `@neondatabase/serverless` is the ONLY database package available
- [ ] Check existing database connection files in `/src/lib/` for patterns
- [ ] Verify environment variable names: `NEON_DATABASE_URL` (primary), `DATABASE_URL` (fallback)
- [ ] Test existing database connections work before modifying anything
- [ ] Review existing database schemas and table structures

### Implementation Requirements
- [ ] Use ONLY `@neondatabase/serverless` package (NEVER pg, mysql2, sqlite3, etc.)
- [ ] Follow existing connection pooling patterns exactly
- [ ] Use existing query execution patterns and error handling
- [ ] Integrate with existing API routes without breaking them
- [ ] Test actual database connectivity with real queries

### Database-Specific Validation
- [ ] Every database service extends existing connection patterns
- [ ] Every query uses the established connection methods
- [ ] All database operations handle scale-to-zero wake-up properly
- [ ] Connection pooling configured for serverless environment
- [ ] SSL/TLS settings match Neon requirements

### Completion Criteria
- [ ] Database health endpoint returns successful connection
- [ ] All existing database-dependent API routes continue working
- [ ] Integration tests pass with actual database
- [ ] Query performance meets established benchmarks (< 100ms for simple queries)

---

## ⚛️ react-performance-engineer

### Architecture Compliance Checklist
- [ ] Verify exact React version: 19.1.0
- [ ] Verify exact Next.js version: 15.4.5  
- [ ] Check existing component library: Radix UI + Tailwind CSS + Framer Motion
- [ ] Review existing performance monitoring tools and patterns
- [ ] Baseline current performance metrics before making changes

### Performance Requirements
- [ ] Maintain 75ms TTS latency requirement (critical performance threshold)
- [ ] Bundle size must not increase beyond current thresholds
- [ ] Existing user journeys must maintain current performance levels
- [ ] Mobile performance impact must be neutral or positive
- [ ] Memory usage must not increase beyond current levels

### Component Safety Protocol
- [ ] Test every performance change in isolation first
- [ ] Verify existing components continue functioning after changes
- [ ] Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility features must not be impacted by optimizations
- [ ] SEO metrics must not degrade

### Optimization Validation
- [ ] Document performance improvement metrics with before/after comparisons
- [ ] Create rollback plan for each optimization implemented
- [ ] Test under various network conditions (slow 3G, WiFi)
- [ ] Validate that Core Web Vitals remain within acceptable ranges

---

## 🔌 typescript-api-specialist

### TypeScript Compliance Checklist
- [ ] Verify TypeScript strict mode is enabled and maintained
- [ ] Check existing API route patterns in `/src/app/api/*`
- [ ] Review existing type definitions and interfaces
- [ ] Verify Zod validation schemas match existing patterns
- [ ] Check existing error handling and response formats

### API Integration Requirements
- [ ] Zero `any` types allowed without explicit justification and documentation
- [ ] All interfaces must extend or be compatible with existing patterns
- [ ] New API routes must follow existing authentication/authorization patterns
- [ ] Response formats must match established frontend expectations
- [ ] Error handling must be consistent with existing error types

### Integration Validation
- [ ] Test new APIs work with existing frontend components
- [ ] Verify middleware compatibility and execution order
- [ ] Ensure rate limiting doesn't conflict with existing endpoints
- [ ] Validate CORS settings work with existing frontend requests
- [ ] Test error scenarios and ensure proper error propagation

### Type Safety Enforcement
- [ ] All function parameters properly typed
- [ ] Return types explicitly defined for all functions
- [ ] Generic types used appropriately for reusable components
- [ ] Union types preferred over any for flexible parameters

---

## 🤖 ai-integration-engineer

### Service Integration Validation
- [ ] Verify existing Anthropic Claude integration patterns
- [ ] Check ElevenLabs TTS configuration and voice settings
- [ ] Test existing voice pipeline functionality before changes
- [ ] Validate conversation storage integration with database
- [ ] Review existing AI service error handling patterns

### API Connectivity Testing
- [ ] Test actual API calls with real credentials (not mocked)
- [ ] Verify rate limiting compliance for both services
- [ ] Check error handling for service outages and timeouts
- [ ] Validate response time requirements (75ms TTS latency)
- [ ] Test concurrent request handling

### Production Readiness Protocol
- [ ] Test with actual production environment variables
- [ ] Verify no API keys exposed in client-side code
- [ ] Check conversation persistence works correctly end-to-end
- [ ] Validate voice quality meets production standards
- [ ] Test failover scenarios when services are unavailable

### AI Service Compliance
- [ ] Anthropic Claude: 100 token limit, 0.3 temperature settings maintained
- [ ] ElevenLabs: eleven_flash_v2_5 model, Rachel voice (21m00Tcm4TlvDq8ikWAM)
- [ ] Speech recognition: Browser Web Speech API integration
- [ ] Conversation flow: Text → Claude → TTS → Audio pipeline

---

## 🧪 mvp-testing-strategist

### Test Framework Compliance
- [ ] Use existing Jest configuration without modifications
- [ ] Follow existing test file naming patterns (`*.test.ts`, `*.test.tsx`)
- [ ] Verify `@testing-library/react` compatibility with React 19.1.0
- [ ] Check existing mock patterns and extend consistently
- [ ] Review existing test utilities and helper functions

### TDD Process Enforcement
- [ ] **RED**: Write failing test, run `npm test`, confirm failure with expected message
- [ ] **GREEN**: Write minimal code to pass, run `npm test`, confirm success
- [ ] **REFACTOR**: Improve code, run `npm test`, confirm tests still pass
- [ ] **INTEGRATION**: Run full test suite, fix any breakages immediately

### Quality Gates Protocol
- [ ] All new tests must pass consistently (no flaky tests)
- [ ] Existing tests must continue passing without modification
- [ ] Test coverage must be maintained or improved
- [ ] No test files should have skipped or pending tests without justification
- [ ] Performance tests must not introduce significant slowdowns

### Test Architecture Requirements
- [ ] Unit tests for individual components and functions
- [ ] Integration tests for API endpoints and database operations
- [ ] End-to-end tests for critical user journeys
- [ ] Performance tests for latency-sensitive operations (TTS, API calls)

---

## ⚙️ github-workflow-automator

### Pipeline Safety Checklist
- [ ] Verify existing Vercel deployment configuration
- [ ] Check current GitHub Actions workflows and compatibility
- [ ] Test workflow changes in separate branch before merging
- [ ] Validate environment variable handling in CI/CD
- [ ] Review existing deployment hooks and integrations

### Deployment Validation
- [ ] Ensure production deployments remain stable during changes
- [ ] Verify rollback procedures function correctly
- [ ] Test automated testing pipeline integration
- [ ] Check monitoring and alerting systems continue working
- [ ] Validate preview deployments work for all pull requests

### Zero Downtime Requirements
- [ ] No changes that could cause deployment failures
- [ ] Gradual rollout strategies documented for major changes
- [ ] Comprehensive testing in staging environment before production
- [ ] Emergency rollback procedures documented and tested
- [ ] Health checks and monitoring remain functional throughout changes

### CI/CD Integration Protocol
- [ ] Build pipeline must complete successfully for all changes
- [ ] Test pipeline must pass all existing and new tests
- [ ] Security scanning must pass without new vulnerabilities
- [ ] Performance benchmarks must not regress
- [ ] Deployment notifications work correctly

---

## 🌐 general-purpose (Coordinators)

### Coordination Responsibilities
- [ ] Verify all specialists follow their respective process checklists
- [ ] Run integration tests after each specialist completes work
- [ ] Coordinate cross-agent dependencies and communication
- [ ] Escalate immediately when any agent fails their process requirements
- [ ] Maintain overall project timeline and quality standards

### System Integration Validation
- [ ] Full system build test after all agents complete their work
- [ ] End-to-end user journey testing across all components
- [ ] Performance regression testing for the complete system
- [ ] Security validation across all new and modified components
- [ ] Cross-browser and device compatibility validation

### Quality Assurance Protocol
- [ ] Code review equivalent for all agent outputs
- [ ] Documentation updates coordinated across all agents
- [ ] Knowledge base updates with new patterns and solutions
- [ ] Lessons learned capture for continuous process improvement
- [ ] Agent performance metrics tracking and reporting

### Escalation and Recovery Management
- [ ] Identify and resolve conflicts between specialist requirements
- [ ] Coordinate rollback procedures when multiple agents' work conflicts
- [ ] Manage communication between agents for complex integrations
- [ ] Ensure Agent Reliability Guardrails System validation for all work

---

## 📋 Cross-Agent Integration Requirements

### When Multiple Agents Work Together
- [ ] Define clear interfaces and contracts between agent responsibilities
- [ ] Test integration points thoroughly before claiming completion
- [ ] Coordinate environment variable usage and naming conventions
- [ ] Ensure error handling is consistent across all integrated components
- [ ] Validate that the complete workflow functions end-to-end

### Conflict Resolution Protocol
- [ ] Document any conflicts between agent requirements
- [ ] Escalate conflicts to general-purpose coordinator immediately  
- [ ] Test alternative approaches collaboratively
- [ ] Choose solutions that maintain highest overall system quality
- [ ] Update documentation to prevent similar conflicts in future

---

**Version**: 1.0  
**Last Updated**: August 6, 2025  
**Next Review**: After validation with real agent tasks