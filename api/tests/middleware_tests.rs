// tests/middleware_tests.rs
use api::{test_utils::*, AppState, DomainContext, domain_middleware, analytics_middleware, auth_middleware};
use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode, HeaderMap, HeaderValue},
    middleware,
    response::Response,
    routing::get,
    Extension, Router,
};
use axum_test::TestServer;
use serial_test::serial;
use std::sync::Arc;

async fn test_handler(Extension(domain): Extension<DomainContext>) -> String {
    format!("Domain: {} ({})", domain.name, domain.hostname)
}

async fn test_analytics_handler(
    Extension(analytics): Extension<api::AnalyticsContext>,
) -> String {
    format!("Analytics: {} from {}", analytics.ip_address, analytics.user_agent)
}

#[tokio::test]
#[serial]
async fn test_domain_middleware_success() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    // Create test domain
    create_test_domain(&pool, "testdomain.com", "Test Domain").await;

    let app = Router::new()
        .route("/test", get(test_handler))
        .layer(middleware::from_fn_with_state(state.clone(), domain_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    let response = server
        .get("/test")
        .add_header("host", HeaderValue::from_static("testdomain.com"))
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let body = response.text();
    assert!(body.contains("Test Domain"));
    assert!(body.contains("testdomain.com"));
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_domain_middleware_unknown_domain() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let app = Router::new()
        .route("/test", get(test_handler))
        .layer(middleware::from_fn_with_state(state.clone(), domain_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    let response = server
        .get("/test")
        .add_header("host", HeaderValue::from_static("unknowndomain.com"))
        .await;

    assert_eq!(response.status_code(), StatusCode::NOT_FOUND);
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial] 
async fn test_domain_middleware_with_port() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    // Create test domain
    create_test_domain(&pool, "testdomain.com", "Test Domain").await;

    let app = Router::new()
        .route("/test", get(test_handler))
        .layer(middleware::from_fn_with_state(state.clone(), domain_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    // Test with port number in host header
    let response = server
        .get("/test")
        .add_header("host", HeaderValue::from_static("testdomain.com:8080"))
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let body = response.text();
    assert!(body.contains("Test Domain"));
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
async fn test_analytics_middleware() {
    let app = Router::new()
        .route("/test", get(test_analytics_handler))
        .layer(middleware::from_fn(analytics_middleware));

    let server = TestServer::new(app).unwrap();
    
    let response = server
        .get("/test")
        .add_header("user-agent", HeaderValue::from_static("TestAgent/1.0"))
        .add_header("referer", HeaderValue::from_static("https://example.com"))
        .add_header("x-forwarded-for", HeaderValue::from_static("192.168.1.100"))
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let body = response.text();
    assert!(body.contains("192.168.1.100"));
    assert!(body.contains("TestAgent/1.0"));
}

#[tokio::test]
async fn test_analytics_middleware_defaults() {
    let app = Router::new()
        .route("/test", get(test_analytics_handler))
        .layer(middleware::from_fn(analytics_middleware));

    let server = TestServer::new(app).unwrap();
    
    // Request without user-agent and other headers
    let response = server.get("/test").await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let body = response.text();
    assert!(body.contains("127.0.0.1")); // Default IP
    assert!(body.contains("unknown")); // Default user agent
}

async fn test_auth_handler(Extension(user): Extension<api::UserContext>) -> String {
    format!("User: {} ({})", user.name, user.email)
}

#[tokio::test]
#[serial]
async fn test_auth_middleware_missing_token() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let app = Router::new()
        .route("/test", get(test_auth_handler))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    let response = server.get("/test").await;

    assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_auth_middleware_with_token() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let app = Router::new()
        .route("/test", get(test_auth_handler))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    let response = server
        .get("/test")
        .add_header("authorization", HeaderValue::from_static("Bearer valid_token"))
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let body = response.text();
    assert!(body.contains("Admin User"));
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_auth_middleware_invalid_format() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let app = Router::new()
        .route("/test", get(test_auth_handler))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        .with_state(state);

    let server = TestServer::new(app).unwrap();
    
    let response = server
        .get("/test")
        .add_header("authorization", HeaderValue::from_static("InvalidFormat token"))
        .await;

    assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);
    
    cleanup_test_db(&pool).await;
}
