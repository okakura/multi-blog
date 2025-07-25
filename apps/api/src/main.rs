use api::{
    AppState, analytics_middleware, auth_middleware, domain_middleware,
    handlers::{HandlerModule, admin::AdminModule, analytics, auth, blog::BlogModule, session},
    middleware::{
        ClientIp, RateLimitConfig, create_rate_limiter, error_tracking_middleware,
        http_tracing_middleware, performance_monitoring_middleware,
    },
    telemetry::{TelemetryConfig, init_telemetry},
};

use axum::{Router, extract::ConnectInfo, middleware, response::Html};
use std::{env, net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, error};
use utoipa::OpenApi;

async fn swagger_ui_handler() -> Html<&'static str> {
    Html(
        r#"
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Blog API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: window.location.origin + '/api-docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
"#,
    )
}

async fn health_check(state: Arc<AppState>) -> axum::Json<serde_json::Value> {
    // Check database connectivity
    let db_status = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => "ok",
        Err(_) => "error",
    };

    axum::Json(serde_json::json!({
        "status": "ok",
        "database": db_status,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

async fn metrics_handler() -> Result<axum::response::Response, axum::http::StatusCode> {
    match std::env::var("ENABLE_METRICS") {
        Ok(_) => {
            let metrics_text = api::telemetry::get_metrics();
            Ok(axum::response::Response::builder()
                .status(200)
                .header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
                .body(metrics_text.into())
                .unwrap())
        }
        _ => Ok(axum::response::Response::builder()
            .status(200)
            .header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
            .body("# Metrics collection disabled\n".into())
            .unwrap()),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize telemetry
    let telemetry_config = TelemetryConfig::default();
    if let Err(e) = init_telemetry(telemetry_config) {
        error!("Failed to initialize telemetry: {e}");
        return Err(e);
    }

    info!("Starting multi-blog API server");

    // Connect to database
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = sqlx::PgPool::connect(&database_url).await?;
    info!("Database connection established");

    // Run migrations
    sqlx::migrate!("../../services/database/migrations").run(&pool).await?;
    info!("Database migrations completed");

    let state = Arc::new(AppState { db: pool });
    let app = create_app(state);

    let port = env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let bind_address = format!("{host}:{port}");

    let listener = TcpListener::bind(&bind_address).await?;
    info!(
        port = %port,
        host = %host,
        "Server starting on http://localhost:{}",
        port
    );

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}

pub fn create_app(state: Arc<AppState>) -> Router {
    // Create rate limiting middleware instances for different route groups
    // Each rate limiter has different thresholds based on the sensitivity of the routes
    let default_rate_limiter = create_rate_limiter(RateLimitConfig::default());
    let auth_rate_limiter = create_rate_limiter(RateLimitConfig::auth());
    let admin_rate_limiter = create_rate_limiter(RateLimitConfig::admin());
    let read_only_rate_limiter = create_rate_limiter(RateLimitConfig::read_only());

    Router::new()
        // ===========================================
        // SYSTEM & DIAGNOSTIC ROUTES (No authentication required)
        // ===========================================
        
        // Simple debug endpoint for testing server connectivity
        .route(
            "/debug",
            axum::routing::get(|| async { "Debug endpoint working!" }),
        )
        
        // Health check endpoint - used by load balancers and monitoring
        // Returns database status and server timestamp
        .route(
            "/health",
            axum::routing::get({
                let state = state.clone();
                move || health_check(state)
            }),
        )
        
        // Test route for domain middleware functionality (development only)
        .route(
            "/test-domain",
            axum::routing::get(|| async { "Domain middleware working!" }).layer(
                middleware::from_fn_with_state(state.clone(), domain_middleware),
            ),
        )
        
        // OpenAPI specification endpoint for API documentation
        .route(
            "/api-docs/openapi.json",
            axum::routing::get(|| async {
                axum::Json(api::handlers::blog::ApiBlogDocs::openapi())
            }),
        )
        
        // Interactive Swagger UI for API documentation and testing
        .route("/swagger-ui", axum::routing::get(swagger_ui_handler))
        
        // Prometheus metrics endpoint for monitoring and observability
        .route("/metrics", axum::routing::get(metrics_handler))
        
        // ===========================================
        // AUTHENTICATION ROUTES
        // ===========================================
        // Routes for user login, registration, password reset, etc.
        // Higher rate limiting due to security sensitivity
        .nest(
            "/auth",
            auth::auth_router().layer(middleware::from_fn(
                move |ConnectInfo(addr): ConnectInfo<SocketAddr>, req, next| {
                    let rate_limiter = auth_rate_limiter.clone();
                    async move {
                        rate_limiter
                            .apply(ClientIp(addr.ip()), req, next)
                            .await
                            .unwrap_or_else(|status| {
                                axum::response::Response::builder()
                                    .status(status)
                                    .body("Rate limit exceeded".into())
                                    .unwrap()
                            })
                    }
                },
            )),
        )
        
        // ===========================================
        // PUBLIC BLOG CONTENT ROUTES (Domain-scoped)
        // ===========================================
        // Public-facing blog content: posts, categories, search, etc.
        // Requires domain context (extracted from subdomain or x-domain header)
        // Includes analytics tracking for visitor behavior
        // Read-only rate limiting (more permissive than admin routes)
        .merge(
            BlogModule::routes()
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    domain_middleware,
                ))
                .layer(middleware::from_fn(analytics_middleware))
                .layer(middleware::from_fn(
                    move |ConnectInfo(addr): ConnectInfo<SocketAddr>, req, next| {
                        let rate_limiter = read_only_rate_limiter.clone();
                        async move {
                            rate_limiter
                                .apply(ClientIp(addr.ip()), req, next)
                                .await
                                .unwrap_or_else(|status| {
                                    axum::response::Response::builder()
                                        .status(status)
                                        .body("Rate limit exceeded".into())
                                        .unwrap()
                                })
                        }
                    },
                )),
        )
        
        // ===========================================
        // USER SESSION TRACKING ROUTES (Domain-scoped)
        // ===========================================
        // Session lifecycle management: create, update, end sessions
        // Used for analytics and user behavior tracking
        // Requires domain context for proper attribution
        // Default rate limiting (moderate protection)
        .nest(
            "/session",
            Router::new()
                .route("/create", axum::routing::post(session::create_session))
                .route("/update", axum::routing::post(session::update_session))
                .route("/end", axum::routing::post(session::end_session))
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    domain_middleware,
                ))
                .layer(middleware::from_fn(analytics_middleware))
                .layer(middleware::from_fn(
                    move |ConnectInfo(addr): ConnectInfo<SocketAddr>, req, next| {
                        let rate_limiter = default_rate_limiter.clone();
                        async move {
                            rate_limiter
                                .apply(ClientIp(addr.ip()), req, next)
                                .await
                                .unwrap_or_else(|status| {
                                    axum::response::Response::builder()
                                        .status(status)
                                        .body("Rate limit exceeded".into())
                                        .unwrap()
                                })
                        }
                    },
                )),
        )
        
        // ===========================================
        // ADMIN PANEL ROUTES (Authentication required)
        // ===========================================
        // All admin panel functionality in one place:
        // - Content management: posts, categories, settings
        // - User management: list, create, update, delete users
        // - User preferences: profile settings, preferences
        // - Domain management: create, configure domains
        // 
        // Authentication required for all routes
        // Higher rate limiting for security
        // Domain context passed as query parameters when needed
        .nest(
            AdminModule::mount_path(),
            AdminModule::routes()
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(middleware::from_fn(
                    {
                        let admin_rate_limiter = admin_rate_limiter.clone();
                        move |ConnectInfo(addr): ConnectInfo<SocketAddr>, req, next| {
                            let rate_limiter = admin_rate_limiter.clone();
                            async move {
                                rate_limiter
                                    .apply(ClientIp(addr.ip()), req, next)
                                    .await
                                    .unwrap_or_else(|status| {
                                        axum::response::Response::builder()
                                            .status(status)
                                            .body("Rate limit exceeded".into())
                                            .unwrap()
                                    })
                            }
                        }
                    },
                )),
        )
        
        // ===========================================
        // ANALYTICS ROUTES (Authentication required)
        // ===========================================
        // Analytics and reporting endpoints:
        // - Dashboard: overview metrics and charts
        // - Traffic: visitor stats, page views, referrers
        // - Content: post performance, search analytics
        // - Real-time: current active users and recent events
        // - Export: data export for external analysis
        // - Behavior tracking: click events, scroll depth, engagement
        // 
        // Cross-domain analytics (aggregates data across all user's domains)
        // User permissions determine which domains they can view analytics for
        .nest(
            "/analytics",
            Router::new()
                // Dashboard endpoint (merged overview + dashboard)
                .route(
                    "/dashboard",
                    axum::routing::get(analytics::get_analytics_dashboard),
                )
                .route("/traffic", axum::routing::get(analytics::get_traffic_stats))
                .route("/posts", axum::routing::get(analytics::get_post_analytics))
                .route(
                    "/search-terms",
                    axum::routing::get(analytics::get_search_analytics),
                )
                .route(
                    "/referrers",
                    axum::routing::get(analytics::get_referrer_stats),
                )
                .route(
                    "/real-time",
                    axum::routing::get(analytics::get_realtime_stats),
                )
                .route("/export", axum::routing::get(analytics::export_data))
                // Behavior tracking endpoints
                .route(
                    "/behavior",
                    axum::routing::post(analytics::track_behavior_event),
                )
                .route(
                    "/search",
                    axum::routing::post(analytics::track_search_event),
                )
                .route(
                    "/search-click",
                    axum::routing::post(analytics::track_search_click_event),
                )
                .route(
                    "/content-metrics",
                    axum::routing::post(analytics::track_content_metrics),
                )
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                )),
        )
        
        // ===========================================
        // GLOBAL MIDDLEWARE LAYERS
        // ===========================================
        // Applied to ALL routes in order of application:
        
        // HTTP tracing: logs all requests/responses for debugging
        .layer(middleware::from_fn(http_tracing_middleware))
        
        // Performance monitoring: tracks response times and resource usage
        .layer(middleware::from_fn(performance_monitoring_middleware))
        
        // Error tracking: captures and reports application errors
        .layer(middleware::from_fn(error_tracking_middleware))
        
        // CORS configuration: enables cross-origin requests from frontend
        .layer({
            // Parse allowed origins from environment variable
            // Default: local development URLs (localhost:3000, localhost:5173)
            let cors_origins = env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string());

            let origins: Vec<_> = cors_origins
                .split(',')
                .map(|s| s.trim().parse().expect("Invalid CORS origin"))
                .collect();

            CorsLayer::new()
                .allow_origin(AllowOrigin::list(origins))
                .allow_methods([
                    axum::http::Method::GET,
                    axum::http::Method::POST,
                    axum::http::Method::PUT,
                    axum::http::Method::DELETE,
                    axum::http::Method::OPTIONS,
                ])
                .allow_headers([
                    axum::http::header::CONTENT_TYPE,
                    axum::http::header::AUTHORIZATION,
                    axum::http::HeaderName::from_static("x-domain"),
                ])
                .allow_credentials(true)
        })
        .with_state(state)
}
