# Multi-Blog Platform - Frontend Application

> **Note**: This is the React frontend application within the Multi-Blog Platform Nx monorepo. For the complete setup and architecture overview, see the [main README](../../README.md).

A modern React frontend for the multi-tenant blog platform, built with React 19, TypeScript, Tailwind CSS, and comprehensive enterprise observability features.

## 🚀 Features

### Core Frontend Features
- **Multi-tenant Architecture**: Dynamic domain-based theming and content
- **Modern React Stack**: React 19 with TypeScript, Tailwind CSS v4, and Rsbuild
- **Rich Text Editor**: TipTap-based editor with image uploads and formatting
- **Admin Dashboard**: Content management, user management, and analytics
- **Authentication**: JWT-based auth with role-based access control
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: SWR for data fetching and caching
- **Routing**: React Router v7 with dynamic routes

### 🔍 Enterprise Observability Stack
- **Distributed Tracing**: OpenTelemetry + Jaeger v2 with OTLP support
- **Metrics Collection**: Prometheus v3.5.0 LTS with custom dashboards
- **Structured Logging**: Production-ready JSON logging with context
- **Performance Monitoring**: Request timing, database performance, error tracking
- **Analytics Intelligence**: User behavior tracking, search analytics, content metrics
- **Real-time Dashboards**: Grafana v12.1.0 with custom API performance dashboard

### 📊 Monitoring Capabilities
- **100% HTTP Request Tracing** - Complete request lifecycle monitoring
- **Database Performance Analysis** - Query timing and optimization insights
- **Authentication Security Monitoring** - Login patterns and security analytics
- **Business Logic Tracking** - Content access and user engagement metrics
- **Error Context Tracking** - Rich error reporting with span correlation
- **Code Quality**: Biome for linting and formatting

## 🏗️ Frontend Technology Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Rsbuild (fast Rust-based bundler)
- **State Management**: SWR for data fetching and caching
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Editor**: TipTap rich text editor
- **Code Quality**: Biome for linting and formatting
- **Monorepo**: Nx for task orchestration and caching

## 📦 Development within the Nx Monorepo

This frontend application is part of the Multi-Blog Platform Nx monorepo. For the complete setup, use the commands from the monorepo root.

### Quick Start (from monorepo root)

```bash
# Install dependencies for entire monorepo
pnpm install

# Start the complete stack
pnpm dev-all

# Or start just the frontend
nx run multi-blog:serve
```

## 🔍 Observability & Monitoring

The platform includes a comprehensive **enterprise-grade observability stack** providing deep insights into application performance, user behavior, and system health.

### 📊 Monitoring Dashboard

View real-time performance metrics in **Grafana** at http://localhost:3000:

- **API Performance Dashboard** - Request rates, response times, error rates
- **Database Performance** - Query timing, connection pools, slow queries
- **Authentication Metrics** - Login success rates, security events
- **User Analytics** - Content engagement, search patterns, traffic analysis

### 🕵️ Distributed Tracing

Analyze request flows with **Jaeger** at http://localhost:16686:

- **End-to-end request tracing** - Complete request lifecycle visibility
- **Database query analysis** - Performance bottleneck identification
- **Error context tracking** - Rich error reporting with span correlation
- **Performance optimization** - Identify slow operations and optimization opportunities

### 📈 Key Metrics

Monitor critical application metrics via **Prometheus** at http://localhost:9090:

```promql
# Request rate by endpoint
sum(rate(http_requests_total[5m])) by (http_route)

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Error rate percentage
(rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100
```

### 🎯 Quick Monitoring Commands

```bash
# Check all services status
make status

# View live metrics
curl http://localhost:9001/metrics

# Test tracing
curl -H "X-Trace-Id: test-123" http://localhost:8000/blog/posts
```

📚 **Detailed Documentation**: See [docs/OBSERVABILITY_ARCHITECTURE.md](docs/OBSERVABILITY_ARCHITECTURE.md) for complete observability setup and usage guide.

### Manual Setup

1. **Clone and install**:

```bash
git clone <repository-url>
cd multi-blog
pnpm install
```

2. **Start database**:

```bash
make db-up
# or manually: cd api && docker-compose up -d
```

3. **Configure environment**:

```bash
cd api
cp .env.example .env
# Edit .env with your configuration
```

4. **Run migrations and start servers**:

```bash
# Backend (terminal 1)
cd api && cargo run --bin api

# Frontend (terminal 2)
pnpm dev
```

## 🌐 Services

Once running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/swagger-ui
- **Health Check**: http://localhost:8000/health
- **PgAdmin**: http://localhost:8080

## 🛠️ Development Commands

### Makefile Commands

| Command             | Description                     |
| ------------------- | ------------------------------- |
| `make help`         | Show all available commands     |
| `make setup`        | Complete environment setup      |
| `make dev-both`     | Start both servers concurrently |
| `make dev-frontend` | Start only frontend server      |
| `make dev-backend`  | Start only backend server       |
| `make build`        | Build for production            |
| `make test`         | Run all tests                   |
| `make lint`         | Run linting                     |
| `make format`       | Format code                     |
| `make db-up`        | Start database containers       |
| `make db-down`      | Stop database containers        |
| `make clean`        | Clean build artifacts           |

### Code Quality

The project uses **Biome** for linting and formatting:

