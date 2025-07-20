use api::{
    AppState, analytics_middleware, auth_middleware, domain_middleware,
    handlers::{
        HandlerModule, admin::AdminModule, analytics::AnalyticsModule, auth, blog::BlogModule,
    },
};
use axum::{Router, middleware, response::Html};
use std::sync::Arc;
use tokio::net::TcpListener;
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

    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    println!("🚀 Server running on http://localhost:3000");

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
            axum::routing::get(|| async { axum::Json(serde_json::json!({"status": "ok"})) }),
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
        // Mount analytics module (auth + domain required)
        .nest(
            AnalyticsModule::mount_path(),
            AnalyticsModule::routes()
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    domain_middleware,
                )),
        )
        // Add CORS layer for all routes
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any),
        )
        .with_state(state)
}
