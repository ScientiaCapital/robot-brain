# Multi-Phase Validation Protocol

**CRITICAL RULE**: NO OpenAI models - Use Anthropic Claude, Google Gemini, or OpenRouter only

## Project: Robot Friend (Kids AI Chat)
**Tech Stack**: Next.js 15, Supabase, Anthropic Claude, Cartesia voice, OpenRouter
**Test Command**: `npm test`
**Location**: `/Users/tmkipper/Desktop/tk_projects/robot-brain`

---

## Phase 1: Pre-Commit Validation
**When**: Before every git commit
**Duration**: 2-5 minutes

### Required Checks
```bash
# 1. Type safety
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit tests
npm test

# 4. Build verification
npm run build
```

### Critical Validations
- [ ] No OpenAI imports (`import { OpenAI }` forbidden)
- [ ] No hardcoded API keys (check .env usage)
- [ ] Kids-safe content validation active
- [ ] Voice synthesis (Cartesia) configured
- [ ] Supabase connection verified

### Auto-Fix Available
```bash
npm run lint:fix
npm run format
```

---

## Phase 2: Feature Validation
**When**: After implementing a feature
**Duration**: 5-10 minutes

### Functional Tests
```bash
# Run feature-specific tests
npm test -- --testPathPattern=<feature>

# Integration tests
npm run test:integration

# E2E tests (if available)
npm run test:e2e
```

### Manual Checks
- [ ] Kids-friendly language validation
- [ ] Voice response timing (< 3s latency)
- [ ] Mobile responsiveness
- [ ] Anthropic Claude API usage confirmed
- [ ] OpenRouter fallback working

### Kids-Safety Checklist
- [ ] No inappropriate content generation
- [ ] Parent dashboard functional
- [ ] Session time limits enforced
- [ ] Content filtering active

---

## Phase 3: Pre-PR Validation
**When**: Before creating pull request
**Duration**: 10-15 minutes

### Comprehensive Tests
```bash
# Full test suite
npm test -- --coverage

# Performance benchmarks
npm run benchmark

# Accessibility audit
npm run test:a11y

# Security scan
npm audit
```

### Code Quality
- [ ] Test coverage > 80%
- [ ] No critical vulnerabilities
- [ ] TypeScript strict mode passing
- [ ] No console.logs in production code

### AI Model Verification
- [ ] Anthropic Claude used (not OpenAI)
- [ ] Model: claude-3-5-sonnet-20241022 or newer
- [ ] API costs within budget (<$0.01/interaction)
- [ ] Rate limiting implemented

---

## Phase 4: Deployment Validation
**When**: Before production deploy
**Duration**: 15-20 minutes

### Pre-Deploy Checklist
```bash
# Production build
npm run build

# Start production server locally
npm start

# Smoke tests
npm run test:smoke
```

### Environment Verification
- [ ] `ANTHROPIC_API_KEY` set (not `OPENAI_API_KEY`)
- [ ] `CARTESIA_API_KEY` configured
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` set
- [ ] `NEXT_PUBLIC_*` vars for client-side
- [ ] No `.env` file in build output

### Critical Path Testing
1. User login flow
2. Chat message with voice response
3. Parent controls access
4. Session timeout
5. Error handling (network, API)

---

## Phase 5: Post-Deploy Validation
**When**: Immediately after deployment
**Duration**: 10 minutes

### Live Checks
```bash
# Health check
curl https://robot-friend.vercel.app/api/health

# Synthetic monitoring
npm run monitor:production
```

### Real User Monitoring
- [ ] Response times < 2s (p95)
- [ ] Error rate < 0.1%
- [ ] Voice synthesis working
- [ ] Anthropic API responding
- [ ] No OpenAI calls detected in logs

### Rollback Criteria
- Error rate > 1%
- Response time > 5s
- Kids-safety filter failing
- API costs spiking

---

## Phase 6: Monitoring & Alerts
**When**: Continuous
**Setup**: Vercel Analytics + Supabase Logs

### Key Metrics
- **Latency**: Chat response < 2s, Voice < 3s
- **Errors**: < 0.1% error rate
- **Costs**: < $50/month Anthropic API
- **Usage**: Active kids sessions

### Alert Thresholds
```yaml
critical:
  - error_rate > 1%
  - response_time > 5s
  - api_cost > $100/day

warning:
  - error_rate > 0.5%
  - response_time > 3s
  - api_cost > $50/day
```

### Weekly Review
- [ ] Check Anthropic API usage
- [ ] Review kids-safety incidents
- [ ] Analyze voice quality feedback
- [ ] Verify no OpenAI usage

---

## AI Model Compliance

### Approved Models
- **Primary**: Anthropic Claude (claude-3-5-sonnet-20241022)
- **Fallback**: OpenRouter (anthropic/claude-3-5-sonnet)
- **Voice**: Cartesia TTS

### Forbidden
- ❌ OpenAI GPT-3.5/4/4o
- ❌ OpenAI Whisper (use alternatives)
- ❌ Any OpenAI product

### Verification Command
```bash
# Check for OpenAI usage
grep -r "openai" ui/src --include="*.ts" --include="*.tsx"
grep -r "OPENAI" .env*

# Should return NO results
```

---

## Emergency Procedures

### If OpenAI Detected
1. Stop deployment immediately
2. Revert to last known good version
3. Remove all OpenAI imports/configs
4. Replace with Anthropic Claude
5. Re-run full validation

### If Kids-Safety Issue
1. Enable maintenance mode
2. Disable chat features
3. Review conversation logs
4. Fix content filters
5. Test with kids-safety team

---

## Quick Reference

| Phase | When | Duration | Command |
|-------|------|----------|---------|
| Pre-Commit | Every commit | 2-5 min | `npm run validate` |
| Feature | After feature | 5-10 min | `npm test -- <feature>` |
| Pre-PR | Before PR | 10-15 min | `npm test -- --coverage` |
| Pre-Deploy | Before deploy | 15-20 min | `npm run build && npm start` |
| Post-Deploy | After deploy | 10 min | `npm run monitor:production` |
| Monitoring | Continuous | N/A | Vercel Analytics |

**Remember**: Kids safety first. No OpenAI. Anthropic Claude only.
