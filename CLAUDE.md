# CLAUDE.md - Robot Brain Project Context

## 🤖 Project Overview
**Robot Brain** is an AI-powered chat system featuring multiple robot personalities, built with modern web technologies and designed to be educational and fun for kids while providing powerful developer tools.

## 🎯 Project Goals
1. Create engaging AI chat experiences with distinct robot personalities
2. Enable multi-robot conversations so kids can see how AI agents collaborate
3. Provide both local (Docker) and global (Cloudflare) deployment options
4. Build a modular system for adding AI tools and capabilities
5. Make AI accessible and fun for children
6. Offer developer-friendly debugging and configuration options

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Web Chat    │  │   Terminal   │  │     API      │   │
│  │  (Browser)   │  │   Scripts    │  │  Endpoints   │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                  Robot Brain Core                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │          5 Robot Personalities                   │   │
│  │  Friend | Nerd | Zen | Pirate | Drama          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Tool System                         │   │
│  │  Chat | Jokes | Calculate | Research | etc.     │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
┌────────────────────▼───────────────▼────────────────────┐
│                   AI Backends                            │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │   Ollama     │  │  Cloudflare    │  │ LangGraph   │  │
│  │  (Local)     │  │  Workers AI    │  │ Supervisor  │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

[... rest of the existing content remains the same ...]

## 🎯 TDD (Test-Driven Development) Tracking

### Current TDD Status
In TDD, we must:
1. RED - Write tests (✅ Done)
2. GREEN - Make ALL tests pass (✅ Done - 27/27 tests passing!)
3. REFACTOR - Clean up the code (✅ Done)

### Latest TDD Achievements (July 31, 2025)
- ✅ **LangGraph Supervisor**: 12/12 tests passing with full multi-agent orchestration
- ✅ **BaseAgent/BaseTool Framework**: 15/15 tests passing
  - Abstract base classes for professional verticals
  - Tool registry and composition support
  - YAML/JSON configuration loading
- ✅ **Professional Verticals Implemented**:
  - **Trading Team**: MarketAnalyst, QuantResearcher, RiskManager, ExecutionTrader
  - **HR Team**: Recruiter, HRGeneralist, OnboardingAgent
  - **Payroll Team**: PayrollProcessor, TaxCalculator, ComplianceAgent, ReportingAgent

[... rest of the existing content remains the same ...]