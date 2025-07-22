// tests/analytics_tests.rs
use api::{
    AppState, DomainContext, UserContext, handlers::analytics::AnalyticsModule, test_utils::*,
};
use axum::{Extension, Router};
use axum_test::TestServer;
use chrono::Utc;
use serde_json::Value;
use serial_test::serial;
use std::sync::Arc;

fn create_analytics_app(state: Arc<AppState>) -> Router {
    AnalyticsModule::routes().with_state(state)
}

async fn create_test_analytics_data(pool: &sqlx::PgPool, domain_id: i32, post_id: Option<i32>) {
    let events = vec![
        (
            "page_view",
            "/",
            "127.0.0.1",
            "Mozilla/5.0",
            Some("https://google.com"),
        ),
        (
            "post_view",
            "/posts/test",
            "127.0.0.2",
            "Chrome/91.0",
            Some("https://facebook.com"),
        ),
        ("search", "/search", "127.0.0.3", "Safari/14.0", None),
        ("page_view", "/", "127.0.0.4", "Mobile Safari", None),
    ];

    for (event_type, path, ip, user_agent, referrer) in events {
        sqlx::query!(
            r#"
            INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent, referrer, post_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            domain_id,
            event_type,
            path,
            ip,
            user_agent,
            referrer,
            post_id,
            Utc::now()
        )
        .execute(pool)
        .await
        .unwrap();
    }
}

#[tokio::test]
#[serial]
async fn test_analytics_overview() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    let post_id = create_test_post(
        &pool,
        domain.id,
        "Analytics Test Post",
        "Content for analytics",
        "Author",
        "published",
    )
    .await;

    create_test_analytics_data(&pool, domain.id, Some(post_id)).await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/overview").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();

    assert!(body.get("current_period").is_some());
    assert!(body.get("previous_period").is_some());
    assert!(body.get("change_percent").is_some());
    assert!(body.get("top_posts").is_some());
    assert!(body.get("top_categories").is_some());

    let current_period = body.get("current_period").unwrap();
    assert!(current_period.get("page_views").unwrap().as_i64().unwrap() > 0);
    assert!(current_period.get("post_views").unwrap().as_i64().unwrap() > 0);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_traffic_stats() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    create_test_analytics_data(&pool, domain.id, None).await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/traffic").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();

    assert!(body.get("daily_stats").is_some());
    assert!(body.get("hourly_distribution").is_some());
    assert!(body.get("device_breakdown").is_some());

    let device_breakdown = body.get("device_breakdown").unwrap();
    assert!(device_breakdown.get("mobile").is_some());
    assert!(device_breakdown.get("desktop").is_some());
    assert!(device_breakdown.get("tablet").is_some());

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_search_analytics() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    // Create search events with metadata
    sqlx::query!(
        r#"
        INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent, metadata, created_at)
        VALUES 
            ($1, 'search', '/search', '127.0.0.1', 'Mozilla/5.0', '{"query": "rust programming"}', $2),
            ($1, 'search', '/search', '127.0.0.2', 'Chrome/91.0', '{"query": "web development"}', $2),
            ($1, 'search', '/search', '127.0.0.3', 'Safari/14.0', '{"query": "rust programming"}', $2)
        "#,
        domain.id,
        Utc::now()
    )
    .execute(&pool)
    .await
    .unwrap();

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/search-terms").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();

    assert!(body.get("popular_terms").is_some());
    assert!(body.get("search_volume_trend").is_some());

    let popular_terms = body.get("popular_terms").unwrap().as_array().unwrap();
    assert!(!popular_terms.is_empty());

    // Check that "rust programming" appears twice
    let rust_term = popular_terms
        .iter()
        .find(|term| term.get("query").unwrap().as_str().unwrap() == "rust programming")
        .unwrap();
    assert_eq!(rust_term.get("count").unwrap().as_i64().unwrap(), 2);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_referrer_stats() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    // Create events with different referrers
    let referrers = vec![
        ("https://google.com/search", "127.0.0.1"),
        ("https://facebook.com/post", "127.0.0.2"),
        ("https://twitter.com/tweet", "127.0.0.3"),
        ("https://example.com/page", "127.0.0.4"),
    ];

    for (referrer, ip) in referrers {
        sqlx::query!(
            r#"
            INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent, referrer, created_at)
            VALUES ($1, 'page_view', '/', $2, 'Mozilla/5.0', $3, $4)
            "#,
            domain.id,
            ip,
            referrer,
            Utc::now()
        )
        .execute(&pool)
        .await
        .unwrap();
    }

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/referrers").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();

    assert!(body.get("top_referrers").is_some());
    assert!(body.get("referrer_types").is_some());

    let referrer_types = body.get("referrer_types").unwrap();
    assert!(
        referrer_types
            .get("search_engines")
            .unwrap()
            .as_i64()
            .unwrap()
            > 0
    );
    assert!(
        referrer_types
            .get("social_media")
            .unwrap()
            .as_i64()
            .unwrap()
            > 0
    );
    assert!(
        referrer_types
            .get("other_websites")
            .unwrap()
            .as_i64()
            .unwrap()
            > 0
    );

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_realtime_stats() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    // Create recent events
    sqlx::query!(
        r#"
        INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent, created_at)
        VALUES 
            ($1, 'page_view', '/', '127.0.0.1', 'Mozilla/5.0', NOW()),
            ($1, 'page_view', '/posts/test', '127.0.0.2', 'Chrome/91.0', NOW())
        "#,
        domain.id
    )
    .execute(&pool)
    .await
    .unwrap();

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/real-time").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();

    assert!(body.get("active_visitors").is_some());
    assert!(body.get("page_views_last_hour").is_some());
    assert!(body.get("top_pages_now").is_some());
    assert!(body.get("recent_events").is_some());

    let active_visitors = body.get("active_visitors").unwrap().as_i64().unwrap();
    assert!(active_visitors >= 0);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_post_analytics() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "analytics@test.com", "Analytics User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    let post_id = create_test_post(
        &pool,
        domain.id,
        "Analytics Post",
        "Post for analytics",
        "Author",
        "published",
    )
    .await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/posts").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::OK);

    let body: Value = response.json();
    let posts = body.as_array().unwrap();

    assert!(!posts.is_empty());
    let post = &posts[0];
    assert_eq!(
        post.get("title").unwrap().as_str().unwrap(),
        "Analytics Post"
    );
    assert!(post.get("views").is_some());
    assert!(post.get("unique_views").is_some());

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_unauthorized_access() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "analytics.testblog.com", "Analytics Test Blog").await;
    let user = create_test_user(&pool, "noaccess@test.com", "No Access User", "user").await;
    // Note: Not creating any permissions for this user

    let user_without_permissions = user.clone();

    let app = create_analytics_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_without_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/overview").await;

    assert_eq!(response.status_code(), axum::http::StatusCode::FORBIDDEN);

    cleanup_test_db(&pool).await;
}
