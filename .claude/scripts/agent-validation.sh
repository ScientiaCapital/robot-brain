#!/bin/bash

# Agent-Specific Validation Script
# Performs specialized validation checks based on agent type

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
AGENT_TYPE="${CLAUDE_AGENT_TYPE:-general-purpose}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VALIDATION_LOG="$PROJECT_ROOT/.claude/logs/agent-validation.log"

# Ensure log directory exists
mkdir -p "$(dirname "$VALIDATION_LOG")"

# Function to log validation results
log_validation() {
    echo "[$TIMESTAMP] [$AGENT_TYPE] $1" >> "$VALIDATION_LOG"
    echo "$1" >&2
}

# Function to validate deployment health (for deployment specialist)
validate_deployment() {
    log_validation "🚀 Validating Vercel deployment health..."
    
    local deployment_url="https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app"
    local health_check_endpoint="$deployment_url/api/health"
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s --max-time 10 "$deployment_url" >/dev/null; then
            log_validation "✅ Deployment is accessible"
            return 0
        else
            log_validation "❌ Deployment health check failed"
            return 1
        fi
    else
        log_validation "⚠️ curl not available - skipping deployment validation"
        return 0
    fi
}

# Function to validate database connections (for database architect)
validate_database() {
    log_validation "🗄️ Validating Neon database configuration..."
    
    local env_file="$PROJECT_ROOT/robot-brain-ui/.env.local"
    
    if [[ -f "$env_file" ]]; then
        if grep -q "^NEON_DATABASE_URL=" "$env_file"; then
            log_validation "✅ Database connection string configured"
            
            # Check for required Neon parameters
            if grep -q "pooler.*neon.tech" "$env_file"; then
                log_validation "✅ Using Neon pooler endpoint (recommended)"
            else
                log_validation "⚠️ Not using pooler endpoint - consider optimization"
            fi
            
            if grep -q "sslmode=require" "$env_file"; then
                log_validation "✅ SSL mode enabled"
            else
                log_validation "❌ SSL mode not configured - security risk"
                return 1
            fi
        else
            log_validation "❌ Database connection not configured"
            return 1
        fi
    else
        log_validation "❌ Environment file not found"
        return 1
    fi
    
    return 0
}

# Function to validate security configuration (for security auditor)
validate_security() {
    log_validation "🔒 Performing security validation..."
    
    local env_file="$PROJECT_ROOT/robot-brain-ui/.env.local"
    local errors=0
    
    # Check for exposed secrets in code
    log_validation "🔍 Scanning for exposed secrets..."
    
    if find "$PROJECT_ROOT/robot-brain-ui/src" -name "*.ts" -o -name "*.tsx" -o -name "*.js" | \
       xargs grep -l "sk-\|sk_" 2>/dev/null | grep -v ".env"; then
        log_validation "❌ Found potential exposed API keys in code!"
        errors=$((errors + 1))
    else
        log_validation "✅ No exposed API keys found in code"
    fi
    
    # Check environment variable security
    if [[ -f "$env_file" ]]; then
        local perms=$(stat -f %A "$env_file" 2>/dev/null || stat -c %a "$env_file" 2>/dev/null)
        if [[ "$perms" -gt 600 ]]; then
            log_validation "⚠️ Environment file permissions too open: $perms"
            errors=$((errors + 1))
        else
            log_validation "✅ Environment file permissions secure"
        fi
    fi
    
    # Check for required security headers in API routes
    local api_files=$(find "$PROJECT_ROOT/robot-brain-ui/src/app/api" -name "route.ts" 2>/dev/null | wc -l)
    if [[ $api_files -gt 0 ]]; then
        log_validation "✅ Found $api_files API route files to audit"
    fi
    
    return $errors
}

# Function to validate API integrations (for API specialist)
validate_apis() {
    log_validation "🔌 Validating API integrations..."
    
    local env_file="$PROJECT_ROOT/robot-brain-ui/.env.local"
    local errors=0
    
    # Check required API keys
    local required_apis=("ANTHROPIC_API_KEY" "ELEVENLABS_API_KEY")
    
    for api_key in "${required_apis[@]}"; do
        if grep -q "^$api_key=" "$env_file" 2>/dev/null; then
            log_validation "✅ $api_key configured"
        else
            log_validation "❌ Missing $api_key"
            errors=$((errors + 1))
        fi
    done
    
    # Check API endpoint configurations
    local api_routes="$PROJECT_ROOT/robot-brain-ui/src/app/api"
    if [[ -d "$api_routes" ]]; then
        if [[ -f "$api_routes/chat/route.ts" ]]; then
            log_validation "✅ Chat API endpoint exists"
        else
            log_validation "❌ Chat API endpoint missing"
            errors=$((errors + 1))
        fi
        
        if [[ -f "$api_routes/voice/text-to-speech/route.ts" ]]; then
            log_validation "✅ Voice TTS endpoint exists"
        else
            log_validation "❌ Voice TTS endpoint missing"
            errors=$((errors + 1))
        fi
    fi
    
    return $errors
}

