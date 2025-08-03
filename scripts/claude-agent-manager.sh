#!/bin/bash

# Claude Agent Manager
# A universal script for managing Claude Code agents (subagents)
# Works with both global (~/.claude/agents) and local (.claude/agents) agents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Directories
GLOBAL_AGENTS_DIR="$HOME/.claude/agents"
LOCAL_AGENTS_DIR=".claude/agents"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if we're in a project with local agents
is_project() {
    [ -d ".claude" ] || [ -f ".claude" ]
}

# Function to ensure directories exist
ensure_directories() {
    mkdir -p "$GLOBAL_AGENTS_DIR"
    if is_project; then
        mkdir -p "$LOCAL_AGENTS_DIR"
    fi
}

# Function to list all available agents
list_agents() {
    print_color "$BLUE" "\n🤖 Available Claude Agents:\n"
    
    print_color "$PURPLE" "Global Agents ($GLOBAL_AGENTS_DIR):"
    if [ -d "$GLOBAL_AGENTS_DIR" ] && [ "$(ls -A "$GLOBAL_AGENTS_DIR"/*.md 2>/dev/null | wc -l)" -gt 0 ]; then
        for agent in "$GLOBAL_AGENTS_DIR"/*.md; do
            if [ -f "$agent" ]; then
                basename=$(basename "$agent" .md)
                description=$(grep "^description:" "$agent" | cut -d':' -f2- | xargs)
                print_color "$GREEN" "  • $basename"
                echo "    $description"
            fi
        done
    else
        echo "  (none)"
    fi
    
    if is_project; then
        print_color "$PURPLE" "\nLocal Agents ($LOCAL_AGENTS_DIR):"
        if [ -d "$LOCAL_AGENTS_DIR" ] && [ "$(ls -A "$LOCAL_AGENTS_DIR"/*.md 2>/dev/null | wc -l)" -gt 0 ]; then
            for agent in "$LOCAL_AGENTS_DIR"/*.md; do
                if [ -f "$agent" ]; then
                    basename=$(basename "$agent" .md)
                    description=$(grep "^description:" "$agent" | cut -d':' -f2- | xargs)
                    print_color "$GREEN" "  • $basename"
                    echo "    $description"
                fi
            done
        else
            echo "  (none)"
        fi
    fi
    echo
}

# Function to create a new agent
create_agent() {
    local name=$1
    local location=$2
    local description=$3
    local model=${4:-"sonnet"}
    local color=${5:-"blue"}
    
    if [ -z "$name" ] || [ -z "$location" ] || [ -z "$description" ]; then
        print_color "$RED" "Error: Missing required parameters"
        echo "Usage: $0 create <name> <global|local> <description> [model] [color]"
        exit 1
    fi
    
    local agent_dir
    if [ "$location" = "global" ]; then
        agent_dir="$GLOBAL_AGENTS_DIR"
    elif [ "$location" = "local" ]; then
        if ! is_project; then
            print_color "$RED" "Error: Not in a project directory. Cannot create local agent."
            exit 1
        fi
        agent_dir="$LOCAL_AGENTS_DIR"
    else
        print_color "$RED" "Error: Location must be 'global' or 'local'"
        exit 1
    fi
    
    local agent_file="$agent_dir/$name.md"
    
    if [ -f "$agent_file" ]; then
        print_color "$YELLOW" "Warning: Agent '$name' already exists at $agent_file"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
    
    cat > "$agent_file" << EOF
---
name: $name
description: $description
model: $model
color: $color
---

You are an expert agent specialized in the following area: $description

**Core Responsibilities:**
- [Add specific responsibilities here]

**Expertise Areas:**
- [Add expertise area 1]
- [Add expertise area 2]
- [Add expertise area 3]

**Methodologies:**
- [Add methodology 1]
- [Add methodology 2]

**Best Practices:**
- [Add best practice 1]
- [Add best practice 2]

**Communication Style:**
- Clear and concise responses
- Technical accuracy with appropriate context
- Actionable recommendations

[Customize this template based on the agent's specific role and requirements]
EOF
    
    print_color "$GREEN" "✅ Created agent '$name' at $agent_file"
    echo "Edit the file to customize the agent's instructions."
}

# Function to copy a global agent to local
copy_to_local() {
    local agent_name=$1
    
    if [ -z "$agent_name" ]; then
        print_color "$RED" "Error: Agent name required"
        echo "Usage: $0 copy-to-local <agent-name>"
        exit 1
    fi
    
    if ! is_project; then
        print_color "$RED" "Error: Not in a project directory"
        exit 1
    fi
    
    local global_agent="$GLOBAL_AGENTS_DIR/$agent_name.md"
    local local_agent="$LOCAL_AGENTS_DIR/$agent_name.md"
    
    if [ ! -f "$global_agent" ]; then
        print_color "$RED" "Error: Global agent '$agent_name' not found"
        exit 1
    fi
    
    ensure_directories
    cp "$global_agent" "$local_agent"
    print_color "$GREEN" "✅ Copied '$agent_name' from global to local"
    echo "You can now customize the local version for this project."
}

# Function to initialize standard agents
init_standard_agents() {
    local location=$1
    
    if [ "$location" != "global" ] && [ "$location" != "local" ]; then
        print_color "$RED" "Error: Location must be 'global' or 'local'"
        echo "Usage: $0 init <global|local>"
        exit 1
    fi
    
    if [ "$location" = "local" ] && ! is_project; then
        print_color "$RED" "Error: Not in a project directory"
        exit 1
    fi
    
    print_color "$BLUE" "🚀 Initializing standard agents..."
    
    # Define standard agents
    declare -A agents=(
        ["general-purpose"]="Versatile agent for complex research and multi-step tasks"
        ["fullstack-tdd-architect"]="Test-driven development and clean architecture expert"
        ["bug-hunter-specialist"]="Expert at identifying and fixing bugs systematically"
        ["security-auditor-expert"]="Security specialist for vulnerability assessment"
        ["devops-automation-engineer"]="CI/CD pipeline and infrastructure automation expert"
        ["project-docs-curator"]="Documentation creation and maintenance specialist"
    )
    
    for name in "${!agents[@]}"; do
        create_agent "$name" "$location" "${agents[$name]}" "sonnet" "blue"
    done
    
    print_color "$GREEN" "\n✅ Standard agents initialized!"
}

# Function to remove an agent
remove_agent() {
    local name=$1
    local location=$2
    
    if [ -z "$name" ] || [ -z "$location" ]; then
        print_color "$RED" "Error: Missing parameters"
        echo "Usage: $0 remove <name> <global|local>"
        exit 1
    fi
    
    local agent_file
    if [ "$location" = "global" ]; then
        agent_file="$GLOBAL_AGENTS_DIR/$name.md"
    elif [ "$location" = "local" ]; then
        agent_file="$LOCAL_AGENTS_DIR/$name.md"
    else
        print_color "$RED" "Error: Location must be 'global' or 'local'"
        exit 1
    fi
    
    if [ ! -f "$agent_file" ]; then
        print_color "$RED" "Error: Agent '$name' not found"
        exit 1
    fi
    
    read -p "Are you sure you want to remove '$name'? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$agent_file"
        print_color "$GREEN" "✅ Removed agent '$name'"
    fi
}

# Function to show agent details
show_agent() {
    local name=$1
    
    if [ -z "$name" ]; then
        print_color "$RED" "Error: Agent name required"
        echo "Usage: $0 show <agent-name>"
        exit 1
    fi
    
    local found=false
    
    # Check local first (takes precedence)
    if is_project && [ -f "$LOCAL_AGENTS_DIR/$name.md" ]; then
        print_color "$BLUE" "\n📍 Local Agent: $name"
        cat "$LOCAL_AGENTS_DIR/$name.md"
        found=true
    elif [ -f "$GLOBAL_AGENTS_DIR/$name.md" ]; then
        print_color "$BLUE" "\n🌍 Global Agent: $name"
        cat "$GLOBAL_AGENTS_DIR/$name.md"
        found=true
    fi
    
    if [ "$found" = false ]; then
        print_color "$RED" "Error: Agent '$name' not found"
        exit 1
    fi
}

# Main command handling
case "${1:-help}" in
    list|ls)
        list_agents
        ;;
    
    create|add)
        shift
        create_agent "$@"
        ;;
    
    copy-to-local|copy)
        shift
        copy_to_local "$@"
        ;;
    
    init)
        shift
        init_standard_agents "$@"
        ;;
    
    remove|rm)
        shift
        remove_agent "$@"
        ;;
    
    show|cat)
        shift
        show_agent "$@"
        ;;
    
    help|--help|-h|*)
        print_color "$BLUE" "Claude Agent Manager"
        echo
        echo "Usage: $0 <command> [options]"
        echo
        echo "Commands:"
        echo "  list, ls                    List all available agents"
        echo "  create <name> <global|local> <description> [model] [color]"
        echo "                             Create a new agent"
        echo "  copy-to-local <name>       Copy a global agent to local project"
        echo "  init <global|local>        Initialize standard agents"
        echo "  remove <name> <global|local> Remove an agent"
        echo "  show <name>                Display agent details"
        echo "  help                       Show this help message"
        echo
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 create my-agent global \"My custom agent description\""
        echo "  $0 copy-to-local general-purpose"
        echo "  $0 init global"
        echo "  $0 show bug-hunter-specialist"
        echo
        echo "Agent Locations:"
        echo "  Global: $GLOBAL_AGENTS_DIR"
        echo "  Local:  $LOCAL_AGENTS_DIR (when in a project)"
        ;;
esac