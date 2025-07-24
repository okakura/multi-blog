#!/bin/bash

# Test runner script for multi-blog API
set -e

echo "🚀 Multi-Blog API Test Runner"
echo "=============================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database is running
if ! docker-compose ps | grep -q "api-postgres-1.*Up"; then
    echo "🐘 Starting PostgreSQL database..."
    docker-compose up -d postgres
    sleep 5
fi

# Set test database URL
export TEST_DATABASE_URL=${TEST_DATABASE_URL:-"postgresql://blog_user:blog_password@localhost:5432/multi_blog_dev"}

echo "📊 Database URL: $TEST_DATABASE_URL"

# Install dependencies
echo "📦 Installing dependencies..."
cargo build

# Run database migrations
echo "🔄 Running migrations..."
if ! sqlx migrate run --database-url "$TEST_DATABASE_URL"; then
    echo "❌ Migration failed. Creating database..."
    docker exec -it api-postgres-1 createdb -U blog_user multi_blog_test 2>/dev/null || true
    sqlx migrate run --database-url "$TEST_DATABASE_URL"
fi

# Run tests based on arguments
case "${1:-all}" in
    "unit")
        echo "🧪 Running unit tests..."
        cargo test --lib
        ;;
    "integration")
        echo "🔗 Running integration tests..."
        cargo test --test '*' -- --test-threads=1
        ;;
    "blog")
        echo "📝 Running blog tests..."
        cargo test blog_tests -- --test-threads=1
        ;;
    "admin")
        echo "👨‍💼 Running admin tests..."
        cargo test admin_tests -- --test-threads=1
        ;;
    "analytics")
        echo "📈 Running analytics tests..."
        cargo test analytics_tests -- --test-threads=1
        ;;
    "middleware")
        echo "⚙️ Running middleware tests..."
        cargo test middleware_tests -- --test-threads=1
        ;;
    "coverage")
        echo "📊 Running tests with coverage..."
        if ! command -v cargo-tarpaulin &> /dev/null; then
            echo "Installing cargo-tarpaulin..."
            cargo install cargo-tarpaulin
        fi
        cargo tarpaulin --out Html --output-dir target/coverage
        echo "📈 Coverage report generated: target/coverage/tarpaulin-report.html"
        ;;
    "all"|*)
        echo "🎯 Running all tests..."
        cargo test -- --test-threads=1
        ;;
esac

echo ""
echo "✅ Tests completed successfully!"
echo ""
echo "💡 Usage:"
echo "  ./test.sh unit        - Run unit tests only"
echo "  ./test.sh integration - Run integration tests only"
echo "  ./test.sh blog        - Run blog handler tests"
echo "  ./test.sh admin       - Run admin handler tests"
echo "  ./test.sh analytics   - Run analytics tests"
echo "  ./test.sh middleware  - Run middleware tests"
echo "  ./test.sh coverage    - Run tests with coverage report"
echo "  ./test.sh all         - Run all tests (default)"