# Function to validate performance (for performance optimizer)
validate_performance() {
    log_validation "⚡ Validating performance configurations..."
    
    local next_config="$PROJECT_ROOT/robot-brain-ui/next.config.mjs"
    local package_json="$PROJECT_ROOT/robot-brain-ui/package.json"
    
    # Check for performance optimizations
    if [[ -f "$next_config" ]]; then
        log_validation "✅ Next.js configuration found"
        
        # Check for common optimizations
        if grep -q "images:" "$next_config"; then
            log_validation "✅ Image optimization configured"
        else
            log_validation "⚠️ Consider adding image optimization"
        fi
    else
        log_validation "⚠️ Next.js configuration not found"
    fi
    
    # Check build output
    local build_log="$PROJECT_ROOT/robot-brain-ui/.next/build-manifest.json"
    if [[ -f "$build_log" ]]; then
        log_validation "✅ Production build exists"
    else
        log_validation "⚠️ No production build found - run 'npm run build'"
    fi
    
    return 0
}

# Function to validate documentation (for docs curator)
validate_documentation() {
    log_validation "📚 Validating documentation consistency..."
    
    local core_docs=("CLAUDE.md" "ProjectContextEngineering.md" "ProjectTasks.md" "README.md")
    local errors=0
    
    for doc in "${core_docs[@]}"; do
        local doc_path="$PROJECT_ROOT/$doc"
        if [[ -f "$doc_path" ]]; then
            # Check for NEON + VERCEL references
            if grep -q -i "neon.*vercel\|vercel.*neon" "$doc_path"; then
                log_validation "✅ $doc contains NEON + VERCEL architecture"
            else
                log_validation "⚠️ $doc missing clear NEON + VERCEL reference"
                errors=$((errors + 1))
            fi
            
            # Check for outdated references
            if grep -q -i "docker\|cloudflare\|fastapi" "$doc_path"; then
                log_validation "❌ $doc contains outdated architecture references"
                errors=$((errors + 1))
            else
                log_validation "✅ $doc free of outdated references"
            fi
        else
            log_validation "❌ Missing required documentation: $doc"
            errors=$((errors + 1))
        fi
    done
    
    return $errors
}

# Main validation based on agent type
log_validation "🔍 Starting validation for $AGENT_TYPE agent"

VALIDATION_ERRORS=0

case "$AGENT_TYPE" in
    "vercel-deployment-specialist")
        validate_deployment || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        validate_apis || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    "neon-database-architect")
        validate_database || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    "security-auditor-expert")
        validate_security || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        validate_database || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    "api-integration-specialist")
        validate_apis || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    "nextjs-performance-optimizer")
        validate_performance || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        validate_deployment || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    "project-docs-curator")
        validate_documentation || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
        
    *)
        # General validation for all agents
        log_validation "📋 Performing general validation..."
        validate_deployment || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        validate_database || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
        ;;
esac

# Generate validation report
VALIDATION_REPORT="$PROJECT_ROOT/.claude/reports/agent-validation-${AGENT_TYPE}.json"
mkdir -p "$(dirname "$VALIDATION_REPORT")"

cat > "$VALIDATION_REPORT" <<EOF
{
  "validation_timestamp": "$TIMESTAMP",
  "agent_type": "$AGENT_TYPE",
  "total_errors": $VALIDATION_ERRORS,
  "status": "$([ $VALIDATION_ERRORS -eq 0 ] && echo "passed" || echo "failed")",
  "recommendations": {
    "neon-database-architect": "Ensure pooler endpoint and SSL configuration",
    "vercel-deployment-specialist": "Verify deployment health and environment variables",
    "security-auditor-expert": "Scan for exposed secrets and validate permissions",
    "api-integration-specialist": "Confirm all API keys and endpoints configured",
    "nextjs-performance-optimizer": "Check build optimizations and performance metrics",
    "project-docs-curator": "Maintain NEON + VERCEL architecture consistency"
  }
}
EOF

if [[ $VALIDATION_ERRORS -eq 0 ]]; then
    log_validation "✅ All validations passed for $AGENT_TYPE"
else
    log_validation "❌ $VALIDATION_ERRORS validation errors found for $AGENT_TYPE"
fi

exit $VALIDATION_ERRORS