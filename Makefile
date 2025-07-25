# React Profiler (frontend only)
dev-profiler: ## Start frontend in React profiling mode (for Profiler)
	@echo "🌐 Starting frontend in React Profiler mode..."
	PNPM_FILTER_PROFILING=1 PROFILING=true pnpm dev
# Multi-Blog Platform Development Makefile
# ========================================

.PHONY: help install clean dev-frontend dev-backend dev-both build test lint format check docker-up docker-down

# Default target
help: ## Show this help message
	@echo "🚀 Multi-Blog Platform Development Commands"
	@echo "==========================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🌐 Frontend runs on: http://localhost:5173"
	@echo "⚙️  Backend runs on:  http://localhost:8000"
	@echo "📚 API Docs at:      http://localhost:8000/swagger-ui"
	@echo "🗄️  PgAdmin at:       http://localhost:8080"

# Prerequisites check
check-deps: ## Check if required tools are installed
	@echo "📋 Checking prerequisites..."
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed."; exit 1; }
	@command -v cargo >/dev/null 2>&1 || { echo "❌ Rust/Cargo is required but not installed."; exit 1; }
	@echo "✅ Prerequisites check complete!"

# Installation
install: check-deps ## Install all dependencies
	@echo "📦 Installing frontend dependencies..."
	pnpm install
	@echo "🔨 Building Rust backend dependencies..."
	cd api && cargo build
	@echo "✅ All dependencies installed!"

# Development servers
dev-frontend: ## Start frontend development server
	@echo "🌐 Starting frontend development server..."
	pnpm dev

dev-backend: ## Start backend development server  
	@echo "⚙️  Starting backend development server..."
	cd api && cargo run --bin api

dev-both: ## Start both frontend and backend concurrently
	@echo "🚀 Starting both development servers..."
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000"
	@echo "API Docs: http://localhost:8000/swagger-ui"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@trap 'echo "🛑 Stopping servers..."; kill 0; exit 0' INT; \
	cd api && cargo run --bin api & \
	pnpm dev & \
	wait

# Building
build: ## Build both frontend and backend for production
	@echo "🏗️  Building for production..."
	@echo "Building frontend..."
	pnpm build
	@echo "Building backend..."
	cd api && cargo build --release
	@echo "✅ Production build complete!"

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	@echo "Frontend tests..."
	pnpm test || true
	@echo "Backend tests..."
	cd api && cargo test
	@echo "✅ Tests complete!"

test-frontend: ## Run frontend tests only
	@echo "🧪 Running frontend tests..."
	pnpm test

test-backend: ## Run backend tests only
	@echo "🧪 Running backend tests..."
	cd api && cargo test

# Code quality
lint: ## Run linting on frontend code
	@echo "🔍 Linting frontend code..."
	pnpm biome check src/

lint-fix: ## Run linting with auto-fix on frontend code
	@echo "🔧 Linting and fixing frontend code..."
	pnpm biome check --fix src/

format: ## Format frontend code
	@echo "✨ Formatting frontend code..."
	pnpm biome format --write src/

format-check: ## Check frontend code formatting
	@echo "📝 Checking frontend code formatting..."
	pnpm biome format src/

check: ## Run all quality checks (lint + format check)
	@echo "🔍 Running all quality checks..."
	pnpm biome check src/
	cd api && cargo clippy -- -D warnings
	cd api && cargo fmt -- --check

fix: ## Fix all auto-fixable issues
	@echo "🔧 Fixing all auto-fixable issues..."
	pnpm biome check --fix src/
	cd api && cargo fmt

# Database
db-up: ## Start database containers
	@echo "🗄️  Starting database containers..."
	cd services && docker compose -f database/compose.yaml up -d
	@echo "✅ Database containers started!"
	@echo "🗄️  PostgreSQL: localhost:5432"
	@echo "📊 PgAdmin: http://localhost:8080"
	@echo "🔴 Redis: localhost:6379"

db-down: ## Stop database containers
	@echo "🛑 Stopping database containers..."
	cd services && docker compose -f database/compose.yaml down
	@echo "✅ Database containers stopped!"

db-logs: ## Show database container logs
	cd services && docker compose -f database/compose.yaml logs -f postgres

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "⚠️  This will destroy all database data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	cd services && docker compose -f database/compose.yaml down -v
	cd services && docker compose -f database/compose.yaml up -d
	@echo "🔄 Database reset complete!"

