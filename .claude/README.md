# Claude Agent Hook System - Enhanced Agent-Aware Edition

This directory contains the enhanced Claude Code hook system configuration for the Robot Brain project, providing specialized context awareness and knowledge preservation for each agent type.

## 🔄 Hook System Overview

### **Architecture** 
The enhanced hook system provides **agent-specific** context gathering and knowledge preservation, ensuring each agent has specialized awareness tailored to their expertise while maintaining consistent **NEON + VERCEL** architecture understanding.

### **Hook Types Configured**
1. **PreToolUse** - Agent-specific context gathering before Task tool execution
2. **SubagentStop** - Agent-specific knowledge preservation after completion  
3. **UserPromptSubmit** - Documentation validation on user input
4. **SessionStart** - Project state validation at session start

### **Agent Specialization**
Each agent receives customized context:
- **neon-database-architect** → Database schemas, connection patterns, optimization history
- **vercel-deployment-specialist** → Deployment configs, environment variables, build logs
- **security-auditor-expert** → Security patterns, vulnerability history, compliance checks
- **api-integration-specialist** → API docs, rate limits, integration patterns
- **nextjs-performance-optimizer** → Bundle analysis, performance metrics, optimization history
- **project-docs-curator** → Documentation standards, consistency rules, update patterns
- **bug-hunter-specialist** → Error patterns, debugging strategies, solution history
- **fullstack-tdd-architect** → TDD patterns, architecture decisions, best practices

## 📁 Directory Structure

```
.claude/
├── settings.json                    # Main hook configuration
├── scripts/                         # Hook execution scripts
│   ├── pre-task-context.sh         # Agent-aware context gathering
│   ├── post-agent-update.sh        # Agent-specific knowledge updates
│   ├── validate-docs-current.sh    # Documentation validation
│   ├── session-init.sh             # Session initialization
│   ├── memory-integration.sh       # Memory system utilities
│   ├── agent-validation.sh         # Agent-specific validation checks
│   └── agent-context-loader.sh     # Specialized context providers
├── knowledge/                       # Agent-organized knowledge storage
│   ├── agents/                     # Agent-specific knowledge
│   │   ├── neon-database-architect/
│   │   ├── vercel-deployment-specialist/
│   │   ├── security-auditor-expert/
│   │   └── ...
│   └── shared/                     # Shared knowledge
│       ├── architecture/           # Current architecture entities
│       ├── patterns/               # Successful patterns
│       └── deprecated/             # Outdated knowledge
├── logs/                           # Hook execution logs
├── reports/                        # Generated reports
└── stats/                          # Usage statistics
```

## 🚀 How It Works

### **1. Session Start Hook**
When Claude Code starts, automatically:
- ✅ Validates project structure
- ✅ Checks deployment status
- ✅ Verifies environment variables
- ✅ Confirms agent system readiness

### **2. Pre-Task Context Hook**
Before any agent execution:
- 📖 Reads core documentation (CLAUDE.md, ProjectContextEngineering.md, ProjectTasks.md)
- 🏗️ Extracts current architecture information
- 🧠 Searches memory system for relevant context
- 📋 Generates structured JSON context summary

### **3. Post-Agent Update Hook**
After agent completion:
- 💾 Updates memory with task outcomes
- 📚 Checks documentation consistency
- 🎯 Preserves successful patterns
- 🧹 Flags outdated knowledge

### **4. Documentation Validation Hook**
On user prompt submission:
- 📅 Checks file currency (< 7 days old)
- 🏗️ Validates NEON + VERCEL architecture consistency
- ❌ Flags outdated Docker/Cloudflare/FastAPI references
- 🔗 Verifies deployment URL accuracy

## 🔧 Configuration Files

### **settings.json**
Main Claude Code hook configuration with proper matchers and timeouts:
```json
{
  "hooks": {
    "PreToolUse": [{"matcher": "Task", "hooks": [...]}],
    "SubagentStop": [{"matcher": ".*", "hooks": [...]}],
    "UserPromptSubmit": [{"matcher": ".*", "hooks": [...]}],
    "SessionStart": [{"matcher": ".*", "hooks": [...]}]
  }
}
```

