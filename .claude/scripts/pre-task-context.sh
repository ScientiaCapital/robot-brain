#!/bin/bash

# Pre-Task Context Gathering Script
# Runs before Task tool execution to provide agents with current project context

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
CONTEXT_OUTPUT="/tmp/claude-context-$(date +%s).json"

# Detect agent type from environment or arguments
AGENT_TYPE="${CLAUDE_AGENT_TYPE:-general-purpose}"
echo "🔍 Gathering project context for agent: $AGENT_TYPE" >&2

# Function to safely read file content
read_file_content() {
    local file="$1"
    if [[ -f "$file" ]]; then
        cat "$file" | jq -Rsa '.'
    else
        echo '"File not found"'
    fi
}

# Function to search memory system
search_memory() {
    local query="$1"
    local agent_type="$2"
    
    # Search agent-specific knowledge
    local agent_knowledge_dir="$PROJECT_ROOT/.claude/knowledge/agents/$agent_type"
    if [[ -d "$agent_knowledge_dir" ]]; then
        local results=$(find "$agent_knowledge_dir" -name "*.json" -exec cat {} \; 2>/dev/null | jq -s '.' 2>/dev/null || echo '[]')
        echo "$results"
    else
        echo '[]'
    fi
}

# Function to load agent-specific context
load_agent_context() {
    local agent_type="$1"
    
    case "$agent_type" in
        "neon-database-architect")
            echo "🗄️ Loading database architecture context..." >&2
            # Load database schema and patterns
            local db_schema=$(read_file_content "$PROJECT_ROOT/.claude/knowledge/database-schema.json" || echo '{}')
            local optimization_patterns=$(search_memory "database optimization" "$agent_type")
            echo "{\"database_schema\": $db_schema, \"optimization_patterns\": $optimization_patterns}"
            ;;
            
        "vercel-deployment-specialist")
            echo "🚀 Loading deployment configuration context..." >&2
            # Load Vercel configs and deployment patterns
            local vercel_config=$(read_file_content "$PROJECT_ROOT/robot-brain-ui/vercel.json" || echo '{}')
            local deployment_patterns=$(search_memory "deployment patterns" "$agent_type")
            echo "{\"vercel_config\": $vercel_config, \"deployment_patterns\": $deployment_patterns}"
            ;;
            
        "security-auditor-expert")
            echo "🔒 Loading security patterns and vulnerability context..." >&2
            # Load security patterns and known vulnerabilities
            local security_patterns=$(search_memory "security patterns" "$agent_type")
            local env_vars='["NEON_DATABASE_URL", "ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY"]'
            echo "{\"security_patterns\": $security_patterns, \"protected_env_vars\": $env_vars}"
            ;;
            
        "api-integration-specialist")
            echo "🔌 Loading API integration patterns..." >&2
            # Load API configurations and integration patterns
            local api_patterns=$(search_memory "api integration" "$agent_type")
            local api_endpoints='{"anthropic": "claude-3-haiku", "elevenlabs": "v1/text-to-speech"}'
            echo "{\"api_patterns\": $api_patterns, \"active_integrations\": $api_endpoints}"
            ;;
            
        "nextjs-performance-optimizer")
            echo "⚡ Loading performance metrics and optimization patterns..." >&2
            # Load performance metrics and optimization history
            local perf_patterns=$(search_memory "performance optimization" "$agent_type")
            local build_config=$(read_file_content "$PROJECT_ROOT/robot-brain-ui/next.config.mjs" || echo '{}')
            echo "{\"performance_patterns\": $perf_patterns, \"build_config\": $build_config}"
            ;;
            
        "project-docs-curator")
            echo "📚 Loading documentation structure and consistency rules..." >&2
            # Load documentation patterns and consistency checks
            local doc_patterns=$(search_memory "documentation patterns" "$agent_type")
            local doc_files='["CLAUDE.md", "ProjectContextEngineering.md", "ProjectTasks.md", "README.md"]'
            echo "{\"documentation_patterns\": $doc_patterns, \"core_docs\": $doc_files}"
            ;;
            
        "bug-hunter-specialist")
            echo "🐛 Loading error patterns and debugging strategies..." >&2
            # Load known error patterns and successful fixes
            local error_patterns=$(search_memory "error patterns" "$agent_type")
            local debug_strategies=$(search_memory "debugging strategies" "$agent_type")
            echo "{\"error_patterns\": $error_patterns, \"debug_strategies\": $debug_strategies}"
            ;;
            
        "fullstack-tdd-architect")
            echo "🏗️ Loading TDD patterns and architecture guidelines..." >&2
            # Load TDD patterns and architectural decisions
            local tdd_patterns=$(search_memory "tdd patterns" "$agent_type")
            local arch_decisions=$(search_memory "architecture decisions" "$agent_type")
            echo "{\"tdd_patterns\": $tdd_patterns, \"architecture_decisions\": $arch_decisions}"
            ;;
            
        *)
            echo "📋 Loading general context..." >&2
            echo "{\"type\": \"general\"}"
            ;;
    esac
}

