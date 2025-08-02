#!/bin/bash

# Documentation Currency Validation Script
# Runs on UserPromptSubmit to ensure documentation reflects current state

set -e

PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📚 Validating documentation currency..." >&2

# Function to check file last modified time
check_file_age() {
    local file="$1"
    local max_age_days="$2"
    
    if [[ ! -f "$file" ]]; then
        echo "❌ Missing: $(basename "$file")" >&2
        return 1
    fi
    
    local file_age_days
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        file_age_days=$(( ($(date +%s) - $(stat -f %m "$file")) / 86400 ))
    else
        # Linux
        file_age_days=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
    fi
    
    if [[ $file_age_days -gt $max_age_days ]]; then
        echo "⚠️ Outdated: $(basename "$file") (${file_age_days} days old)" >&2
        return 1
    fi
    
    echo "✅ Current: $(basename "$file")" >&2
    return 0
}

# Function to validate architecture consistency
validate_architecture() {
    local file="$1"
    local errors=0
    
    if [[ ! -f "$file" ]]; then
        return 1
    fi
    
    # Check for NEON + VERCEL emphasis
    if ! grep -q -i "neon" "$file" 2>/dev/null; then
        echo "⚠️ Missing NEON reference in $(basename "$file")" >&2
        errors=$((errors + 1))
    fi
    
    if ! grep -q -i "vercel" "$file" 2>/dev/null; then
        echo "⚠️ Missing VERCEL reference in $(basename "$file")" >&2
        errors=$((errors + 1))
    fi
    
    # Check for outdated architecture references
    if grep -q -i "docker\|cloudflare\|fastapi" "$file" 2>/dev/null; then
        echo "❌ Outdated architecture references in $(basename "$file")" >&2
        errors=$((errors + 1))
    fi
    
    # Check for deployment URL consistency
    if ! grep -q "robot-brain-rb7xfb8h2-scientia-capital.vercel.app" "$file" 2>/dev/null; then
        echo "⚠️ Missing or incorrect deployment URL in $(basename "$file")" >&2
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Main validation
VALIDATION_ERRORS=0

echo "🔍 Checking core documentation files..." >&2

# Check file currency (allow 7 days for active development)
check_file_age "$PROJECT_ROOT/CLAUDE.md" 7 || VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
check_file_age "$PROJECT_ROOT/ProjectContextEngineering.md" 7 || VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
check_file_age "$PROJECT_ROOT/ProjectTasks.md" 7 || VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))

echo "🏗️ Validating architecture consistency..." >&2

# Validate architecture consistency
validate_architecture "$PROJECT_ROOT/CLAUDE.md" || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
validate_architecture "$PROJECT_ROOT/ProjectContextEngineering.md" || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
validate_architecture "$PROJECT_ROOT/ProjectTasks.md" || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))

# Check if README is consistent
if [[ -f "$PROJECT_ROOT/README.md" ]]; then
    validate_architecture "$PROJECT_ROOT/README.md" || VALIDATION_ERRORS=$((VALIDATION_ERRORS + $?))
fi

# Generate validation report
VALIDATION_REPORT="$PROJECT_ROOT/.claude/reports/docs-validation.json"
mkdir -p "$(dirname "$VALIDATION_REPORT")"

cat > "$VALIDATION_REPORT" <<EOF
{
  "validation_timestamp": "$TIMESTAMP",
  "total_errors": $VALIDATION_ERRORS,
  "status": "$([ $VALIDATION_ERRORS -eq 0 ] && echo "valid" || echo "needs_attention")",
  "recommendations": [
    "Ensure NEON + VERCEL architecture is emphasized",
    "Remove any Docker/Cloudflare/FastAPI references",
    "Verify deployment URL is current",
    "Update documentation if older than 7 days"
  ],
  "next_action": "$([ $VALIDATION_ERRORS -gt 0 ] && echo "Use project-docs-curator agent to fix inconsistencies" || echo "Documentation is current and consistent")"
}
EOF

if [[ $VALIDATION_ERRORS -eq 0 ]]; then
    echo "✅ All documentation is current and consistent" >&2
else
    echo "⚠️ Found $VALIDATION_ERRORS documentation issues - consider using project-docs-curator agent" >&2
fi

echo "📋 Validation report: $VALIDATION_REPORT" >&2