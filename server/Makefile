# Robot Brain Project Makefile
# TDD-driven development commands

.PHONY: help install test lint type-check format quality clean deploy

# Default target
help:
	@echo "Robot Brain Development Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install all dependencies"
	@echo "  make install-hooks    - Install pre-commit hooks"
	@echo ""
	@echo "Code Quality (TDD):"
	@echo "  make test            - Run all tests (Python + TypeScript)"
	@echo "  make lint            - Run linters (flake8 + eslint)"
	@echo "  make type-check      - Run type checkers (mypy + tsc)"
	@echo "  make format          - Auto-format code (black + prettier)"
	@echo "  make quality         - Run all quality checks"
	@echo ""
	@echo "Python Specific:"
	@echo "  make py-test         - Run Python tests only"
	@echo "  make py-lint         - Run flake8 only"
	@echo "  make py-type         - Run mypy only"
	@echo "  make py-format       - Run black formatter"
	@echo ""
	@echo "TypeScript Specific:"
	@echo "  make ts-test         - Run Jest tests only"
	@echo "  make ts-lint         - Run ESLint only"
	@echo "  make ts-type         - Run TypeScript checker"
	@echo ""
	@echo "Production:"
	@echo "  make deploy          - Deploy to production"
	@echo "  make test-production - Run production-specific tests"

# Installation targets
install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	pip install flake8 mypy black pytest pytest-asyncio types-requests beautifulsoup4 types-beautifulsoup4
	@echo "Installing Node dependencies..."
	npm install
	@echo "✅ All dependencies installed!"

install-hooks:
	@echo "Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install
	@echo "✅ Pre-commit hooks installed!"

# Combined quality checks
test: py-test ts-test

lint: py-lint ts-lint

type-check: py-type ts-type

format: py-format
	@echo "Running Prettier on TypeScript/JavaScript files..."
	npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"

quality: lint type-check test
	@echo "✅ All quality checks passed!"

# Python-specific targets
py-test:
	@echo "Running Python tests..."
	pytest tests/ -v --tb=short

py-lint:
	@echo "Running flake8..."
	flake8 src/ tests/ --count --statistics

py-type:
	@echo "Running mypy..."
	mypy src/

py-format:
	@echo "Running black formatter..."
	black src/ tests/

# TypeScript-specific targets
ts-test:
	@echo "Running Jest tests..."
	npm test

ts-lint:
	@echo "Running ESLint..."
	npm run lint

ts-type:
	@echo "Running TypeScript type checker..."
	npx tsc --noEmit

# Production Deployment
deploy:
	@echo "Deploying to production..."
	@echo "Production deployment configuration needed"

# Cleanup
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf node_modules/.cache
	rm -rf .next
	@echo "✅ Cleanup complete!"

# TDD workflow helpers
tdd-red:
	@echo "📝 TDD RED Phase: Write failing tests first!"
	@echo "Create your test files in:"
	@echo "  - Python: tests/test_*.py"
	@echo "  - TypeScript: src/__tests__/*.test.tsx"

tdd-green:
	@echo "✅ TDD GREEN Phase: Make tests pass!"
	@echo "Run 'make test' to check progress"

tdd-refactor:
	@echo "🔧 TDD REFACTOR Phase: Improve code quality!"
	@echo "Run 'make quality' to ensure standards"

# Context7 Integration Targets
context7-check: context7-neon context7-langgraph context7-fastapi
	@echo "✅ All Context7 compliance checks passed!"

context7-neon:
	@echo "🔍 Checking Neon PostgreSQL best practices..."
	python scripts/context7_neon_check.py

context7-langgraph:
	@echo "🔍 Checking LangGraph supervisor patterns..."
	python scripts/context7_langgraph_check.py

context7-fastapi:
	@echo "🔍 Checking FastAPI production patterns..."
	python scripts/context7_fastapi_check.py

context7-cache-info:
	@echo "📊 Context7 cache information:"
	python scripts/context7_cache.py info

context7-cache-clear:
	@echo "🧹 Clearing Context7 cache..."
	python scripts/context7_cache.py clear

# TDD Production Workflow
tdd-production: context7-check quality test
	@echo "🚀 TDD Production validation complete!"

test-production:
	@echo "🧪 Running production-specific tests..."
	pytest tests/test_context7_hooks.py tests/test_production_config.py -v

deploy-tdd: tdd-production
	@echo "🚀 TDD-compliant deployment process..."
	@echo "All checks passed - ready for deployment!"

# Enhanced TDD compliance
tdd-compliance:
	@echo "🔍 Verifying TDD workflow compliance..."
	python scripts/verify_tdd_compliance.py