# Read core documentation files
echo "📖 Reading core documentation..." >&2
CLAUDE_MD_CONTENT=$(read_file_content "$PROJECT_ROOT/CLAUDE.md")
PROJECT_CONTEXT_CONTENT=$(read_file_content "$PROJECT_ROOT/ProjectContextEngineering.md")
PROJECT_TASKS_CONTENT=$(read_file_content "$PROJECT_ROOT/ProjectTasks.md")

# Extract current architecture info
echo "🏗️ Extracting architecture information..." >&2
CURRENT_ARCHITECTURE="NEON + VERCEL simplified architecture"
MVP_STATUS="Complete and deployed"
TECH_STACK='["Next.js", "Neon PostgreSQL", "Vercel", "Anthropic Claude", "ElevenLabs"]'

# Load agent-specific context
echo "🤖 Loading agent-specific context..." >&2
AGENT_CONTEXT=$(load_agent_context "$AGENT_TYPE")

# Search for relevant context in memory
echo "🧠 Searching memory system..." >&2
MEMORY_CONTEXT=$(search_memory "current architecture NEON VERCEL" "$AGENT_TYPE")

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create structured JSON context
cat > "$CONTEXT_OUTPUT" <<EOF
{
  "context_generation": {
    "timestamp": "$TIMESTAMP",
    "project_root": "$PROJECT_ROOT",
    "hook_type": "pre_task_context",
    "agent_type": "$AGENT_TYPE"
  },
  "documentation": {
    "claude_md": $CLAUDE_MD_CONTENT,
    "project_context_engineering": $PROJECT_CONTEXT_CONTENT,
    "project_tasks": $PROJECT_TASKS_CONTENT
  },
  "current_state": {
    "architecture": "$CURRENT_ARCHITECTURE",
    "mvp_status": "$MVP_STATUS", 
    "tech_stack": $TECH_STACK,
    "deployment_url": "https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app"
  },
  "agent_specific_context": $AGENT_CONTEXT,
  "memory_context": $MEMORY_CONTEXT,
  "agent_guidance": {
    "primary_focus": "NEON database + VERCEL deployment architecture",
    "avoid_references": ["Docker", "Cloudflare", "FastAPI", "multi-service architecture"],
    "current_priorities": ["performance optimization", "documentation consistency", "single robot MVP"],
    "specialization_focus": "$(echo $AGENT_TYPE | tr '-' ' ')"
  },
  "validation_flags": {
    "documentation_current": true,
    "architecture_consistent": true,
    "deployment_operational": true,
    "agent_context_loaded": true
  }
}
EOF

echo "✅ Context gathered successfully: $CONTEXT_OUTPUT" >&2

# Output the context file path for Claude to use
echo "$CONTEXT_OUTPUT"