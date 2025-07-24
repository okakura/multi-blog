use metrics_exporter_prometheus::PrometheusBuilder;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{
    Resource,
    trace::{self, RandomIdGenerator, Sampler},
};
use std::env;
use tracing::info;
use tracing_subscriber::{
    EnvFilter, Layer, Registry,
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    util::SubscriberInitExt,
};

#[derive(Debug, Clone)]
pub struct TelemetryConfig {
    pub log_level: String,
    pub log_format: LogFormat,
    pub enable_opentelemetry: bool,
    pub enable_metrics: bool,
    pub service_name: String,
    pub service_version: String,
    pub environment: String,
}

#[derive(Debug, Clone)]
pub enum LogFormat {
    Pretty,
    Json,
    Compact,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            log_level: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
            log_format: match env::var("LOG_FORMAT").as_deref() {
                Ok("json") => LogFormat::Json,
                Ok("compact") => LogFormat::Compact,
                _ => LogFormat::Pretty,
            },
            enable_opentelemetry: env::var("ENABLE_OPENTELEMETRY")
                .map(|v| v.parse().unwrap_or(true))
                .unwrap_or(true),
            enable_metrics: env::var("ENABLE_METRICS")
                .map(|v| v.parse().unwrap_or(true))
                .unwrap_or(true),
            service_name: env::var("SERVICE_NAME").unwrap_or_else(|_| "multi-blog-api".to_string()),
            service_version: env::var("SERVICE_VERSION").unwrap_or_else(|_| "0.1.0".to_string()),
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        }
    }
}

/// Initialize telemetry for the application
pub fn init_telemetry(
    config: TelemetryConfig,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Create env filter
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(&config.log_level));

    // Create base registry
    let registry = Registry::default().with(env_filter);

    // Add console/file logging layer
    let fmt_layer = match config.log_format {
        LogFormat::Pretty => fmt::layer()
            .pretty()
            .with_span_events(FmtSpan::CLOSE)
            .with_target(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .boxed(),
        LogFormat::Json => fmt::layer()
            .json()
            .with_span_events(FmtSpan::CLOSE)
            .with_target(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .boxed(),
        LogFormat::Compact => fmt::layer()
            .compact()
            .with_span_events(FmtSpan::CLOSE)
            .with_target(true)
            .boxed(),
    };

    let registry = registry.with(fmt_layer);

    // Conditionally add OpenTelemetry layer
    if config.enable_opentelemetry {
        info!("Initializing OpenTelemetry tracing");
        let tracer = init_opentelemetry_tracer(&config)?;
        let telemetry_layer = tracing_opentelemetry::layer().with_tracer(tracer);
        registry.with(telemetry_layer).init();
    } else {
        registry.init();
    }

    // Initialize metrics
    if config.enable_metrics {
        init_metrics(&config)?;
    }

    info!(
        service_name = %config.service_name,
        service_version = %config.service_version,
        environment = %config.environment,
        log_level = %config.log_level,
        log_format = ?config.log_format,
        opentelemetry_enabled = config.enable_opentelemetry,
        metrics_enabled = config.enable_metrics,
        "Telemetry initialized successfully"
    );

    Ok(())
}

fn init_opentelemetry_tracer(
    config: &TelemetryConfig,
) -> Result<trace::Tracer, opentelemetry::trace::TraceError> {
    // Configure OTLP exporter endpoint
    let otlp_endpoint = env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:4318".to_string());

    info!(
        "Initializing OpenTelemetry with OTLP endpoint: {}",
        otlp_endpoint
    );

    // Create OTLP exporter
    let exporter = opentelemetry_otlp::new_exporter()
        .http()
        .with_endpoint(otlp_endpoint);

    // Create tracer provider with OTLP pipeline
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(exporter)
        .with_trace_config(
            trace::Config::default()
                .with_sampler(Sampler::AlwaysOn)
                .with_id_generator(RandomIdGenerator::default())
                .with_resource(Resource::new(vec![
                    KeyValue::new("service.name", config.service_name.clone()),
                    KeyValue::new("service.version", config.service_version.clone()),
                    KeyValue::new("service.namespace", config.environment.clone()),
                ])),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    Ok(tracer)
}

fn init_metrics(config: &TelemetryConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let builder = PrometheusBuilder::new().with_http_listener(([0, 0, 0, 0], 9001)); // Serve metrics on port 9001

    // Add custom labels
    let builder = builder
        .add_global_label("service_name", &config.service_name)
        .add_global_label("service_version", &config.service_version)
        .add_global_label("environment", &config.environment);

    builder.install()?;

    info!("Metrics exporter initialized on port 9001");

    Ok(())
}

/// Get current metrics in Prometheus format
pub fn get_metrics() -> String {
    // Return a simple redirect message since the actual metrics
    // are served by the dedicated metrics server on port 9001
    "# Metrics are served by the dedicated metrics server on port 9001\n# Please configure Prometheus to scrape from localhost:9001/metrics\n".to_string()
}

fn get_fallback_metrics() -> String {
    r#"# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{service_name="multi-blog-api",service_version="0.1.0",environment="development"} 0

# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="0.1"} 0
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="0.5"} 0
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="1.0"} 0
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="5.0"} 0
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="10.0"} 0
http_request_duration_ms_bucket{service_name="multi-blog-api",service_version="0.1.0",environment="development",le="+Inf"} 0
http_request_duration_ms_sum{service_name="multi-blog-api",service_version="0.1.0",environment="development"} 0
http_request_duration_ms_count{service_name="multi-blog-api",service_version="0.1.0",environment="development"} 0