# Monitoring
monitoring-up: ## Start monitoring containers (Prometheus, Grafana, Jaeger)
	@echo "📊 Starting monitoring containers..."
	cd services && docker compose -f monitoring/compose.yaml up -d
	@echo "✅ Monitoring containers started!"
	@echo "📈 Prometheus: http://localhost:9090"
	@echo "📊 Grafana: http://localhost:3000"
	@echo "🔍 Jaeger: http://localhost:16686"

monitoring-down: ## Stop monitoring containers
	@echo "🛑 Stopping monitoring containers..."
	cd services && docker compose -f monitoring/compose.yaml down
	@echo "✅ Monitoring containers stopped!"

monitoring-logs: ## Show monitoring container logs
	cd services && docker compose -f monitoring/compose.yaml logs -f

# All services
services-up: ## Start all services (database + monitoring)
	@echo "� Starting all services..."
	cd services && docker compose -f main.yaml up -d
	@echo "✅ All services started!"
	@echo "🗄️  PostgreSQL: localhost:5432"
	@echo "📊 PgAdmin: http://localhost:8080"
	@echo "🔴 Redis: localhost:6379"
	@echo "📈 Prometheus: http://localhost:9090"
	@echo "📊 Grafana: http://localhost:3000"
	@echo "🔍 Jaeger: http://localhost:16686"

services-down: ## Stop all services
	@echo "🛑 Stopping all services..."
	cd services && docker compose -f main.yaml down
	@echo "✅ All services stopped!"

services-logs: ## Show logs from all services
	@echo "📋 Showing service logs..."
	cd services && docker compose -f main.yaml logs -f

services-status: ## Show status of all services
	@echo "📊 Service status:"
	cd services && docker compose -f main.yaml ps

# Database migrations
db-migrate: ## Run database migrations
	@echo "🔄 Running database migrations..."
	cd apps/api && cargo run --bin api -- migrate
	@echo "✅ Migrations complete!"

# Docker (legacy aliases)
docker-up: services-up ## Alias for services-up

docker-down: services-down ## Alias for services-down

docker-start: services-up ## Alias for services-up
docker-stop: services-down ## Alias for services-down

docker-restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	cd services && docker compose -f main.yaml restart
	@echo "✅ All services restarted!"

docker-logs: services-logs ## Alias for services-logs

docker-status: services-status ## Alias for services-status

# Cleanup
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf node_modules/.cache
	rm -rf dist
	cd api && cargo clean
	@echo "✅ Clean complete!"

clean-all: clean ## Clean everything including dependencies
	@echo "🧹 Cleaning everything..."
	rm -rf node_modules
	cd api && cargo clean
	@echo "✅ Deep clean complete!"

# Development utilities
generate-hashes: ## Generate password hashes for development
	@echo "🔐 Generating password hashes..."
	cd apps/api && cargo run --bin generate_hashes

logs: ## Show application logs
	@echo "📋 Showing application logs..."
	cd apps/api && cargo run --bin api 2>&1 | grep -E "(INFO|WARN|ERROR|DEBUG)"

# Quick commands
dev: dev-both ## Alias for dev-both

start: dev-both ## Alias for dev-both

stop: ## Stop all running processes
	@echo "🛑 Stopping all processes..."
	@pkill -f "cargo run" || true
	@pkill -f "pnpm dev" || true
	@pkill -f "rsbuild" || true
	@echo "✅ All processes stopped!"

# Production
prod-build: build ## Alias for build

serve-frontend: ## Serve built frontend locally
	@echo "🌐 Serving frontend build..."
	pnpm preview

# Health checks
health: ## Check if services are running
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:8000/health | jq . || echo "❌ Backend not responding"
	@curl -s http://localhost:5173 >/dev/null && echo "✅ Frontend responding" || echo "❌ Frontend not responding"

# Documentation
docs: ## Open API documentation
	@echo "📚 Opening API documentation..."
	@open http://localhost:8000/swagger-ui || echo "Visit: http://localhost:8000/swagger-ui"

pgadmin: ## Open PgAdmin
	@echo "📊 Opening PgAdmin..."
	@open http://localhost:8080 || echo "Visit: http://localhost:8080"

# Git helpers
status: ## Show git status
	@git status --short

push: ## Push changes to git
	@git add .
	@git status
	@read -p "Commit message: " msg && git commit -m "$$msg" && git push

# Environment setup
setup: install db-up ## Complete development environment setup
	@echo "🎉 Development environment setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev-both    - Start both servers"
	@echo "  make health      - Check service health"
	@echo "  make docs        - View API documentation"
