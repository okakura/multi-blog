# Test Environment Setup

This document explains how to run tests for the multi-blog API in the Nx monorepo.

## Prerequisites

1. **Docker and Docker Compose** - for test database
2. **Rust** - latest stable version  
3. **Node.js 18+ and pnpm** - for Nx commands

## Test Database Setup

### Using Nx Services (Recommended)

The tests can use the database managed by Nx services:

```bash
# From monorepo root
nx run services:up
```

### Option 2: Separate Test Database

For isolated testing, create a separate test database:

```bash
# Create test database container
docker run --name multi-blog-test-db \
  -e POSTGRES_DB=multi_blog_test \
  -e POSTGRES_USER=blog_user \
  -e POSTGRES_PASSWORD=blog_password \
  -p 5433:5432 \
  -d postgres:15

# Set test database URL
export TEST_DATABASE_URL=postgresql://blog_user:blog_password@localhost:5433/multi_blog_test

# Run migrations on test database (from monorepo root)
nx run api:migrate
```

## Running Tests

### Using Nx (Recommended)

```bash
# From monorepo root
nx run api:test              # Run all API tests
nx run api:test-watch        # Run tests in watch mode
nx run-many --target=test    # Run tests across all projects
```

### Direct Cargo Commands

```bash
# From apps/api directory
cargo test
```

### Specific Test Modules

```bash
# Blog handler tests
cargo test blog_tests

# Admin handler tests
cargo test admin_tests

# Analytics tests
cargo test analytics_tests

# Middleware tests
cargo test middleware_tests
```

### Individual Tests

```bash
# Run a specific test
cargo test test_home_endpoint

# Run tests with output
cargo test -- --nocapture

# Run tests serially (required for database tests)
cargo test -- --test-threads=1
```

### Integration Tests Only

```bash
cargo test --test '*'
```

### Unit Tests Only

```bash
cargo test --lib
```

## Test Features

### Database Tests

- **Isolated**: Each test cleans up after itself
- **Serial**: Database tests run one at a time to avoid conflicts
- **Realistic**: Uses actual PostgreSQL database, not mocks

### API Tests

- **End-to-end**: Tests complete HTTP request/response cycle
- **Authentication**: Tests permission and role-based access
- **Error Handling**: Tests various error conditions

### Middleware Tests

- **Domain Resolution**: Tests domain middleware with various hostnames
- **Analytics**: Tests analytics context extraction
- **Authentication**: Tests JWT token validation

## Test Data

Tests automatically create and clean up:

- Test domains
- Test users with various roles
- Test posts (published and draft)
- Test analytics events
- Test permissions

## Environment Variables

```bash
# Required for tests
export TEST_DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/multi_blog_test

# Optional: Enable debug logging during tests
export RUST_LOG=debug
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: multi_blog_test
          POSTGRES_USER: blog_user
          POSTGRES_PASSWORD: blog_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install sqlx-cli
        run: cargo install sqlx-cli --no-default-features --features postgres

      - name: Run migrations
        run: sqlx migrate run
        env:
          DATABASE_URL: postgresql://blog_user:blog_password@localhost:5432/multi_blog_test

      - name: Run tests
        run: cargo test
        env:
          TEST_DATABASE_URL: postgresql://blog_user:blog_password@localhost:5432/multi_blog_test
```

## Troubleshooting

### "database connection failed"

- Ensure PostgreSQL is running: `docker-compose ps`
- Check connection string in `TEST_DATABASE_URL`
- Verify migrations ran: `sqlx migrate info`

### "test database does not exist"

```bash
# Create database manually
docker exec -it api-postgres-1 createdb -U blog_user multi_blog_test
```

### "test failure due to foreign key constraint"

- Tests are not properly cleaning up
- Run: `cargo test -- --test-threads=1` to force serial execution

### "permission denied for schema public"

```bash
# Grant permissions
docker exec -it api-postgres-1 psql -U blog_user -d multi_blog_test -c "GRANT ALL ON SCHEMA public TO blog_user;"
```

## Test Coverage

Generate test coverage report:

```bash
# Install cargo-tarpaulin
cargo install cargo-tarpaulin

# Generate coverage
cargo tarpaulin --out Html

# View coverage report
open tarpaulin-report.html
```

## Performance Testing

For load testing the API:

```bash
# Install wrk
brew install wrk  # macOS
# or
sudo apt-get install wrk  # Ubuntu

# Test blog endpoints
wrk -t12 -c400 -d30s http://localhost:8000/

# Test with specific domain
wrk -t12 -c400 -d30s -H "Host: testblog.com" http://localhost:8000/posts
```
