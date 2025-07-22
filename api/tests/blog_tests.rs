// tests/blog_tests.rs
use api::{AppState, DomainContext, handlers::blog::BlogModule, test_utils::*};
use axum::{
    Extension, Router,
    body::Body,
    http::{Request, StatusCode},
};
use axum_test::TestServer;
use serde_json::Value;
use serial_test::serial;
use std::sync::Arc;

fn create_blog_app(state: Arc<AppState>) -> Router {
    BlogModule::routes().with_state(state)
}

#[tokio::test]
#[serial]
async fn test_home_endpoint() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    // Create test domain and posts
    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;
    let _post_id = create_test_post(
        &pool,
        domain.id,
        "Test Post",
        "This is a test post content",
        "Test Author",
        "published",
    )
    .await;

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: Value = response.json();
    assert!(body.get("posts").is_some());

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_list_posts() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;

    // Create multiple test posts
    for i in 1..=3 {
        create_test_post(
            &pool,
            domain.id,
            &format!("Test Post {}", i),
            &format!("Content for post {}", i),
            "Test Author",
            "published",
        )
        .await;
    }

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/posts").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: Value = response.json();
    let posts = body.get("posts").unwrap().as_array().unwrap();
    assert_eq!(posts.len(), 3);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_get_post_by_slug() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;
    let _post_id = create_test_post(
        &pool,
        domain.id,
        "My Awesome Post",
        "This is awesome content",
        "John Doe",
        "published",
    )
    .await;

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/posts/my-awesome-post").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: Value = response.json();
    assert_eq!(
        body.get("title").unwrap().as_str().unwrap(),
        "My Awesome Post"
    );
    assert_eq!(body.get("author").unwrap().as_str().unwrap(), "John Doe");

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_get_nonexistent_post() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/posts/nonexistent-post").await;

    assert_eq!(response.status_code(), StatusCode::NOT_FOUND);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_search_posts() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;

    // Create posts with different content
    create_test_post(
        &pool,
        domain.id,
        "Rust Programming Guide",
        "Learn Rust programming language",
        "Developer",
        "published",
    )
    .await;

    create_test_post(
        &pool,
        domain.id,
        "JavaScript Tips",
        "Useful JavaScript programming tips",
        "Developer",
        "published",
    )
    .await;

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();

    // Search for "rust"
    let response = server.get("/search?q=rust").await;
    assert_eq!(response.status_code(), StatusCode::OK);

    let body: Value = response.json();
    let posts = body.get("posts").unwrap().as_array().unwrap();
    assert_eq!(posts.len(), 1);
    assert!(
        posts[0]
            .get("title")
            .unwrap()
            .as_str()
            .unwrap()
            .contains("Rust")
    );

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_get_category_posts() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;

    // Create posts in Technology category
    for i in 1..=2 {
        sqlx::query!(
            r#"
            INSERT INTO posts (domain_id, title, content, author, category, slug, status)
            VALUES ($1, $2, $3, 'Author', 'Technology', $4, 'published')
            "#,
            domain.id,
            format!("Tech Post {}", i),
            format!("Tech content {}", i),
            format!("tech-post-{}", i)
        )
        .execute(&pool)
        .await
        .unwrap();
    }

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/category/Technology").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: Value = response.json();
    let posts = body.get("posts").unwrap().as_array().unwrap();
    assert_eq!(posts.len(), 2);

    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_rss_feed() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });

    let domain = create_test_domain(&pool, "testblog.com", "Test Blog").await;
    create_test_post(
        &pool,
        domain.id,
        "RSS Test Post",
        "Content for RSS",
        "RSS Author",
        "published",
    )
    .await;

    let app = create_blog_app(state).layer(Extension(domain));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/feed.xml").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let content_type = response.headers().get("content-type").unwrap();
    assert!(
        content_type
            .to_str()
            .unwrap()
            .contains("application/rss+xml")
    );

    let body = response.text();
    assert!(body.contains("RSS Test Post"));
    assert!(body.contains("Test Blog"));

    cleanup_test_db(&pool).await;
}
