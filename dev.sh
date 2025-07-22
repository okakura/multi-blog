#!/bin/bash

# Multi-Blog Platform Development Helper
# This script is now a simple wrapper for the Makefile

set -e

echo "🚀 Multi-Blog Platform Development"
echo "=================================="
echo ""
echo "⚠️  This script is deprecated. Please use the Makefile instead!"
echo ""
echo "Quick migration guide:"
echo "  ./dev.sh dev:frontend  →  make dev-frontend"
echo "  ./dev.sh dev:backend   →  make dev-backend"
echo "  ./dev.sh dev:both      →  make dev-both"
echo "  ./dev.sh build         →  make build"
echo "  ./dev.sh test          →  make test"
echo ""
echo "Run 'make help' to see all available commands."
echo ""

# For backward compatibility, map old commands to new ones
case "${1:-help}" in
    "dev:frontend")
        echo "🔄 Redirecting to: make dev-frontend"
        make dev-frontend
        ;;
    "dev:backend")
        echo "🔄 Redirecting to: make dev-backend"
        make dev-backend
        ;;
    "dev:both")
        echo "� Redirecting to: make dev-both"
        make dev-both
        ;;
    "build")
        echo "🔄 Redirecting to: make build"
        make build
        ;;
    "test")
        echo "🔄 Redirecting to: make test"
        make test
        ;;
    "help"|*)
        echo "Available commands (deprecated - use Makefile):"
        echo "  dev:frontend  - Start frontend development server"
        echo "  dev:backend   - Start backend development server"
        echo "  dev:both      - Start both servers concurrently"
        echo "  build         - Build for production"
        echo "  test          - Run all tests"
        echo ""
        echo "🎯 Use 'make help' for the complete command list!"
        ;;
esac
