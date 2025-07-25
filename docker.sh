#!/bin/bash

# Multi-Blog Docker Services Manager
# =================================

set -e

SERVICES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/services" && pwd)"

usage() {
    echo "🚀 Multi-Blog Docker Services Manager"
    echo "======================================"
    echo ""
    echo "Usage: $0 <command> [service]"
    echo ""
    echo "Commands:"
    echo "  up [service]      - Start services"
    echo "  down [service]    - Stop services"
    echo "  logs [service]    - Show logs"
    echo "  ps [service]      - Show service status"
    echo "  restart [service] - Restart services"
    echo "  reset             - Reset all services (destroys data!)"
    echo ""
    echo "Services:"
    echo "  database          - PostgreSQL, Redis, PgAdmin"
    echo "  monitoring        - Prometheus, Grafana, Jaeger"
    echo "  all (default)     - All services"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start all services"
    echo "  $0 up database          # Start only database services"
    echo "  $0 logs monitoring      # Show monitoring logs"
    echo "  $0 down                 # Stop all services"
    echo ""
    echo "🌐 Service URLs:"
    echo "  PostgreSQL:  localhost:5432"
    echo "  PgAdmin:     http://localhost:8080"
    echo "  Redis:       localhost:6379"
    echo "  Prometheus:  http://localhost:9090"
    echo "  Grafana:     http://localhost:3000"
    echo "  Jaeger:      http://localhost:16686"
}

get_compose_file() {
    local service=${1:-all}
    case $service in
        database|db)
            echo "-f database/compose.yaml"
            ;;
        monitoring|mon)
            echo "-f monitoring/compose.yaml"
            ;;
        all|*)
            echo "-f main.yaml"
            ;;
    esac
}

cmd_up() {
    local service=${1:-all}
    local compose_file=$(get_compose_file $service)
    
    echo "🚀 Starting $service services..."
    cd "$SERVICES_DIR"
    docker compose $compose_file up -d
    echo "✅ $service services started!"
    
    if [[ "$service" == "all" || "$service" == "database" || "$service" == "db" ]]; then
        echo "🗄️  PostgreSQL: localhost:5432"
        echo "📊 PgAdmin: http://localhost:8080"
        echo "🔴 Redis: localhost:6379"
    fi
    
    if [[ "$service" == "all" || "$service" == "monitoring" || "$service" == "mon" ]]; then
        echo "📈 Prometheus: http://localhost:9090"
        echo "📊 Grafana: http://localhost:3000"
        echo "🔍 Jaeger: http://localhost:16686"
    fi
}

cmd_down() {
    local service=${1:-all}
    local compose_file=$(get_compose_file $service)
    
    echo "🛑 Stopping $service services..."
    cd "$SERVICES_DIR"
    docker compose $compose_file down
    echo "✅ $service services stopped!"
}

cmd_logs() {
    local service=${1:-all}
    local compose_file=$(get_compose_file $service)
    
    echo "📋 Showing $service logs..."
    cd "$SERVICES_DIR"
    docker compose $compose_file logs -f
}

cmd_ps() {
    local service=${1:-all}
    local compose_file=$(get_compose_file $service)
    
    echo "📊 $service service status:"
    cd "$SERVICES_DIR"
    docker compose $compose_file ps
}

cmd_restart() {
    local service=${1:-all}
    local compose_file=$(get_compose_file $service)
    
    echo "🔄 Restarting $service services..."
    cd "$SERVICES_DIR"
    docker compose $compose_file restart
    echo "✅ $service services restarted!"
}

cmd_reset() {
    echo "⚠️  This will destroy all data in volumes!"
    read -p "Are you sure? (y/N): " confirm
    if [[ "$confirm" != "y" ]]; then
        echo "❌ Reset cancelled"
        exit 1
    fi
    
    echo "🛑 Stopping and removing all services..."
    cd "$SERVICES_DIR"
    docker compose -f main.yaml down -v
    echo "🚀 Starting all services..."
    docker compose -f main.yaml up -d
    echo "✅ Reset complete!"
}

# Main logic
case "${1:-help}" in
    up|start)
        cmd_up "$2"
        ;;
    down|stop)
        cmd_down "$2"
        ;;
    logs|log)
        cmd_logs "$2"
        ;;
    ps|status)
        cmd_ps "$2"
        ;;
    restart)
        cmd_restart "$2"
        ;;
    reset)
        cmd_reset
        ;;
    help|--help|-h|*)
        usage
        ;;
esac
