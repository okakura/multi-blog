use std::time::Instant;
use tracing::{Span, error, info, instrument, warn};
use uuid::Uuid;

/// Custom span utilities for enhanced tracing
pub struct SpanContext {
    pub request_id: String,
    pub user_id: Option<String>,
    pub operation: String,
}

impl SpanContext {
    pub fn new(operation: &str) -> Self {
        Self {
            request_id: Uuid::new_v4().to_string(),
            user_id: None,
            operation: operation.to_string(),
        }
    }

    pub fn with_user(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = request_id;
        self
    }
}

/// Database operation tracing utilities
pub struct DatabaseSpan;

impl DatabaseSpan {
    /// Create a span for database queries with automatic timing
    #[instrument(skip(query_fn), fields(
        db.operation = %operation,
        db.table = %table,
        db.query_time_ms,
        db.rows_affected
    ))]
    pub async fn execute<F, T, E>(operation: &str, table: &str, query_fn: F) -> Result<T, E>
    where
        F: std::future::Future<Output = Result<T, E>>,
    {
        let start = Instant::now();
        let current_span = Span::current();

        info!(
            "Executing database operation: {} on table: {}",
            operation, table
        );

        let result = query_fn.await;
        let duration = start.elapsed();

        // Record timing in the span
        current_span.record("db.query_time_ms", duration.as_millis() as f64);

        match &result {
            Ok(_) => {
                info!(
                    "Database operation completed successfully in {}ms",
                    duration.as_millis()
                );
            }
            Err(_) => {
                error!("Database operation failed after {}ms", duration.as_millis());
            }
        }

        result
    }

    /// Create a span for database transactions
    #[instrument(skip(transaction_fn), fields(
        db.transaction = true,
        db.transaction_time_ms,
        db.operations_count
    ))]
    pub async fn transaction<F, T, E>(transaction_fn: F) -> Result<T, E>
    where
        F: std::future::Future<Output = Result<T, E>>,
    {
        let start = Instant::now();
        let current_span = Span::current();

        info!("Starting database transaction");

        let result = transaction_fn.await;
        let duration = start.elapsed();

        current_span.record("db.transaction_time_ms", duration.as_millis() as f64);

        match &result {
            Ok(_) => {
                info!(
                    "Database transaction committed successfully in {}ms",
                    duration.as_millis()
                );
            }
            Err(_) => {
                error!(
                    "Database transaction failed/rolled back after {}ms",
                    duration.as_millis()
                );
            }
        }

        result
    }
}

/// Business logic tracing utilities
pub struct BusinessSpan;

impl BusinessSpan {
    /// Create a span for business operations
    #[instrument(skip(operation_fn), fields(
        business.operation = %operation_name,
        business.execution_time_ms,
        business.result
    ))]
    pub async fn execute<F, T, E>(operation_name: &str, operation_fn: F) -> Result<T, E>
    where
        F: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Debug,
    {
        let start = Instant::now();
        let current_span = Span::current();

        info!("Starting business operation: {}", operation_name);

        let result = operation_fn.await;
        let duration = start.elapsed();

        current_span.record("business.execution_time_ms", duration.as_millis() as f64);

        match &result {
            Ok(_) => {
                current_span.record("business.result", "success");
                info!(
                    "Business operation '{}' completed successfully in {}ms",
                    operation_name,
                    duration.as_millis()
                );
            }
            Err(e) => {
                current_span.record("business.result", "error");
                error!(
                    "Business operation '{}' failed after {}ms: {:?}",
                    operation_name,
                    duration.as_millis(),
                    e
                );
            }
        }

        result
    }

    /// Add custom attributes to the current span
    pub fn add_attribute(key: &str, value: &str) {
        let current_span = Span::current();
        current_span.record(key, value);
    }

    /// Add user context to the current span
    pub fn add_user_context(user_id: &str, user_role: Option<&str>) {
        let current_span = Span::current();
        current_span.record("user.id", user_id);
        if let Some(role) = user_role {
            current_span.record("user.role", role);
        }
    }

    /// Add request context to the current span
    pub fn add_request_context(request_id: &str, method: &str, path: &str) {
        let current_span = Span::current();
        current_span.record("http.request_id", request_id);
        current_span.record("http.method", method);
        current_span.record("http.path", path);
    }
}

/// Analytics tracing utilities
pub struct AnalyticsSpan;

impl AnalyticsSpan {
    /// Trace analytics events with context
    #[instrument(skip(event_data), fields(
        analytics.event = %event_type,
        analytics.timestamp = %chrono::Utc::now().to_rfc3339(),
        analytics.processed = false
    ))]
    pub fn track_event(event_type: &str, user_id: Option<&str>, event_data: serde_json::Value) {
        let current_span = Span::current();

        if let Some(uid) = user_id {
            current_span.record("analytics.user_id", uid);
        }

        info!(
            "Analytics event tracked: {} with data: {}",
            event_type, event_data
        );
        current_span.record("analytics.processed", true);
    }

    /// Trace search operations
    #[instrument(skip(search_fn), fields(
        search.query = %query,
        search.results_count,
        search.execution_time_ms
    ))]
    pub async fn track_search<F, T>(query: &str, search_fn: F) -> T
    where
        F: std::future::Future<Output = T>,
    {
        let start = Instant::now();
        let current_span = Span::current();

        info!("Search operation started for query: '{}'", query);

        let result = search_fn.await;
        let duration = start.elapsed();

        current_span.record("search.execution_time_ms", duration.as_millis() as f64);
        info!("Search operation completed in {}ms", duration.as_millis());

        result
    }
}

/// Performance monitoring utilities
pub struct PerformanceSpan;

impl PerformanceSpan {
    /// Monitor function execution time with automatic span creation
    #[instrument(skip(func), fields(
        perf.operation = %operation_name,
        perf.execution_time_ms,
        perf.memory_usage_kb
    ))]
    pub async fn monitor<F, T>(operation_name: &str, func: F) -> T
    where
        F: std::future::Future<Output = T>,
    {
        let start = Instant::now();
        let current_span = Span::current();

        // Execute the function
        let result = func.await;

        let duration = start.elapsed();
        current_span.record("perf.execution_time_ms", duration.as_millis() as f64);

        // Log performance metrics
        if duration.as_millis() > 1000 {
            warn!(
                "Slow operation detected: '{}' took {}ms",
                operation_name,
                duration.as_millis()
            );
        } else {
            info!(
                "Operation '{}' completed in {}ms",
                operation_name,
                duration.as_millis()
            );
        }

        result
    }
}

/// Error tracking utilities
pub struct ErrorSpan;

impl ErrorSpan {
    /// Track and trace errors with context
    #[instrument(skip(error), fields(
        error.type = %error_type,
        error.message,
        error.stack_trace,
        error.severity = %severity
    ))]
    pub fn track_error<E: std::fmt::Debug + std::fmt::Display>(
        error_type: &str,
        severity: &str,
        error: &E,
        context: Option<serde_json::Value>,
    ) {
        let current_span = Span::current();

        current_span.record("error.message", &format!("{}", error));
        current_span.record("error.stack_trace", &format!("{:?}", error));

        if let Some(ctx) = context {
            current_span.record("error.context", &ctx.to_string());
        }

        match severity {
            "critical" | "error" => {
                error!("Error tracked: {} - {}", error_type, error);
            }
            "warning" => {
                warn!("Warning tracked: {} - {}", error_type, error);
            }
            _ => {
                info!("Issue tracked: {} - {}", error_type, error);
            }
        }
    }
}
