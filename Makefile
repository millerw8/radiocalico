# Makefile for Radio Calico Docker Management
# Provides convenient shortcuts for common Docker operations

.PHONY: help dev prod build-dev build-prod up-dev up-prod down logs logs-dev logs-prod test clean backup

# Default target
help:
	@echo "Radio Calico Docker Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Build and start development container"
	@echo "  make build-dev    - Build development image"
	@echo "  make up-dev       - Start development container"
	@echo "  make logs-dev     - Follow development logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Build and start production container"
	@echo "  make build-prod   - Build production image"
	@echo "  make up-prod      - Start production container"
	@echo "  make logs-prod    - Follow production logs"
	@echo ""
	@echo "General:"
	@echo "  make down         - Stop all containers"
	@echo "  make logs         - Follow all logs"
	@echo "  make test         - Run tests in development container"
	@echo "  make backup       - Backup production database"
	@echo "  make clean        - Remove containers and images"

# Development targets
dev: build-dev up-dev logs-dev

build-dev:
	@echo "Building development image..."
	docker compose build radiocalico-dev

up-dev:
	@echo "Starting development container..."
	docker compose up -d radiocalico-dev
	@echo "Development server running at http://localhost:3000"

logs-dev:
	@echo "Following development logs (Ctrl+C to exit)..."
	docker compose logs -f radiocalico-dev

# Production targets
prod: build-prod up-prod
	@echo "Production server running at http://localhost:3000"
	@echo "Run 'make logs-prod' to view logs"

build-prod:
	@echo "Building production image..."
	docker compose -f docker compose.prod.yml build

up-prod:
	@echo "Starting production container..."
	docker compose -f docker compose.prod.yml up -d

logs-prod:
	@echo "Following production logs (Ctrl+C to exit)..."
	docker compose -f docker compose.prod.yml logs -f

# General targets
down:
	@echo "Stopping all containers..."
	docker compose down
	docker compose -f docker compose.prod.yml down

logs:
	@echo "Following all logs (Ctrl+C to exit)..."
	docker compose logs -f

test:
	@echo "Running tests in development container..."
	docker compose exec radiocalico-dev npm test

test-coverage:
	@echo "Running tests with coverage..."
	docker compose exec radiocalico-dev npm run test:coverage

backup:
	@echo "Backing up production database..."
	@mkdir -p backups
	docker run --rm \
		-v radiocalico-prod-db:/data \
		-v $$(pwd)/backups:/backup \
		alpine tar czf /backup/database-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "Backup created in ./backups/"

clean:
	@echo "Removing containers and images..."
	docker compose down --rmi all
	docker compose -f docker compose.prod.yml down --rmi all
	@echo "Cleanup complete"

clean-all: clean
	@echo "WARNING: This will remove all volumes (including databases)!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker compose -f docker compose.prod.yml down -v; \
		echo "All volumes removed"; \
	fi

# Shell access
shell-dev:
	@echo "Opening shell in development container..."
	docker compose exec radiocalico-dev sh

shell-prod:
	@echo "Opening shell in production container..."
	docker compose exec radiocalico-prod sh

# Health check
health:
	@echo "Checking container health..."
	@docker ps --filter name=radiocalico --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
