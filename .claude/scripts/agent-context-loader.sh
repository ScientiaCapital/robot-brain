#!/bin/bash

# Agent Context Loader Script
# Provides specialized context loading functions for each agent type

set -e

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-/Users/tmk/Documents/my-robot-project}"
AGENT_TYPE="${1:-general-purpose}"

# Function to load Neon database context
load_neon_context() {
    cat <<EOF
{
  "database_configuration": {
    "provider": "Neon PostgreSQL",
    "connection_pooling": {
      "endpoint": "ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech",
      "ssl_required": true,
      "channel_binding": "require"
    },
    "tables": [
      "conversations",
      "sessions", 
      "embeddings",
      "robot_interactions",
      "tool_usage"
    ],
    "best_practices": {
      "use_pooler": "Always use pooler endpoint for production",
      "connection_limits": "Set min_size=1, max_size=10",
      "query_timeout": "Set command_timeout=60",
      "scale_to_zero": "Handle connection retry on wake"
    }
  },
  "optimization_patterns": [
    "Use indexes on frequently queried columns",
    "Implement connection pooling with asyncpg",
    "Use JSONB for flexible metadata storage",
    "Enable pgvector for semantic search"
  ]
}
EOF
}

# Function to load Vercel deployment context
load_vercel_context() {
    cat <<EOF
{
  "deployment_configuration": {
    "platform": "Vercel",
    "framework": "Next.js 15.4.5",
    "build_command": "npm run build",
    "output_directory": ".next",
    "environment_variables": [
      "NEON_DATABASE_URL",
      "ANTHROPIC_API_KEY", 
      "ELEVENLABS_API_KEY"
    ],
    "regions": ["iad1"],
    "functions": {
      "maxDuration": 10,
      "runtime": "nodejs20.x"
    }
  },
  "deployment_patterns": [
    "Use vercel env to manage secrets",
    "Enable ISR for static optimization",
    "Configure proper CORS headers",
    "Implement proper error boundaries"
  ],
  "current_deployment": {
    "url": "https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app",
    "status": "production",
    "auto_deploy": true
  }
}
EOF
}

# Function to load security context
load_security_context() {
    cat <<EOF
{
  "security_checklist": {
    "environment_variables": {
      "storage": "Use Vercel environment variables",
      "access": "Never commit .env files",
      "rotation": "Implement key rotation strategy"
    },
    "api_security": {
      "authentication": "Validate all API requests",
      "rate_limiting": "Implement request throttling",
      "input_validation": "Sanitize all user inputs"
    },
    "database_security": {
      "connections": "Always use SSL",
      "queries": "Use parameterized queries",
      "access": "Implement row-level security"
    }
  },
  "vulnerability_patterns": [
    "Check for exposed API keys in code",
    "Validate environment file permissions",
    "Audit npm dependencies regularly",
    "Implement Content Security Policy"
  ]
}
EOF
}

# Function to load API integration context
load_api_context() {
    cat <<EOF
{
  "api_integrations": {
    "anthropic": {
      "endpoint": "https://api.anthropic.com/v1/messages",
      "model": "claude-3-haiku-20240307",
      "max_tokens": 150,
      "temperature": 0.7,
      "best_practices": [
        "Implement exponential backoff",
        "Handle rate limits gracefully",
        "Cache common responses"
      ]
    },
    "elevenlabs": {
      "endpoint": "https://api.elevenlabs.io/v1/text-to-speech",
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "model": "eleven_multilingual_v2",
      "best_practices": [
        "Stream audio responses",
        "Implement voice caching",
        "Handle API errors gracefully"
      ]
    }
  },
  "error_handling_patterns": [
    "Implement circuit breakers",
    "Provide fallback responses", 
    "Log errors comprehensively",
    "Monitor API usage metrics"
  ]
}
EOF
}

# Function to load performance context
load_performance_context() {
    cat <<EOF
{
  "performance_metrics": {
    "target_metrics": {
      "first_contentful_paint": "< 1.8s",
      "largest_contentful_paint": "< 2.5s",
      "time_to_interactive": "< 3.8s",
      "cumulative_layout_shift": "< 0.1"
    },
    "optimization_strategies": {
      "bundle_size": "Use dynamic imports",
      "images": "Implement Next.js Image optimization",
      "fonts": "Use next/font for optimization",
      "caching": "Implement proper cache headers"
    }
  },
  "build_optimizations": [
    "Enable SWC minification",
    "Implement tree shaking",
    "Use production builds",
    "Monitor bundle analyzer"
  ]
}
EOF
}

# Function to load documentation context
load_docs_context() {
    cat <<EOF
{
  "documentation_standards": {
    "required_files": [
      "CLAUDE.md - Project overview and context",
      "ProjectContextEngineering.md - Technical details", 
      "ProjectTasks.md - Task tracking and status",
      "README.md - User-facing documentation"
    ],
    "consistency_rules": {
      "architecture": "Always emphasize NEON + VERCEL",
      "deployment": "Include current deployment URL",
      "avoid": "Remove Docker, Cloudflare, FastAPI references",
      "updates": "Keep documentation within 7 days current"
    }
  },
  "documentation_patterns": [
    "Use clear section headers",
    "Include code examples",
    "Maintain consistent formatting",
    "Cross-reference between docs"
  ]
}
EOF
}

# Function to load debugging context
load_debugging_context() {
    cat <<EOF
{
  "debugging_strategies": {
    "systematic_approach": [
      "Reproduce the issue consistently",
      "Isolate the problem domain",
      "Check recent changes",
      "Verify environment configuration"
    ],
    "common_issues": {
      "typescript_errors": "Check strict mode compliance",
      "api_failures": "Verify environment variables",
      "build_errors": "Clear cache and rebuild",
      "runtime_errors": "Check browser console"
    }
  },
  "debugging_tools": [
    "Chrome DevTools for frontend",
    "Vercel Functions logs",
    "TypeScript compiler messages",
    "Network request inspector"
  ]
}
EOF
}

# Function to load TDD architecture context
load_tdd_context() {
    cat <<EOF
{
  "tdd_principles": {
    "workflow": [
      "Write failing test first",
      "Implement minimal code to pass",
      "Refactor while keeping tests green",
      "Maintain high test coverage"
    ],
    "testing_stack": {
      "unit_tests": "Jest + React Testing Library",
      "integration_tests": "Supertest for API routes",
      "e2e_tests": "Playwright (future)",
      "type_checking": "TypeScript strict mode"
    }
  },
  "architecture_patterns": [
    "Separation of concerns",
    "Dependency injection",
    "Interface-based design",
    "Immutable state management"
  ]
}
EOF
}

# Main execution
case "$AGENT_TYPE" in
    "neon-database-architect")
        load_neon_context
        ;;
    "vercel-deployment-specialist")
        load_vercel_context
        ;;
    "security-auditor-expert")
        load_security_context
        ;;
    "api-integration-specialist")
        load_api_context
        ;;
    "nextjs-performance-optimizer")
        load_performance_context
        ;;
    "project-docs-curator")
        load_docs_context
        ;;
    "bug-hunter-specialist")
        load_debugging_context
        ;;
    "fullstack-tdd-architect")
        load_tdd_context
        ;;
    *)
        echo '{"type": "general", "message": "No specialized context for this agent type"}'
        ;;
esac