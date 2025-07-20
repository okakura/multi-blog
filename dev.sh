#!/bin/bash

# Multi-Blog Platform Development Helper
# This script helps start both frontend and backend development servers

set -e

echo "🚀 Multi-Blog Platform Development Setup"
echo "========================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists pnpm; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

if ! command_exists cargo; then
    echo "❌ Rust/Cargo is not installed. Please install Rust first."
    exit 1
fi

if ! command_exists psql; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
fi

echo "✅ Prerequisites check complete!"
echo ""

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    pnpm install
    echo "✅ Frontend dependencies installed!"
    echo ""
fi

# Build Rust backend if needed
if [ ! -d "api/target" ]; then
    echo "🔨 Building Rust backend..."
    cd api
    cargo build
    cd ..
    echo "✅ Backend build complete!"
    echo ""
fi

echo "🎯 Available commands:"
echo "  dev:frontend  - Start frontend development server (port 5173)"
echo "  dev:backend   - Start backend development server (port 3000)"
echo "  dev:both      - Start both servers concurrently"
echo "  build         - Build both frontend and backend for production"
echo "  test          - Run all tests"
echo ""

case "${1:-help}" in
    "dev:frontend")
        echo "🌐 Starting frontend development server..."
        pnpm dev
        ;;
    "dev:backend")
        echo "⚙️  Starting backend development server..."
        cd api
        cargo run
        ;;
    "dev:both")
        echo "🚀 Starting both development servers..."
        echo "Frontend: http://localhost:5173"
        echo "Backend:  http://localhost:3000"
        echo "API Docs: http://localhost:3000/swagger-ui"
        echo ""
        # Start backend in background
        cd api
        cargo run &
        BACKEND_PID=$!
        cd ..
        
        # Start frontend in foreground
        pnpm dev &
        FRONTEND_PID=$!
        
        # Wait for interrupt
        trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
        wait
        ;;
    "build")
        echo "🏗️  Building for production..."
        echo "Building frontend..."
        pnpm build
        echo "Building backend..."
        cd api
        cargo build --release
        cd ..
        echo "✅ Production build complete!"
        ;;
    "test")
        echo "🧪 Running tests..."
        echo "Frontend tests..."
        pnpm test
        echo "Backend tests..."
        cd api
        cargo test
        cd ..
        echo "✅ All tests complete!"
        ;;
    "help"|*)
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  dev:frontend  - Start frontend development server"
        echo "  dev:backend   - Start backend development server"
        echo "  dev:both      - Start both servers concurrently"
        echo "  build         - Build for production"
        echo "  test          - Run all tests"
        echo "  help          - Show this help message"
        ;;
esac
