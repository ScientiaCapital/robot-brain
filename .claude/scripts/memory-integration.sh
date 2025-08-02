#!/bin/bash

# Memory System Integration Script
# Provides functions for agents to interact with the Claude memory system

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
MEMORY_LOG="$PROJECT_ROOT/.claude/logs/memory-operations.log"

# Ensure log directory exists
mkdir -p "$(dirname "$MEMORY_LOG")"

# Function to log memory operations
log_memory() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$timestamp] $1" >> "$MEMORY_LOG"
    echo "Memory: $1" >&2
}

# Function to create knowledge entities
create_knowledge_entity() {
    local entity_name="$1"
    local entity_type="$2"
    local observations="$3"
    
    log_memory "Creating entity: $entity_name (type: $entity_type)"
    
    # This would integrate with the actual memory system API
    # For now, we'll create local knowledge files
    local knowledge_dir="$PROJECT_ROOT/.claude/knowledge"
    local entity_file="$knowledge_dir/${entity_type}/${entity_name}.json"
    
    mkdir -p "$(dirname "$entity_file")"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat > "$entity_file" <<EOF
{
  "name": "$entity_name",
  "type": "$entity_type", 
  "created": "$timestamp",
  "observations": $observations,
  "source": "agent_hook_system"
}
EOF
    
    log_memory "Entity created: $entity_file"
}

# Function to search existing knowledge
search_knowledge() {
    local query="$1"
    local knowledge_dir="$PROJECT_ROOT/.claude/knowledge"
    
    log_memory "Searching knowledge: $query"
    
    if [[ -d "$knowledge_dir" ]]; then
        # Simple grep-based search through knowledge files
        local results=$(find "$knowledge_dir" -name "*.json" -exec grep -l "$query" {} \; 2>/dev/null | head -5)
        
        if [[ -n "$results" ]]; then
            log_memory "Found $(echo "$results" | wc -l) knowledge matches"
            echo "$results"
        else
            log_memory "No knowledge matches found for: $query"
            echo ""
        fi
    else
        log_memory "Knowledge directory not found"
        echo ""
    fi
}

# Function to update architecture knowledge
update_architecture_knowledge() {
    local component="$1"
    local details="$2"
    
    log_memory "Updating architecture knowledge: $component"
    
    create_knowledge_entity \
        "current_architecture_$component" \
        "architecture" \
        "$(printf '["%s"]' "$details")"
}

# Function to preserve successful patterns
preserve_pattern() {
    local pattern_name="$1"
    local pattern_details="$2"
    local success_metrics="$3"
    
    log_memory "Preserving successful pattern: $pattern_name"
    
    create_knowledge_entity \
        "pattern_$pattern_name" \
        "successful_pattern" \
        "$(printf '["%s", "metrics: %s"]' "$pattern_details" "$success_metrics")"
}

# Function to flag outdated knowledge
flag_outdated() {
    local outdated_item="$1"
    local replacement="$2"
    
    log_memory "Flagging outdated knowledge: $outdated_item"
    
    create_knowledge_entity \
        "outdated_$outdated_item" \
        "deprecated" \
        "$(printf '["%s has been superseded by %s"]' "$outdated_item" "$replacement")"
}

# Function to get current architecture context
get_architecture_context() {
    log_memory "Retrieving current architecture context"
    
    # Return structured context about current architecture
    cat <<EOF
{
  "database": {
    "provider": "Neon PostgreSQL",
    "type": "serverless",
    "features": ["connection pooling", "scale-to-zero", "pgvector support"]
  },
  "hosting": {
    "provider": "Vercel", 
    "type": "serverless",
    "features": ["auto-scaling", "global CDN", "environment management"]
  },
  "frontend": {
    "framework": "Next.js 15.4.5",
    "language": "TypeScript",
    "features": ["API routes", "SSR/SSG", "app router"]
  },
  "ai_services": {
    "chat": "Anthropic Claude",
    "voice": "ElevenLabs TTS",
    "speech_recognition": "Browser Web Speech API"
  },
  "deployment_status": {
    "url": "https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app",
    "status": "live",
    "mvp": "single Robot Friend working"
  }
}
EOF
}

# Function to initialize knowledge base
init_knowledge_base() {
    log_memory "Initializing knowledge base"
    
    # Create standard architecture knowledge
    update_architecture_knowledge "database" "Neon PostgreSQL serverless with connection pooling"
    update_architecture_knowledge "hosting" "Vercel serverless deployment with global CDN"
    update_architecture_knowledge "frontend" "Next.js 15.4.5 with TypeScript and API routes"
    
    # Flag outdated architectures
    flag_outdated "Docker_containers" "Vercel_serverless"
    flag_outdated "Cloudflare_Workers" "Vercel_functions"
    flag_outdated "FastAPI_backend" "Next.js_API_routes"
    
    # Preserve successful MVP patterns
    preserve_pattern "single_robot_mvp" "Focus on one Robot Friend personality working perfectly" "79_tests_passing_zero_errors"
    preserve_pattern "neon_vercel_stack" "Simple architecture with Neon database and Vercel hosting" "sub_2s_response_times"
    
    log_memory "Knowledge base initialization complete"
}

# Main execution based on arguments
case "${1:-help}" in
    "init")
        init_knowledge_base
        ;;
    "create")
        create_knowledge_entity "$2" "$3" "$4"
        ;;
    "search")
        search_knowledge "$2"
        ;;
    "update-arch")
        update_architecture_knowledge "$2" "$3"
        ;;
    "preserve")
        preserve_pattern "$2" "$3" "$4"
        ;;
    "flag-outdated")
        flag_outdated "$2" "$3"
        ;;
    "get-context")
        get_architecture_context
        ;;
    "help"|*)
        echo "Memory Integration Script Usage:" >&2
        echo "  init                     - Initialize knowledge base" >&2
        echo "  create <name> <type> <obs> - Create knowledge entity" >&2
        echo "  search <query>           - Search existing knowledge" >&2
        echo "  update-arch <comp> <det> - Update architecture knowledge" >&2
        echo "  preserve <name> <det> <met> - Preserve successful pattern" >&2
        echo "  flag-outdated <old> <new> - Flag outdated knowledge" >&2
        echo "  get-context              - Get current architecture context" >&2
        ;;
esac