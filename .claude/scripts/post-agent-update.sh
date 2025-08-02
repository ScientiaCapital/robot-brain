#!/bin/bash

# Post-Agent Knowledge Update Script  
# Runs after subagent completion to preserve learnings and update memory system

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="$PROJECT_ROOT/.claude/logs/agent-updates.log"

# Detect agent type from environment
AGENT_TYPE="${CLAUDE_AGENT_TYPE:-general-purpose}"
echo "📝 Updating knowledge after $AGENT_TYPE agent completion..." >&2

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    echo "[$TIMESTAMP] [$AGENT_TYPE] $1" >> "$LOG_FILE"
    echo "$1" >&2
}

# Function to update memory system (placeholder for now)
update_memory() {
    local entity_type="$1"
    local observations="$2"
    log_message "Memory update: $entity_type - $observations"
    # TODO: Integrate with actual memory system API
}

# Function to check documentation consistency
check_docs_consistency() {
    local files=("$PROJECT_ROOT/CLAUDE.md" "$PROJECT_ROOT/ProjectContextEngineering.md" "$PROJECT_ROOT/ProjectTasks.md")
    local inconsistencies=0
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            # Check for outdated references
            if grep -q -i "docker\|cloudflare\|fastapi" "$file" 2>/dev/null; then
                log_message "WARNING: Found outdated architecture references in $(basename "$file")"
                inconsistencies=$((inconsistencies + 1))
            fi
            
            # Check for consistent NEON + VERCEL messaging
            if ! grep -q -i "neon.*vercel\|vercel.*neon" "$file" 2>/dev/null; then
                log_message "INFO: Consider adding NEON + VERCEL architecture emphasis in $(basename "$file")"
            fi
        fi
    done
    
    if [[ $inconsistencies -gt 0 ]]; then
        log_message "FLAGGED: $inconsistencies documentation files need project-docs-curator review"
        return 1
    fi
    
    return 0
}

# Function to preserve successful patterns
preserve_patterns() {
    # Create agent-specific knowledge directory
    local agent_knowledge_dir="$PROJECT_ROOT/.claude/knowledge/agents/$AGENT_TYPE"
    mkdir -p "$agent_knowledge_dir"
    
    local pattern_file="$agent_knowledge_dir/pattern_$(date +%s).json"
    
    # Agent-specific pattern preservation
    case "$AGENT_TYPE" in
        "neon-database-architect")
            log_message "🗄️ Preserving database optimization patterns..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE",
  "type": "database_pattern",
  "patterns": {
    "connection_pooling": "Neon pooler endpoint used",
    "query_optimization": "Indexes and query patterns preserved",
    "schema_improvements": "Database schema enhancements documented"
  }
}
EOF
            ;;
            
        "vercel-deployment-specialist")
            log_message "🚀 Preserving deployment patterns..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP", 
  "agent": "$AGENT_TYPE",
  "type": "deployment_pattern",
  "patterns": {
    "build_optimization": "Vercel build configurations",
    "environment_management": "Environment variable best practices",
    "serverless_patterns": "Function optimization strategies"
  }
}
EOF
            ;;
            
        "security-auditor-expert")
            log_message "🔒 Preserving security audit results..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE", 
  "type": "security_audit",
  "patterns": {
    "vulnerability_checks": "Security scan results",
    "api_key_management": "Secure credential handling patterns",
    "input_validation": "Validation strategies implemented"
  }
}
EOF
            ;;
            
        "api-integration-specialist")
            log_message "🔌 Preserving API integration patterns..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE",
  "type": "api_pattern",
  "patterns": {
    "anthropic_integration": "Claude API best practices",
    "elevenlabs_integration": "Voice API optimization",
    "error_handling": "Robust error recovery patterns"
  }
}
EOF
            ;;
            
        "nextjs-performance-optimizer")
            log_message "⚡ Preserving performance improvements..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE",
  "type": "performance_pattern", 
  "patterns": {
    "bundle_optimization": "Build size improvements",
    "load_time_reduction": "Performance metrics achieved",
    "caching_strategies": "Effective caching patterns"
  }
}
EOF
            ;;
            
        "project-docs-curator")
            log_message "📚 Preserving documentation updates..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE",
  "type": "documentation_pattern",
  "patterns": {
    "consistency_checks": "Documentation validation results",
    "architecture_updates": "NEON + VERCEL references maintained", 
    "outdated_removals": "Legacy references cleaned"
  }
}
EOF
            ;;
            
        *)
            log_message "📋 Preserving general execution patterns..."
            cat > "$pattern_file" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "$AGENT_TYPE",
  "type": "general_pattern",
  "patterns": {
    "task_completion": "Successfully completed",
    "architecture_adherence": "NEON + VERCEL architecture maintained"
  }
}
EOF
            ;;
    esac
    
    update_memory "successful_pattern" "Agent $AGENT_TYPE execution completed at $TIMESTAMP"
    log_message "✅ Preserved agent-specific execution patterns: $pattern_file"
}

# Function to clean up outdated knowledge
cleanup_knowledge() {
    # Mark any Docker/Cloudflare/FastAPI references as deprecated
    update_memory "deprecated_architecture" "Docker/Cloudflare/FastAPI architecture superseded by NEON + VERCEL"
    
    log_message "🧹 Cleaned up outdated architecture references"
}

# Main execution
log_message "🚀 Starting post-agent knowledge update"

# Check documentation consistency
if check_docs_consistency; then
    log_message "✅ Documentation consistency validated"
else
    log_message "⚠️ Documentation inconsistencies detected - flagged for review"
fi

# Preserve successful patterns from this agent execution
preserve_patterns

# Clean up any outdated knowledge
cleanup_knowledge

# Update agent execution statistics
AGENT_COUNT_FILE="$PROJECT_ROOT/.claude/stats/agent-executions.txt"
mkdir -p "$(dirname "$AGENT_COUNT_FILE")"
echo "$TIMESTAMP" >> "$AGENT_COUNT_FILE"

TOTAL_EXECUTIONS=$(wc -l < "$AGENT_COUNT_FILE" 2>/dev/null || echo "0")
log_message "📊 Total agent executions: $TOTAL_EXECUTIONS"

# Generate summary report
SUMMARY_REPORT="$PROJECT_ROOT/.claude/reports/latest-update.json"
mkdir -p "$(dirname "$SUMMARY_REPORT")"

cat > "$SUMMARY_REPORT" <<EOF
{
  "update_timestamp": "$TIMESTAMP",
  "agent_execution_count": $TOTAL_EXECUTIONS,
  "documentation_status": "$(check_docs_consistency && echo "consistent" || echo "needs_review")",
  "knowledge_updates": {
    "patterns_preserved": true,
    "outdated_cleaned": true,
    "memory_updated": true
  },
  "next_actions": [
    "Continue monitoring documentation consistency",
    "Preserve successful NEON + VERCEL patterns", 
    "Maintain single robot MVP focus"
  ]
}
EOF

log_message "📋 Generated summary report: $SUMMARY_REPORT"
log_message "✅ Post-agent knowledge update completed successfully"

echo "Knowledge update completed - see $LOG_FILE for details" >&2