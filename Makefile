# Robot Brain Makefile for Rapid Development
# ==========================================

# Variables
DOCKER = /Applications/Docker.app/Contents/Resources/bin/docker
DOCKER_COMPOSE = $(DOCKER) compose
PYTHON = python3
NPM = npm
PYTEST = pytest

# Colors for output
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[0;33m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help command
.PHONY: help
help:
	@echo "$(GREEN)Robot Brain Development Commands$(NC)"
	@echo "================================="
	@echo "$(YELLOW)Docker Commands:$(NC)"
	@echo "  make up              - Start all services (Docker)"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Quick restart API only (2-3 seconds)"
	@echo "  make logs            - Show logs for all services"
	@echo "  make logs-api        - Show API logs only"
	@echo ""
	@echo "$(YELLOW)Testing Commands:$(NC)"
	@echo "  make test            - Run all tests locally"
	@echo "  make test-api        - Run API tests only"
	@echo "  make test-watch      - Run tests in watch mode"
	@echo "  make red             - Run failing tests (TDD Red phase)"
	@echo "  make green           - Implement to pass tests (TDD Green phase)"
	@echo "  make refactor        - Clean up code (TDD Refactor phase)"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  make dev             - Start development environment"
	@echo "  make build           - Build Docker images"
	@echo "  make clean           - Clean up containers and volumes"
	@echo "  make fresh           - Clean and rebuild everything"
	@echo ""
	@echo "$(YELLOW)Deployment Commands:$(NC)"
	@echo "  make deploy-local    - Deploy to local Docker"
	@echo "  make deploy-cf       - Deploy to Cloudflare Workers"
	@echo "  make status          - Check service status"
	@echo ""
	@echo "$(YELLOW)UI Commands:$(NC)"
	@echo "  make ui              - Start React UI development server"
	@echo "  make ui-build        - Build React UI for production"
	@echo "  make ui-test         - Run React UI tests"

# Docker Commands
# ===============

.PHONY: up
up:
	@echo "$(GREEN)Starting Robot Brain services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services started! Access:$(NC)"
	@echo "  - API: http://localhost:8000"
	@echo "  - MailHog: http://localhost:8025"
	@echo "  - Redis: localhost:6379"

.PHONY: down
down:
	@echo "$(RED)Stopping Robot Brain services...$(NC)"
	$(DOCKER_COMPOSE) down

.PHONY: restart
restart:
	@echo "$(YELLOW)Quick restarting API service (2-3 seconds)...$(NC)"
	$(DOCKER_COMPOSE) restart robot-api
	@echo "$(GREEN)API restarted!$(NC)"

.PHONY: logs
logs:
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-api
logs-api:
	$(DOCKER_COMPOSE) logs -f robot-api

# Testing Commands (TDD Workflow)
# ===============================

.PHONY: test
test:
	@echo "$(GREEN)Running all tests...$(NC)"
	$(DOCKER_COMPOSE) exec robot-api pytest tests/ -v

.PHONY: test-api
test-api:
	@echo "$(GREEN)Running API tests...$(NC)"
	$(DOCKER_COMPOSE) exec robot-api pytest tests/test_api.py -v

.PHONY: test-watch
test-watch:
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	$(DOCKER_COMPOSE) exec robot-api pytest-watch tests/

# TDD Shortcuts
.PHONY: red
red:
	@echo "$(RED)TDD RED: Running tests (expecting failures)...$(NC)"
	-$(DOCKER_COMPOSE) exec robot-api pytest tests/ -v --tb=short

.PHONY: green
green:
	@echo "$(GREEN)TDD GREEN: Running tests (implementing to pass)...$(NC)"
	$(DOCKER_COMPOSE) exec robot-api pytest tests/ -v

.PHONY: refactor
refactor:
	@echo "$(YELLOW)TDD REFACTOR: Running tests and linting...$(NC)"
	$(DOCKER_COMPOSE) exec robot-api pytest tests/ -v
	$(DOCKER_COMPOSE) exec robot-api pylint src/

# Development Commands
# ====================

.PHONY: dev
dev:
	@echo "$(GREEN)Starting development environment...$(NC)"
	$(MAKE) up
	@echo "$(GREEN)Starting React UI...$(NC)"
	cd robot-brain-ui && $(NPM) run dev

.PHONY: build
build:
	@echo "$(YELLOW)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build

.PHONY: clean
clean:
	@echo "$(RED)Cleaning up containers and volumes...$(NC)"
	$(DOCKER_COMPOSE) down -v

.PHONY: fresh
fresh:
	@echo "$(YELLOW)Fresh rebuild of everything...$(NC)"
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) up

# Deployment Commands
# ===================

.PHONY: deploy-local
deploy-local:
	@echo "$(GREEN)Deploying to local Docker...$(NC)"
	$(DOCKER_COMPOSE) up -d --build
	@echo "$(GREEN)Local deployment complete!$(NC)"

.PHONY: deploy-cf
deploy-cf:
	@echo "$(YELLOW)Deploying to Cloudflare Workers...$(NC)"
	cd cloudflare && wrangler deploy
	@echo "$(GREEN)Cloudflare deployment complete!$(NC)"
	@echo "Visit: https://robot-brain.tkipper.workers.dev"

.PHONY: status
status:
	@echo "$(GREEN)Service Status:$(NC)"
	$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(GREEN)Port Status:$(NC)"
	@netstat -an | grep -E "8000|8025|6379|11434" | grep LISTEN || echo "No services listening"

# UI Commands
# ===========

.PHONY: ui
ui:
	@echo "$(GREEN)Starting React UI development server...$(NC)"
	cd robot-brain-ui && $(NPM) run dev

.PHONY: ui-build
ui-build:
	@echo "$(YELLOW)Building React UI for production...$(NC)"
	cd robot-brain-ui && $(NPM) run build

.PHONY: ui-test
ui-test:
	@echo "$(GREEN)Running React UI tests...$(NC)"
	cd robot-brain-ui && $(NPM) test

# Quick access commands for rapid iteration
# =========================================

.PHONY: r
r: restart

.PHONY: l
l: logs-api

.PHONY: t
t: test

.PHONY: d
d: deploy-local