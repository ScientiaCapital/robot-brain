# Robot Brain Project Makefile
# TDD-driven development commands

.PHONY: help install test lint type-check format quality clean docker-build docker-run deploy

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
	@echo "Docker:"
	@echo "  make docker-build    - Build Docker image"
	@echo "  make docker-run      - Run Docker container"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy          - Deploy to Cloudflare Workers"

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
	pytest cloudflare/tests/ -v --tb=short

py-lint:
	@echo "Running flake8..."
	flake8 cloudflare/ --count --statistics

py-type:
	@echo "Running mypy..."
	mypy cloudflare/

py-format:
	@echo "Running black formatter..."
	black cloudflare/

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

# Docker targets
docker-build:
	@echo "Building Docker image..."
	docker build -t robot-brain:latest .

docker-run:
	@echo "Running Docker container..."
	docker-compose up

# Deployment
deploy:
	@echo "Deploying to Cloudflare Workers..."
	npm run deploy

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
	@echo "  - Python: cloudflare/tests/test_*.py"
	@echo "  - TypeScript: src/__tests__/*.test.tsx"

tdd-green:
	@echo "✅ TDD GREEN Phase: Make tests pass!"
	@echo "Run 'make test' to check progress"

tdd-refactor:
	@echo "🔧 TDD REFACTOR Phase: Improve code quality!"
	@echo "Run 'make quality' to ensure standards"