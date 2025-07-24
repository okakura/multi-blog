use crate::utils::{ErrorSpan, PerformanceSpan, SpanContext};
use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use std::time::Instant;

/// HTTP request tracing middleware that captures the full request lifecycle
pub async fn http_tracing_middleware(request: Request, next: Next) -> Response {
    let operation_name = format!("HTTP {} {}", request.method(), request.uri().path());

    PerformanceSpan::monitor(&operation_name, async {
        let start = Instant::now();
        let method = request.method().clone();
        let uri = request.uri().clone();
        let path = uri.path().to_string();

        // Create request context for correlation
        let span_context = SpanContext::new(&operation_name);

        // Create a span for the entire HTTP request
        let span = tracing::info_span!(
            "http_request",
            method = %method,
            path = %path,
            request_id = %span_context.request_id,
            status_code = tracing::field::Empty,
            duration_ms = tracing::field::Empty,
            user_agent = tracing::field::Empty,
            remote_addr = tracing::field::Empty,
        );

        // Extract additional context from headers
        let user_agent = request
            .headers()
            .get("user-agent")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("unknown");

        let remote_addr = request
            .headers()
            .get("x-forwarded-for")
            .or_else(|| request.headers().get("x-real-ip"))
            .and_then(|v| v.to_str().ok())
            .unwrap_or("unknown");

        span.record("user_agent", user_agent);
        span.record("remote_addr", remote_addr);

        let _enter = span.enter();

        tracing::info!("Request started");

        // Process the request
        let response = next.run(request).await;

        // Calculate duration and record metrics
        let duration = start.elapsed();
        let duration_ms = duration.as_millis() as u64;
        let status_code = response.status().as_u16();

        span.record("status_code", status_code);
        span.record("duration_ms", duration_ms);

        // Record metrics
        crate::telemetry::record_http_metrics(method.as_str(), &path, status_code, duration_ms);

        // Log the completion with appropriate level based on status code
        match status_code {
            200..=299 => tracing::info!(
                duration_ms = duration_ms,
                status_code = status_code,
                "Request completed successfully"
            ),
            400..=499 => {
                tracing::warn!(
                    duration_ms = duration_ms,
                    status_code = status_code,
                    "Request completed with client error"
                );
                // Track client errors for debugging
                if status_code == 404 {
                    tracing::debug!(
                        method = %method,
                        path = %path,
                        status_code = status_code,
                        "Resource not found"
                    );
                }
            }
            500..=599 => {
                tracing::error!(
                    duration_ms = duration_ms,
                    status_code = status_code,
                    "Request completed with server error"
                );
                // Track server errors
                ErrorSpan::track_error(
                    "http_server_error",
                    "error",
                    &format!("HTTP {} returned {}", status_code, status_code),
                    Some(serde_json::json!({
                        "method": method.to_string(),
                        "path": path,
                        "duration_ms": duration_ms,
                        "status_code": status_code
                    })),
                );
            }
            _ => tracing::info!(
                duration_ms = duration_ms,
                status_code = status_code,
                "Request completed"
            ),
        }

        response
    })
    .await
}

/// Performance monitoring middleware for slow requests
pub async fn performance_monitoring_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let path = request.uri().path().to_string();

    let response = next.run(request).await;

    let duration = start.elapsed();
    let duration_ms = duration.as_millis() as u64;

    // Alert on slow requests (> 1 second)
    if duration_ms > 1000 {
        tracing::warn!(
            method = %method,
            path = %path,
            duration_ms = duration_ms,
            status_code = response.status().as_u16(),
            "Slow request detected"
        );

        // Record slow request metric
        metrics::increment_counter!("slow_requests_total");
    }

    // Alert on very slow requests (> 5 seconds)
    if duration_ms > 5000 {
        tracing::error!(
            method = %method,
            path = %path,
            duration_ms = duration_ms,
            status_code = response.status().as_u16(),
            "Very slow request detected - investigate!"
        );

        metrics::increment_counter!("very_slow_requests_total");
    }

    response
}

/// Error tracking middleware to capture and log errors
pub async fn error_tracking_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let path = request.uri().path().to_string();

    let response = next.run(request).await;
    let status_code = response.status();

    // Track error responses
    match status_code {
        StatusCode::BAD_REQUEST => {
            tracing::warn!(
                method = %method,
                path = %path,
                status_code = 400,
                "Bad request"
            );
            metrics::increment_counter!("http_errors_400_total");
        }
        StatusCode::UNAUTHORIZED => {
            tracing::warn!(
                method = %method,
                path = %path,
                status_code = 401,
                "Unauthorized request"
            );
            metrics::increment_counter!("http_errors_401_total");
        }
        StatusCode::FORBIDDEN => {
            tracing::warn!(
                method = %method,
                path = %path,
                status_code = 403,
                "Forbidden request"
            );
            metrics::increment_counter!("http_errors_403_total");
        }
        StatusCode::NOT_FOUND => {
            tracing::debug!(
                method = %method,
                path = %path,
                status_code = 404,
                "Resource not found"
            );
            metrics::increment_counter!("http_errors_404_total");
        }
        StatusCode::INTERNAL_SERVER_ERROR => {
            tracing::error!(
                method = %method,
                path = %path,
                status_code = 500,
                "Internal server error"
            );
            metrics::increment_counter!("http_errors_500_total");
        }
        status if status.is_server_error() => {
            tracing::error!(
                method = %method,
                path = %path,
                status_code = status.as_u16(),
                "Server error"
            );
            metrics::increment_counter!("http_errors_5xx_total");
        }
        status if status.is_client_error() => {
            tracing::warn!(
                method = %method,
                path = %path,
                status_code = status.as_u16(),
                "Client error"
            );
            metrics::increment_counter!("http_errors_4xx_total");
        }
        _ => {} // Success cases already handled by main tracing middleware
    }

    response
}