```bash
# Check and fix issues
make lint-fix

# Format code
make format

# Run all quality checks
make check
```

## 🔐 Authentication

### Default Users

After running migrations, these test users are available:

| Email             | Password    | Role           |
| ----------------- | ----------- | -------------- |
| john@example.com  | admin123    | platform_admin |
| jane@example.com  | password123 | domain_user    |
| mike@example.com  | demo123     | domain_user    |
| sarah@example.com | test123     | domain_user    |
| alex@example.com  | user123     | domain_user    |

### JWT Configuration

The backend uses JWT tokens for authentication. Configure in `api/.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGINS=http://localhost:8000,http://localhost:5173,http://localhost:8080
```

2. **Install frontend dependencies**:

```bash
pnpm install
```

3. **Set up the backend**:

```bash
cd api
cargo build
```

4. **Configure environment**:

```bash
# Copy the example environment file
cp api/.env.example api/.env
# Edit api/.env with your database URL and other settings
```

5. **Run database migrations**:

```bash
cd api
cargo run # Migrations run automatically on startup
```

## 🚀 Development

### Start the development servers

**Frontend** (runs on http://localhost:5173):

```bash
pnpm dev
```

## 🗄️ Database

### PostgreSQL Setup

The project uses PostgreSQL with Docker for development:

```bash
# Start database containers
make db-up

# View database logs
make db-logs

# Reset database (WARNING: destroys data)
make db-reset
```

### Database Schema

The platform includes these main tables:

- `users` - User accounts and authentication
- `domains` - Multi-tenant domain configuration
- `posts` - Blog post content
- `user_domain_permissions` - Role-based access control
- `analytics_events` - Usage tracking and metrics

### Migrations

Database migrations are automatically applied on server startup. To manually run:

```bash
cd api && cargo run --bin api
```

## 📁 Project Structure

```
multi-blog/
├── src/                      # React frontend source
│   ├── components/           # Reusable UI components
│   │   ├── admin/           # Admin dashboard components
│   │   └── modals/          # Modal dialogs
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   └── auth/            # Authentication pages
│   ├── contexts/            # React contexts (Auth, Domain)
│   ├── hooks/               # Custom hooks and data fetching
│   ├── services/            # API services and utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── api/                     # Rust backend
│   ├── src/
│   │   ├── handlers/        # Route handlers (auth, admin, blog)
│   │   ├── bin/             # Binary utilities
│   │   ├── lib.rs           # Core middleware and utilities
│   │   └── main.rs          # Application entry point
│   ├── migrations/          # SQLx database migrations
│   └── docker-compose.yml   # Database containers
├── public/                  # Static assets
├── Makefile                 # Development commands
└── biome.json              # Code quality configuration
```

## 🚢 Production Deployment

### Building for Production

```bash
# Build both frontend and backend
make build

# Or individually
pnpm build                    # Frontend
cd api && cargo build --release  # Backend
```

### Environment Configuration

For production, ensure these environment variables are set:

```env
# Backend (api/.env)
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-very-secure-random-jwt-secret-key
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RUST_LOG=info

# Frontend build
VITE_API_URL=https://api.yourdomain.com
```

### Docker Deployment

The backend includes a docker-compose.yml for database services. For full deployment:

1. Build the Rust binary: `cargo build --release`
2. Build the frontend: `pnpm build`
3. Deploy the `dist/` folder to your static hosting
4. Deploy the backend binary to your server
5. Set up PostgreSQL database with migrations

## 🔧 Configuration

### Domain Management

The platform supports multiple domains configured through the admin interface:

- **Domain Settings**: Configure per-domain themes and branding
- **User Permissions**: Assign role-based access per domain
- **Content Isolation**: Each domain has independent blog content
- **Analytics**: Separate tracking and metrics per domain

### Role-Based Access

- **platform_admin**: Full system access, user management
- **domain_user**: Domain-specific access based on permissions
- **Permissions per domain**: admin, editor, viewer

## 🧪 Testing

```bash
# Run all tests
make test

# Frontend tests only
make test-frontend

# Backend tests only
make test-backend

# Run specific test
cd api && cargo test test_name
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: Backend runs on port 8000, frontend on 5173
2. **Database connection**: Ensure PostgreSQL is running via `make db-up`
3. **JWT errors**: Check JWT_SECRET is set in `api/.env`
4. **CORS issues**: Verify CORS_ORIGINS includes your frontend URL

### Debug Commands

```bash
# Check service health
make health

# View application logs
make logs

# Check database connection
make db-logs

# Verify environment
cd api && cargo run --bin api
```

### Getting Help

1. Check the troubleshooting section above
2. Review logs with `make logs`
3. Ensure all prerequisites are installed with `make check-deps`
4. Try a clean setup with `make clean && make setup`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the code style (use `make format`)
4. Run tests: `make test`
5. Run quality checks: `make check`
6. Submit a pull request

### Code Quality

The project uses Biome for consistent code formatting and linting:

```bash
make lint        # Check for issues
make lint-fix    # Auto-fix issues
make format      # Format code
make check       # Run all quality checks
```

## 📚 API Documentation

When the backend is running, explore the interactive API documentation:

- **Swagger UI**: http://localhost:8000/swagger-ui
- **OpenAPI JSON**: http://localhost:8000/api-docs/openapi.json

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
