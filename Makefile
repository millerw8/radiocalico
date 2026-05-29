# Makefile for Radio Calico Docker Management
# Provides convenient shortcuts for common Docker operations

.PHONY: help dev prod test start-dev start-prod start-test stop-dev stop-prod stop-test build-dev build-prod up-dev up-prod down logs logs-dev logs-prod test-run clean backup status

# Default target
help:
	@echo "Radio Calico - Quick Start Commands:"
	@echo ""
	@echo "Quick Start (recommended):"
	@echo "  make dev          - Start development environment (http://localhost:3000)"
	@echo "  make prod         - Start production environment (http://localhost)"
	@echo "  make test         - Run all tests"
	@echo ""
	@echo "Alternative Start Commands:"
	@echo "  make start-dev    - Start dev (alias for 'make dev')"
	@echo "  make start-prod   - Start prod (alias for 'make prod')"
	@echo "  make start-test   - Run tests (alias for 'make test')"
	@echo ""
	@echo "Stop Commands:"
	@echo "  make stop-dev     - Stop development containers"
	@echo "  make stop-prod    - Stop production containers"
	@echo "  make down         - Stop all containers"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build-dev    - Build development image"
	@echo "  make build-prod   - Build production image"
	@echo ""
	@echo "Logs:"
	@echo "  make logs-dev     - Follow development logs"
	@echo "  make logs-prod    - Follow production logs"
	@echo "  make logs         - Follow all logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo ""
	@echo "Utilities:"
	@echo "  make status       - Show container status"
	@echo "  make backup       - Backup production database"
	@echo "  make clean        - Remove containers and images"
	@echo "  make clean-all    - Remove everything including volumes"

# Quick start targets (primary interface)
dev: build-dev up-dev
	@echo ""
	@echo "✅ Development environment started!"
	@echo "📍 Access at: http://localhost:3000"
	@echo "📊 Database: PostgreSQL on port 5434"
	@echo ""
	@echo "💡 Tip: Run 'make logs-dev' to view logs"
	@echo "💡 Tip: Run 'make stop-dev' to stop"

prod: build-prod up-prod
	@echo ""
	@echo "✅ Production environment started!"
	@echo "📍 Access at: http://localhost (port 80)"
	@echo "📊 Database: PostgreSQL on port 5433"
	@echo ""
	@echo "💡 Tip: Run 'make logs-prod' to view logs"
	@echo "💡 Tip: Run 'make stop-prod' to stop"

test: test-run

# Alternative start commands (aliases)
start-dev: dev
start-prod: prod
start-test: test

# Stop targets
stop-dev:
	@echo "Stopping development containers..."
	docker compose stop radiocalico-dev postgres-dev
	@echo "✅ Development containers stopped"

stop-prod:
	@echo "Stopping production containers..."
	docker compose stop radiocalico-prod postgres-prod
	@echo "✅ Production containers stopped"

stop-test:
	@echo "Tests run in ephemeral containers - nothing to stop"

# Build targets
build-dev:
	@echo "Building development image..."
	docker compose build radiocalico-dev

build-prod:
	@echo "Building production image..."
	docker compose build radiocalico-prod

# Up targets (start without build)
up-dev:
	@echo "Starting development containers..."
	docker compose up -d radiocalico-dev

up-prod:
	@echo "Starting production containers..."
	docker compose up -d radiocalico-prod

# Logs targets
logs-dev:
	@echo "Following development logs (Ctrl+C to exit)..."
	docker compose logs -f radiocalico-dev

logs-prod:
	@echo "Following production logs (Ctrl+C to exit)..."
	docker compose logs -f radiocalico-prod

# General targets
down:
	@echo "Stopping all containers..."
	docker compose down
	@echo "✅ All containers stopped"

logs:
	@echo "Following all logs (Ctrl+C to exit)..."
	docker compose logs -f

# Test targets
test-run:
	@echo "Running all tests..."
	@npm test
	@echo ""
	@echo "✅ Tests completed!"

test-watch:
	@echo "Running tests in watch mode (Ctrl+C to exit)..."
	@npm run test:watch

test-coverage:
	@echo "Running tests with coverage report..."
	@npm run test:coverage
	@echo ""
	@echo "📊 Coverage report generated in ./coverage/"

test-backend:
	@echo "Running backend tests only..."
	@npm run test:backend

test-frontend:
	@echo "Running frontend tests only..."
	@npm run test:frontend

# Docker-based test targets (if containers are running)
test-docker:
	@echo "Running tests in development container..."
	docker compose exec radiocalico-dev npm test

test-docker-coverage:
	@echo "Running tests with coverage in container..."
	docker compose exec radiocalico-dev npm run test:coverage

# Status and monitoring
status:
	@echo "Container Status:"
	@echo ""
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers running"
	@echo ""
	@echo "Quick Links:"
	@echo "  Development: http://localhost:3000"
	@echo "  Production:  http://localhost"

health: status

# Backup
backup:
	@echo "Backing up production database..."
	@mkdir -p backups
	docker run --rm \
		-v radiocalico-prod-db:/data \
		-v $$(pwd)/backups:/backup \
		alpine tar czf /backup/database-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "✅ Backup created in ./backups/"

# Clean up
clean:
	@echo "Removing containers and images..."
	docker compose down --rmi all
	@echo "✅ Cleanup complete"

clean-all: clean
	@echo "⚠️  WARNING: This will remove all volumes (including databases)!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "✅ All volumes removed"; \
	fi

# Shell access
shell-dev:
	@echo "Opening shell in development container..."
	docker compose exec radiocalico-dev sh

shell-prod:
	@echo "Opening shell in production container..."
	docker compose exec radiocalico-prod sh

shell-db-dev:
	@echo "Opening PostgreSQL shell in development database..."
	docker compose exec postgres-dev psql -U radiocalico -d radiocalico

shell-db-prod:
	@echo "Opening PostgreSQL shell in production database..."
	docker compose exec postgres-prod psql -U radiocalico -d radiocalico

# Restart targets
restart-dev: stop-dev dev

restart-prod: stop-prod prod

restart: down
	@echo "Restarting all containers..."
	@make dev
	@make prod