# HELP auth_attempts_total Authentication attempts
# TYPE auth_attempts_total counter
auth_attempts_total{service_name="multi-blog-api",service_version="0.1.0",environment="development"} 0
"#.to_string()
}
/// Create a span for HTTP requests with relevant fields
#[macro_export]
macro_rules! http_span {
    ($method:expr, $path:expr) => {
        tracing::info_span!(
            "http_request",
            method = %$method,
            path = %$path,
            status_code = tracing::field::Empty,
            duration_ms = tracing::field::Empty,
            error = tracing::field::Empty,
        )
    };
}

/// Create a span for database operations
#[macro_export]
macro_rules! db_span {
    ($operation:expr) => {
        tracing::info_span!(
            "database_operation",
            operation = %$operation,
            duration_ms = tracing::field::Empty,
            rows_affected = tracing::field::Empty,
            error = tracing::field::Empty,
        )
    };
}

/// Record metrics for HTTP requests
pub fn record_http_metrics(_method: &str, _path: &str, _status_code: u16, duration_ms: u64) {
    metrics::increment_counter!("http_requests_total");

    metrics::histogram!("http_request_duration_ms", duration_ms as f64);

    metrics::increment_counter!("http_responses_total");
}

/// Record metrics for database operations
pub fn record_db_metrics(_operation: &str, duration_ms: u64, rows_affected: Option<u64>) {
    metrics::increment_counter!("database_operations_total");

    metrics::histogram!("database_operation_duration_ms", duration_ms as f64);

    if let Some(rows) = rows_affected {
        metrics::histogram!("database_rows_affected", rows as f64);
    }
}

/// Record custom business metrics
pub fn record_analytics_event(_event_type: &str) {
    metrics::increment_counter!("analytics_events_total");
}

pub fn record_session_metrics(_action: &str) {
    metrics::increment_counter!("user_sessions_total");
}

pub fn record_auth_metrics(_action: &str, success: bool) {
    metrics::increment_counter!("auth_attempts_total");

    if success {
        metrics::increment_counter!("auth_successes_total");
    } else {
        metrics::increment_counter!("auth_failures_total");
    }
}
