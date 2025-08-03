# Global Claude Hook System & Agent Reliability Guardrails

## 🌐 Overview

This document describes the global hook system that automatically activates Claude Code hooks and Agent Reliability Guardrails in ANY project you open. Once configured, these hooks provide:

- **Automatic Quality Assurance**: Every commit is validated
- **Agent Reliability**: Prevents phantom work and false claims
- **Knowledge Preservation**: Cross-project learning
- **Zero Configuration**: Works immediately in existing projects

## 🚀 Quick Setup

Run the initialization script:
```bash
~/bin/claude-init-global-hooks
```

That's it! Now every project you open with `claude .` will have automatic hooks.

## 📁 Global Directory Structure

```
~/.claude/
├── global-settings.json         # Global hook configuration
├── global-scripts/              # Global hook scripts
│   ├── global-session-init.sh   # Runs on Claude start
│   ├── global-pre-task.sh       # Before agent tasks
│   ├── global-post-agent.sh     # After agent completion
│   ├── global-prompt-validate.sh # On user prompts
│   └── ensure-hooks-active.sh   # Activates hooks in projects
├── templates/                   # Templates for projects
│   └── default/
│       └── .claude/
│           ├── guardrails/      # Agent validation scripts
│           └── scripts/         # Hook scripts
└── knowledge/                   # Global knowledge base
    ├── agents/                  # Per-agent metrics
    ├── patterns/                # Successful patterns
    └── projects/                # Project history

~/.config/git/hooks/             # Global Git hooks
├── pre-commit                   # Validates agent work
├── post-commit                  # Updates knowledge
└── pre-push                     # Final validation
```

## 🔄 How It Works

### When You Open a Project

1. **Claude starts** → Global SessionStart hook runs
2. **Checks for .claude directory** → If found, ensures hooks are active
3. **Updates if needed** → Adds missing scripts/guardrails
4. **Activates hooks** → All hooks ready to work

### During Development

**Pre-Task (Agent Work)**:
- Global context gathered
- Project-specific context added
- Guardrails status checked
- Agent receives full context

**Post-Agent**:
- Work validated
- Knowledge preserved globally
- Patterns extracted
- Metrics updated

**Git Commits**:
- Pre-commit: Validates agent sessions
- Post-commit: Updates knowledge base
- Pre-push: Final quality checks

## 🛡️ Agent Reliability Guardrails

### Automatic Features

1. **Session Tracking**: Every agent session is tracked
2. **Work Validation**: Claims vs actual executions
3. **Reliability Scoring**: Performance metrics
4. **Phantom Detection**: Catches false claims

### NPM Scripts (Auto-Added)

```json
{
  "scripts": {
    "agent:checkpoint": "Create pre-work snapshot",
    "agent:validate": "Validate deliverables",
    "agent:verify": "Complete verification",
    "agent:list": "List all sessions"
  }
}
```

## 📋 Hook Types

### Claude Code Hooks

1. **SessionStart**: Project initialization
2. **PreToolUse**: Context gathering before agents
3. **SubagentStop**: Knowledge preservation
4. **UserPromptSubmit**: Validation checks

### Git Hooks

1. **pre-commit**: Agent work validation
2. **post-commit**: Knowledge updates
3. **pre-push**: Build and test validation

## 🔍 Usage Examples

### Opening an Existing Project

```bash
cd ~/projects/my-app
claude .

# Automatically:
# ✅ Hooks activated
# ✅ Guardrails ready
# ✅ Context loaded
```

### Manual Activation

```bash
# In any project directory
claude-activate-hooks
```

### Checking Agent Work

```bash
# After agent work
npm run agent:verify [session-id] [agent-type]

# List all sessions
npm run agent:list
```

## 🎯 Benefits

### For Existing Projects

- **Zero Setup**: Just open with Claude
- **Immediate Protection**: Guardrails active instantly
- **Backward Compatible**: Doesn't break anything
- **Progressive Enhancement**: Adds features as needed

### Cross-Project Learning

- **Pattern Recognition**: Successful patterns shared
- **Agent Metrics**: Performance tracked globally
- **Knowledge Transfer**: Learn from all projects
- **Continuous Improvement**: Gets better over time

## 🔧 Configuration

### Global Settings

Edit `~/.claude/global-settings.json`:

```json
{
  "global_config": {
    "agent_reliability_guardrails": {
      "enabled": true,
      "auto_initialize": true,
      "reliability_threshold": 80
    },
    "knowledge_sync": {
      "enabled": true,
      "cross_project": true
    }
  }
}
```

### Per-Project Override

Projects can still have local settings in `.claude/settings.json` that override globals.

## 🚨 Troubleshooting

### Hooks Not Activating

1. Check Claude is using global settings:
   ```bash
   ls ~/.claude/global-settings.json
   ```

2. Verify Git hooks path:
   ```bash
   git config --global core.hooksPath
   ```

3. Manually activate:
   ```bash
   claude-activate-hooks
   ```

### Permission Issues

```bash
chmod +x ~/.claude/global-scripts/*.sh
chmod +x ~/.config/git/hooks/*
```

## 🔄 Updates

The system self-updates when you:
1. Open projects with newer hooks
2. Run the init script again
3. Manually update templates

## 🎉 Summary

With this global hook system:

- ✅ **Every project** gets automatic quality assurance
- ✅ **No setup required** - just open and code
- ✅ **Agent reliability** guaranteed across all work
- ✅ **Knowledge preserved** for future sessions
- ✅ **Works with existing projects** immediately

The future of development: automatic quality, zero configuration! 🚀