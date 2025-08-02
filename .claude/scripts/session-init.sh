#!/bin/bash

# Session Initialization Script
# Runs on SessionStart to validate project state and prepare environment

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_LOG="$PROJECT_ROOT/.claude/logs/sessions.log"

echo "🚀 Initializing Claude Code session..." >&2

# Ensure required directories exist
mkdir -p "$PROJECT_ROOT/.claude/logs"
mkdir -p "$PROJECT_ROOT/.claude/reports"
mkdir -p "$PROJECT_ROOT/.claude/stats"
mkdir -p "$PROJECT_ROOT/.claude/cache"

# Function to log session events
log_session() {
    echo "[$TIMESTAMP] $1" >> "$SESSION_LOG"
    echo "$1" >&2
}

# Function to validate project structure
validate_project_structure() {
    local errors=0
    
    log_session "🔍 Validating project structure..."
    
    # Check for core files
    local required_files=(
        "CLAUDE.md"
        "ProjectContextEngineering.md" 
        "ProjectTasks.md"
        "robot-brain-ui/package.json"
        "robot-brain-ui/src/app/page.tsx"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            log_session "❌ Missing required file: $file"
            errors=$((errors + 1))
        else
            log_session "✅ Found: $file"
        fi
    done
    
    return $errors
}

# Function to check deployment status
check_deployment_status() {
    log_session "🌐 Checking deployment status..."
    
    local deployment_url="https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app"
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s --max-time 10 "$deployment_url" >/dev/null; then
            log_session "✅ Deployment accessible: $deployment_url"
            return 0
        else
            log_session "⚠️ Deployment check failed: $deployment_url"
            return 1
        fi
    else
        log_session "ℹ️ curl not available - skipping deployment check"
        return 0
    fi
}

# Function to validate environment
validate_environment() {
    log_session "🔧 Validating environment..."
    
    local env_file="$PROJECT_ROOT/robot-brain-ui/.env.local"
    local errors=0
    
    if [[ -f "$env_file" ]]; then
        # Check for required environment variables
        local required_vars=("NEON_DATABASE_URL" "ANTHROPIC_API_KEY" "ELEVENLABS_API_KEY")
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$env_file" 2>/dev/null; then
                log_session "✅ Environment variable configured: $var"
            else
                log_session "❌ Missing environment variable: $var"
                errors=$((errors + 1))
            fi
        done
    else
        log_session "⚠️ Environment file not found: $env_file"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Function to update session statistics
update_session_stats() {
    local session_count_file="$PROJECT_ROOT/.claude/stats/session-count.txt"
    echo "$TIMESTAMP" >> "$session_count_file"
    
    local total_sessions
    total_sessions=$(wc -l < "$session_count_file" 2>/dev/null || echo "0")
    
    log_session "📊 Session #$total_sessions started"
}

# Function to check for agent system readiness
check_agent_system() {
    log_session "🤖 Checking agent system readiness..."
    
    if [[ -f "$PROJECT_ROOT/.claude/settings.json" ]]; then
        log_session "✅ Agent hooks configured"
    else
        log_session "⚠️ Agent hooks not configured"
    fi
    
    # Check if scripts are executable
    local scripts_dir="$PROJECT_ROOT/.claude/scripts"
    if [[ -d "$scripts_dir" ]]; then
        local executable_scripts=0
        for script in "$scripts_dir"/*.sh; do
            if [[ -x "$script" ]]; then
                executable_scripts=$((executable_scripts + 1))
            fi
        done
        log_session "✅ $executable_scripts executable hook scripts found"
    else
        log_session "⚠️ Hook scripts directory not found"
    fi
}

# Main session initialization
log_session "🎯 Starting Robot Brain project session"

TOTAL_ERRORS=0

# Run all validation checks
validate_project_structure || TOTAL_ERRORS=$((TOTAL_ERRORS + $?))
check_deployment_status || TOTAL_ERRORS=$((TOTAL_ERRORS + $?))
validate_environment || TOTAL_ERRORS=$((TOTAL_ERRORS + $?))
check_agent_system

# Update statistics
update_session_stats

# Generate session report
SESSION_REPORT="$PROJECT_ROOT/.claude/reports/session-init.json"
cat > "$SESSION_REPORT" <<EOF
{
  "session_timestamp": "$TIMESTAMP",
  "project_root": "$PROJECT_ROOT",
  "validation_errors": $TOTAL_ERRORS,
  "project_status": "$([ $TOTAL_ERRORS -eq 0 ] && echo "ready" || echo "issues_detected")",
  "architecture": "NEON + VERCEL",
  "mvp_status": "deployed",
  "deployment_url": "https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app",
  "agent_system": "configured",
  "recommendations": [
    "Focus on NEON database + VERCEL deployment architecture",
    "Maintain single Robot Friend MVP",
    "Use specialized agents for specific tasks",
    "Keep documentation current and consistent"
  ]
}
EOF

if [[ $TOTAL_ERRORS -eq 0 ]]; then
    log_session "✅ Session initialized successfully - project ready for development"
else
    log_session "⚠️ Session initialized with $TOTAL_ERRORS issues detected"
fi

log_session "📋 Session report: $SESSION_REPORT"

echo "Session initialization complete - Robot Brain project ready! 🤖✨" >&2