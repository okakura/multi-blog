use api::{
    AppState, analytics_middleware, auth_middleware, domain_middleware,
    handlers::{
        HandlerModule,
        admin::AdminModule,
        analytics::{self, AnalyticsModule},
        auth,
        blog::BlogModule,
        session,
    },
};
use axum::{Router, middleware, response::Html};
use std::{env, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Connect to database
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = sqlx::PgPool::connect(&database_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = Arc::new(AppState { db: pool });
    let app = create_app(state);

    let port = env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let bind_address = format!("{}:{}", host, port);

    let listener = TcpListener::bind(&bind_address).await?;
    println!("🚀 Server running on http://localhost:{}", port);

    axum::serve(listener, app).await?;
    Ok(())
}

pub fn create_app(state: Arc<AppState>) -> Router {
    Router::new()
        // Add a simple debug route without any middleware
        .route(
            "/debug",
            axum::routing::get(|| async { "Debug endpoint working!" }),
        )
        .route(
            "/health",
            axum::routing::get({
                let state = state.clone();
                move || health_check(state)
            }),
        )
        // Test route with just domain middleware
        .route(
            "/test-domain",
            axum::routing::get(|| async { "Domain middleware working!" }).layer(
                middleware::from_fn_with_state(state.clone(), domain_middleware),
            ),
        )
        // Add OpenAPI JSON endpoint
        .route(
            "/api-docs/openapi.json",
            axum::routing::get(|| async {
                axum::Json(api::handlers::blog::ApiBlogDocs::openapi())
            }),
        )
        // Add Swagger UI route
        .route("/swagger-ui", axum::routing::get(swagger_ui_handler))
        // Mount auth routes (no middleware required, with CORS)
        .nest("/auth", auth::auth_router())
        // Mount blog module (public routes with domain + analytics middleware)
        .merge(
            BlogModule::routes()
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    domain_middleware,
                ))
                .layer(middleware::from_fn(analytics_middleware)),
        )
        // Mount session tracking (public routes with domain + analytics middleware)
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
                .layer(middleware::from_fn(analytics_middleware)),
        )
        // Mount admin module (auth + domain required)
        .nest(
            AdminModule::mount_path(),
            AdminModule::routes()
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    domain_middleware,
                )),
        )
        // Mount analytics endpoints (auth required)
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
        // Add CORS layer for all routes
        .layer({
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
