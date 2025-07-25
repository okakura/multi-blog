# 🚀 Observability Quick Reference

## Quick Start Commands

### Start Full Stack
```bash
# Start all services with observability
make dev

# Or start individually:
make dev-backend    # API server
make dev-frontend   # Frontend
make dev-observability  # Prometheus + Grafana + Jaeger
```

### Access Points
- **API Server:** http://localhost:3000
- **Frontend:** http://localhost:3001  
- **Jaeger UI:** http://localhost:16686
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (credentials: admin/admin)
- **Metrics Endpoint:** http://localhost:9001/metrics

## 🔍 Tracing Utilities Reference

### DatabaseSpan - Database Operations
```rust
use crate::utils::DatabaseSpan;

// Query timing and performance
DatabaseSpan::execute("operation_name", "table_name", async {
    sqlx::query("SELECT * FROM posts").fetch_all(&db).await
}).await?;
```

### PerformanceSpan - Operation Monitoring
```rust
use crate::utils::PerformanceSpan;

// Automatic performance tracking with warnings
PerformanceSpan::monitor("complex_operation", async {
    // Your code here - automatically times and warns if slow
}).await
```

### BusinessSpan - Business Logic
```rust
use crate::utils::BusinessSpan;

// Business operation tracking
BusinessSpan::execute("user_registration", async {
    // User registration logic
}).await?;

// Add context to spans
BusinessSpan::add_request_context(request_id, method, path);
BusinessSpan::add_attribute("user_id", &user_id);
```

### AnalyticsSpan - Search & Analytics
```rust
use crate::utils::AnalyticsSpan;

// Search operation tracking
AnalyticsSpan::track_search("user_search", async {
    // Search logic with automatic timing
}).await;

// Event tracking
AnalyticsSpan::track_event("post_view", Some(&user_id), event_data);
```

### ErrorSpan - Error Context
```rust
use crate::utils::ErrorSpan;

// Error tracking with context
ErrorSpan::capture("authentication_failed", async {
    // Error handling with rich context
}).await;
```

## 📊 Useful Prometheus Queries

### HTTP Performance
```promql
# Request rate by endpoint
sum(rate(http_requests_total[5m])) by (http_route)

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Error rate percentage
(rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100
```

### Database Performance
```promql
# Database query rate
rate(database_operations_total[5m])

# Slow queries (>100ms)
histogram_quantile(0.95, rate(database_operation_duration_ms_bucket[5m])) > 100
```

### Authentication Metrics
```promql
# Login success rate
rate(auth_successes_total[5m]) / rate(auth_attempts_total[5m])

# Failed authentication rate
rate(auth_failures_total[5m])
```

## 🎯 Jaeger Search Tips

### Find Slow Requests
1. Service: `multi-blog-api`
2. Operation: `http_request`
3. Tags: `http.method=GET`
4. Min Duration: `100ms`

### Track User Journey
1. Search by tag: `user.id=123`
2. Time range: Last 1 hour
3. Look for related spans

### Debug Database Issues
1. Operation: `database_operation`
2. Tags: `db.table=posts`
3. Sort by duration (descending)

## 🚨 Alerting Thresholds

### Critical
- HTTP Error Rate > 5%
- Database P95 > 1000ms
- Memory Usage > 90%

### Warning  
- HTTP P95 > 500ms
- Database P95 > 200ms
- Authentication failures > 10/min

## 🔧 Common Debug Commands

### Check Service Health
```bash
# API health
curl http://localhost:3000/health

# Metrics availability
curl http://localhost:9001/metrics | grep http_requests

# Jaeger connectivity
curl http://localhost:16686/api/services
```

### Trace a Request
```bash
# Make a traced request
curl -H "X-Trace-Id: test-trace-123" http://localhost:3000/blog/posts

# Find it in Jaeger
# Search for trace ID: test-trace-123
```

### Generate Test Data
```bash
# Generate analytics events
curl -X POST http://localhost:3000/analytics/search \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-123","query":"rust","results_count":5}'
```

## 🎨 Grafana Dashboard Queries

### Request Volume Panel
```promql
# Query
sum(rate(http_requests_total[5m]))

# Legend
Total Requests/sec
```

### Response Time Panel
```promql
# Query
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Legend  
95th Percentile Response Time
```

### Error Rate Panel
```promql
# Query
(sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Legend
Error Rate %
```

## 🏷️ Structured Logging Examples

### Success Log
```rust
tracing::info!(
    user_id = %user.id,
    post_id = post.id,
    action = "post_created",
    "Post created successfully"
);
```

### Error Log
```rust
tracing::error!(
    error = %e,
    user_id = %user.id,
    operation = "database_query",
    "Database operation failed"
);
```

### Performance Warning
```rust
tracing::warn!(
    duration_ms = duration.as_millis(),
    operation = "complex_query",
    threshold_ms = 1000,
    "Slow operation detected"
);
```

## 📈 Metrics Collection

### Custom Metrics
```rust
// Increment counter
metrics::increment_counter!("custom_events_total", "event_type" => "user_signup");

// Record histogram
metrics::histogram!("custom_operation_duration_ms", duration.as_millis() as f64);

// Set gauge
metrics::gauge!("active_connections", active_count as f64);
```

## 🔍 Production Monitoring Checklist

### Daily Checks
- [ ] Error rate < 1%
- [ ] Response time P95 < 200ms
- [ ] No failed authentication spikes
- [ ] Database performance normal

### Weekly Review
- [ ] Trace sampling adequate
- [ ] Disk space for metrics
- [ ] Dashboard accuracy
- [ ] Alert effectiveness

### Monthly Analysis  
- [ ] Performance trends
- [ ] Capacity planning
- [ ] User behavior patterns
- [ ] System optimization opportunities

## 🎯 Troubleshooting Guide

### No Traces Appearing
1. Check OTLP endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT`
2. Verify Jaeger is running: `docker ps`
3. Check logs for OpenTelemetry errors

### Missing Metrics
1. Verify Prometheus configuration
2. Check metrics endpoint: `curl localhost:9001/metrics`
3. Review Prometheus targets page

### High Memory Usage
1. Check trace sampling rate
2. Review metrics cardinality
3. Monitor span creation patterns

### Slow Performance
1. Review database query traces
2. Check for N+1 query patterns
3. Analyze span timing distributions

---

**💡 Pro Tip:** Use the Grafana dashboard for real-time monitoring and Jaeger for detailed trace analysis when debugging specific issues!
