# 🔧 Monitoring Setup Guide

## Complete Observability Stack Setup

This guide walks you through setting up the complete enterprise-grade observability stack for the Multi-Blog platform.

## 🎯 Quick Setup (Recommended)

### One-Command Setup
```bash
# Start everything including observability stack
make dev

# This starts:
# - PostgreSQL database
# - Rust API server with tracing
# - React frontend
# - Jaeger (distributed tracing)
# - Prometheus (metrics collection)
# - Grafana (dashboards and visualization)
```

### Verify Setup
```bash
# Check all services are running
make status

# Test endpoints
curl http://localhost:3000/health    # API health
curl http://localhost:9001/metrics   # Metrics endpoint
curl http://localhost:16686/api/services  # Jaeger services
```

## 🔍 Service Details

### Jaeger (Distributed Tracing)
- **UI**: http://localhost:16686
- **OTLP gRPC**: http://localhost:4317
- **OTLP HTTP**: http://localhost:4318
- **Purpose**: Request tracing, performance analysis, error debugging

### Prometheus (Metrics)
- **UI**: http://localhost:9090  
- **Scrape Target**: http://localhost:9001/metrics
- **Purpose**: Metrics collection, alerting, time-series data

### Grafana (Dashboards)
- **UI**: http://localhost:3001
- **Login**: admin / admin
- **Purpose**: Visualization, dashboards, monitoring

### API Metrics Endpoint
- **Endpoint**: http://localhost:9001/metrics
- **Format**: Prometheus format
- **Purpose**: Application metrics export

## 📊 Dashboard Configuration

### Auto-Configured Dashboard

The setup automatically creates an **API Performance Dashboard** with:

- **HTTP Metrics**: Request rates, response times, status codes
- **Database Performance**: Query timing, connection status
- **Authentication Metrics**: Login success/failure rates
- **Error Tracking**: Error rates and context
- **Custom Business Metrics**: User engagement, content analytics

### Manual Dashboard Import

If you need to recreate the dashboard:

1. Open Grafana at http://localhost:3001
2. Login with admin/admin
3. Go to Dashboards > Import
4. Use the API to create dashboard:

```bash
curl -X POST http://admin:admin@localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @docs/grafana-dashboard.json
```

## 🔧 Configuration Files

### Docker Compose (Observability Services)

Located in `docker-compose.observability.yml`:

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  prometheus:
    image: prom/prometheus:v3.5.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:12.1.0
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
```

### Prometheus Configuration

Located in `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'multi-blog-api'
    static_configs:
      - targets: ['host.docker.internal:9001']
    scrape_interval: 5s
    metrics_path: /metrics

alerting:
  alertmanagers:
    - static_configs:
        - targets: []
```

### Environment Configuration

The API server uses these environment variables for observability:

```bash
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
ENABLE_OPENTELEMETRY=true
SERVICE_NAME=multi-blog-api
SERVICE_VERSION=0.1.0
ENVIRONMENT=development

# Logging Configuration  
RUST_LOG=info
LOG_FORMAT=pretty
ENABLE_METRICS=true

# Metrics Configuration
METRICS_PORT=9001
```

## 🚨 Alerting Setup

### Basic Alert Rules

Create `alert_rules.yml`:

```yaml
groups:
  - name: multi-blog-alerts
    rules:
      - alert: HighErrorRate
        expr: (rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100 > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"

      - alert: SlowRequests
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow request performance"
          description: "95th percentile response time is {{ $value }}ms"

      - alert: DatabaseSlowQueries
        expr: histogram_quantile(0.95, rate(database_operation_duration_ms_bucket[5m])) > 500
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Database queries are slow"
          description: "95th percentile database query time is {{ $value }}ms"
```

### Notification Channels

Configure Slack/email notifications in Grafana:

1. Go to Alerting > Notification channels
2. Add webhook for Slack:
   ```
   URL: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
   Title: Multi-Blog Alerts
   ```

## 🧪 Testing the Setup

### Generate Test Traffic

```bash
# Generate some requests
for i in {1..10}; do
  curl http://localhost:3000/blog/posts
  sleep 1
done

# Generate analytics events
curl -X POST http://localhost:3000/analytics/search \
  -H "Content-Type: application/json" \
  -H "X-Domain: localhost:3001" \
  -d '{"session_id":"test-123","query":"rust","results_count":5}'
```

### Verify Tracing

1. Open Jaeger UI: http://localhost:16686
2. Select service: `multi-blog-api`
3. Click "Find Traces"
4. You should see traces from your test requests

### Verify Metrics

1. Open Prometheus: http://localhost:9090
2. Try these queries:
   ```promql
   http_requests_total
   rate(http_requests_total[5m])
   histogram_quantile(0.95, http_request_duration_ms_bucket)
   ```

### Verify Dashboard

1. Open Grafana: http://localhost:3001
2. Login: admin/admin
3. Navigate to "API Performance Dashboard"
4. You should see metrics from your test requests

## 🐛 Troubleshooting

### Common Issues

**No traces appearing in Jaeger:**
- Check OTLP endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
- Verify Jaeger is running: `docker ps | grep jaeger`
- Check API logs for OpenTelemetry errors

**No metrics in Prometheus:**
- Verify metrics endpoint: `curl http://localhost:9001/metrics`
- Check Prometheus targets: http://localhost:9090/targets
- Ensure Prometheus can reach `host.docker.internal:9001`

**Grafana dashboard empty:**
- Confirm Prometheus data source is configured
- Check Prometheus query syntax in panels
- Verify time range in dashboard

**Services not starting:**
- Check port conflicts: `lsof -i :16686,9090,3001`
- Review Docker logs: `docker-compose logs jaeger prometheus grafana`
- Ensure Docker has enough memory allocated

### Debug Commands

```bash
# Check if all services are healthy
make status

# View service logs
docker-compose logs -f jaeger
docker-compose logs -f prometheus  
docker-compose logs -f grafana

# Test connectivity
curl -v http://localhost:16686/api/services
curl -v http://localhost:9090/-/healthy
curl -v http://localhost:3001/api/health

# Check metrics generation
curl http://localhost:9001/metrics | grep http_requests_total
```

### Performance Tuning

**For high-traffic production environments:**

1. **Adjust trace sampling:**
   ```rust
   // In telemetry.rs
   .with_sampler(Sampler::TraceIdRatioBased(0.1)) // 10% sampling
   ```

2. **Increase Prometheus retention:**
   ```yaml
   # In prometheus.yml
   command:
     - '--storage.tsdb.retention.time=30d'
     - '--storage.tsdb.retention.size=10GB'
   ```

3. **Configure Grafana for scale:**
   ```yaml
   # Environment variables
   - GF_DATABASE_TYPE=postgres
   - GF_DATABASE_HOST=postgres:5432
   ```

## 🎯 Next Steps

1. **Custom Metrics**: Add business-specific metrics to your handlers
2. **Advanced Alerting**: Set up PagerDuty/Slack integration
3. **Log Aggregation**: Add ELK stack for log management
4. **Distributed Tracing**: Extend tracing to external services
5. **Capacity Planning**: Use metrics for resource planning

For detailed usage examples and advanced configuration, see:
- [OBSERVABILITY_ARCHITECTURE.md](OBSERVABILITY_ARCHITECTURE.md)
- [OBSERVABILITY_QUICK_REFERENCE.md](OBSERVABILITY_QUICK_REFERENCE.md)
