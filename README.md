# Multi-Blog Platform

A full-stack multi-tenant blog platform built with React (frontend) and Rust/Axum (backend), managed as an Nx monorepo. Supports multiple domains with independent blog instances, user authentication, and enterprise-grade observability.

## 🚀 Features

### Core Platform
- **Multi-tenant Architecture**: Support for multiple blog domains
- **Modern Frontend**: React 19 with TypeScript, Tailwind CSS, and Rsbuild
- **Robust Backend**: Rust with Axum framework and PostgreSQL
- **Authentication**: JWT-based auth with role-based access control
- **Admin Dashboard**: Content management, user management, and analytics
- **Domain Management**: Configure themes and settings per domain
- **Rich Text Editor**: TipTap-based editor with image uploads

### 🔍 Enterprise Observability Stack
- **Distributed Tracing**: OpenTelemetry + Jaeger v2 with OTLP support
- **Metrics Collection**: Prometheus v3.5.0 LTS with custom dashboards
- **Structured Logging**: Production-ready JSON logging with context
- **Performance Monitoring**: Request timing, database performance, error tracking
- **Analytics Intelligence**: User behavior tracking, search analytics, content metrics
- **Real-time Dashboards**: Grafana v12.1.0 with custom API performance dashboard

## 🏗️ Architecture & Nx Monorepo

This project is organized as an Nx monorepo with the following structure:

```
multi-blog/
├── apps/
│   ├── multi-blog/          # React frontend application
│   ├── api/                 # Rust backend API
│   └── admin-ui/           # Admin dashboard (future)
├── libs/                   # Shared libraries (future)
├── services/               # Docker services and database
├── docs/                   # Documentation
└── nx.json                 # Nx configuration
```

### Technologies

**Frontend (`apps/multi-blog`)**
- React 19 + TypeScript
- Tailwind CSS v4
- Rsbuild (fast bundler)
- SWR for data fetching
- React Router v7

**Backend (`apps/api`)**
- Rust 1.70+ 
- Axum web framework
- PostgreSQL + SQLx
- JWT authentication
- OpenTelemetry tracing

**Monorepo Management**
- Nx 21.3.5 for task orchestration
- pnpm workspaces for package management
- @monodon/rust plugin for Rust integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Rust 1.70+
- Docker and Docker Compose
- Git

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd multi-blog

# Install all dependencies
pnpm install

# Start the database and services
nx run services:up

# Run database migrations
nx run api:migrate
```

### 2. Development

**Start everything at once:**
```bash
pnpm dev-all
# This runs: services + API + frontend concurrently
```

**Or start components individually:**
```bash
# Database and monitoring services
nx run services:up

# Backend API (http://localhost:8000)
nx run api:serve

# Frontend (http://localhost:5173)
nx run multi-blog:serve
```

**Using the Makefile (legacy commands):**
```bash
# Complete setup
make setup

# Start both servers
make dev-both

# Individual servers
make dev-frontend
make dev-backend
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/swagger-ui
- **Grafana Dashboard**: http://localhost:3000
- **PgAdmin**: http://localhost:8080

## 📋 Development Commands

### Nx Commands (Recommended)

```bash
# Development servers
nx run multi-blog:serve          # Start frontend
nx run api:serve                 # Start backend API
nx run services:up               # Start database & monitoring

# Build applications
nx run multi-blog:build          # Build frontend
nx run api:build                 # Build backend

# Run tests
nx run multi-blog:test           # Frontend tests
nx run api:test                  # Backend tests
nx run-many --target=test        # All tests

# Linting and formatting
nx run multi-blog:lint           # Lint frontend
nx run api:lint                  # Lint backend
nx run-many --target=lint        # Lint all projects

# Database operations
nx run api:migrate               # Run migrations
nx run services:seed             # Seed database
nx run services:reset            # Reset database

# Monitoring and services
nx run services:up               # Start all services
nx run services:down             # Stop all services
nx run services:logs             # View service logs
```

### Package.json Scripts

```bash
# Quick start commands
pnpm dev-blog                    # Start frontend only
pnpm dev-api                     # Start backend only
pnpm dev-services                # Start services only
pnpm dev-all                     # Start everything

# Build and test
pnpm build                       # Build all applications
pnpm test                        # Run all tests
pnpm lint                        # Lint all projects
pnpm format                      # Format all code

# Database
pnpm migrate                     # Run migrations
pnpm stop-services               # Stop services
```

### Legacy Makefile Support

The original Makefile commands are still supported for backwards compatibility:

```bash
make setup                       # Complete setup
make dev-both                    # Start frontend + backend
make dev-frontend                # Start frontend only
make dev-backend                 # Start backend only
make test                        # Run tests
make lint                        # Lint code
make format                      # Format code
```

## 🧪 Testing

```bash
# Run all tests
nx run-many --target=test

# Individual test suites
nx run multi-blog:test           # Frontend tests
nx run api:test                  # Backend Rust tests

# Watch mode
nx run multi-blog:test --watch   # Frontend test watch
nx run api:test-watch            # Backend test watch
```

## 🏗️ Building for Production

```bash
# Build all applications
nx run-many --target=build

# Individual builds
nx run multi-blog:build          # Frontend production build
nx run api:build --configuration=production  # Backend release build

# Preview production build
nx run multi-blog:preview        # Preview frontend build
```

## 📁 Project Structure

```
apps/
├── multi-blog/                  # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer
│   │   ├── contexts/           # React contexts
│   │   └── utils/              # Utility functions
│   ├── project.json            # Nx project configuration
│   └── package.json            # Frontend dependencies
│
├── api/                         # Rust backend
│   ├── src/
│   │   ├── handlers/           # Request handlers
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic
│   │   ├── extractors/         # Request extractors
│   │   └── validation/         # Input validation
│   ├── project.json            # Nx project configuration
│   └── Cargo.toml              # Rust dependencies
│
services/                        # Infrastructure services
├── database/                   # PostgreSQL setup
├── monitoring/                 # Grafana & Prometheus
└── project.json                # Nx service commands

docs/                           # Documentation
├── api/                        # Backend documentation
└── ui/                         # Frontend documentation
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in the appropriate directories:

**Frontend (`apps/multi-blog/.env`):**
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Multi-Blog Platform
```

**Backend (`apps/api/.env`):**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/multi_blog
JWT_SECRET=your-secret-key
RUST_LOG=debug
```

### Nx Configuration

The monorepo is configured with:
- **Nx Cloud**: For distributed caching and CI optimization
- **Rust Plugin**: `@monodon/rust` for Rust project integration
- **Task Dependencies**: Proper build order and caching
- **Project Boundaries**: Enforced module boundaries

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [API Documentation](./docs/api/) - Backend API guides and references
- [UI Documentation](./docs/ui/) - Frontend architecture and guides
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow and guidelines

## 🤝 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Development workflow
- Code style guidelines  
- Testing requirements
- Pull request process

## 📄 License

This project is licensed under the ISC License.