### **Script Parameters**
All scripts use `$CLAUDE_PROJECT_DIR` for project-relative paths and include:
- ⏱️ Configurable timeouts (15-45 seconds)
- 📝 Comprehensive logging
- 🔄 Error handling and retries
- 📊 JSON output for structured data

## 💾 Memory System Integration

### **Knowledge Categories**
- **Architecture**: Current NEON + VERCEL setup
- **Successful Patterns**: Proven solutions and approaches
- **Deprecated**: Outdated Docker/Cloudflare/FastAPI references
- **Task Outcomes**: Agent execution results

### **Memory Operations**
```bash
# Initialize knowledge base
./scripts/memory-integration.sh init

# Create knowledge entity
./scripts/memory-integration.sh create "entity_name" "type" "observations"

# Search existing knowledge
./scripts/memory-integration.sh search "query"

# Get architecture context
./scripts/memory-integration.sh get-context
```

## 📊 Monitoring & Reports

### **Generated Reports**
- `session-init.json` - Session validation status
- `docs-validation.json` - Documentation consistency check
- `latest-update.json` - Post-agent update summary

### **Log Files**
- `sessions.log` - Session initialization events
- `agent-updates.log` - Post-agent knowledge updates
- `memory-operations.log` - Memory system interactions

### **Statistics**
- `session-count.txt` - Session history
- `agent-executions.txt` - Agent execution count

## 🎯 Agent Context Awareness - Enhanced Edition

### **Every Agent Receives Core Context PLUS Specialized Knowledge**

#### **Core Context (All Agents)**
1. **Current Architecture**
   - NEON PostgreSQL database configuration
   - Vercel deployment details
   - Next.js application structure
   - API integrations (Anthropic, ElevenLabs)

2. **Project Status**
   - MVP completion status
   - Deployment URL: https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app
   - Technology stack: Next.js + Neon + Vercel
   - Current priorities and tasks

#### **Agent-Specific Context**
- **neon-database-architect**
  - Connection pooling configurations
  - Query optimization patterns
  - Schema design best practices
  - Performance tuning history

- **vercel-deployment-specialist**
  - Build configurations
  - Environment variable management
  - Serverless function optimization
  - Deployment patterns

- **security-auditor-expert**
  - API key security patterns
  - Vulnerability scan results
  - Compliance checklists
  - Security best practices

- **api-integration-specialist**
  - Rate limiting strategies
  - Error handling patterns
  - Integration best practices
  - API documentation

- **nextjs-performance-optimizer**
  - Bundle analysis reports
  - Core Web Vitals metrics
  - Optimization strategies
  - Performance benchmarks

- **project-docs-curator**
  - Documentation standards
  - Consistency rules
  - Update patterns
  - Cross-reference guidelines

#### **Knowledge Preservation**
Each agent's learnings are stored in their dedicated knowledge directory, creating a growing repository of specialized expertise that benefits future executions.

## ✅ Benefits

### **Consistency**
- All agents start with identical, current project context
- No outdated architecture references
- Unified understanding of NEON + VERCEL setup

### **Knowledge Preservation**
- Successful solutions automatically saved
- Cross-agent learning and pattern sharing
- Continuous improvement of agent effectiveness

### **Quality Assurance**
- Documentation consistency validation
- Architecture reference accuracy
- Deployment status monitoring

### **Automation**
- Zero manual intervention required
- Automatic context updates
- Self-maintaining knowledge base

## 🚀 Usage

The hook system runs automatically - no manual intervention needed! Just use agents as normal and they'll automatically have full context awareness and knowledge preservation.

**Example**: When you run `Task` with any agent, it will automatically:
1. 🔍 Gather current project context
2. 🤖 Execute with full awareness
3. 💾 Update knowledge system
4. 📊 Generate reports

**Result**: Every agent is always informed, consistent, and contributes to collective learning!

---

**🎯 This system ensures our agent team maintains perfect awareness of our NEON + VERCEL architecture while continuously learning and improving.** 🚀