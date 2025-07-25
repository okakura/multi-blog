// src/test_utils.rs
use crate::{AppState, DomainContext, UserContext};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::sync::Arc;

/// Create a test database pool for integration tests
pub async fn create_test_db() -> PgPool {
    let database_url = std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://blog_user:blog_password@localhost:5432/multi_blog_test".to_string()
    });

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    // Run migrations
    sqlx::migrate!("../../../services/database/migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    pool
}

/// Create test app state
pub async fn create_test_app_state() -> Arc<AppState> {
    let db = create_test_db().await;
    Arc::new(AppState { db })
}

/// Clean up test database
pub async fn cleanup_test_db(pool: &PgPool) {
    // Delete all data in reverse order of dependencies
    let _ = sqlx::query("DELETE FROM analytics_events")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM posts").execute(pool).await;
    let _ = sqlx::query("DELETE FROM user_domain_permissions")
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users").execute(pool).await;
    let _ = sqlx::query("DELETE FROM domains").execute(pool).await;
}

/// Create a test domain
pub async fn create_test_domain(pool: &PgPool, hostname: &str, name: &str) -> DomainContext {
    let row = sqlx::query!(
        r#"
        INSERT INTO domains (hostname, name, theme_config, categories)
        VALUES ($1, $2, '{}', '["Technology", "Programming"]')
        RETURNING id, hostname, name, theme_config, categories
        "#,
        hostname,
        name
    )
    .fetch_one(pool)
    .await
    .expect("Failed to create test domain");

    DomainContext {
        id: row.id,
        hostname: row.hostname,
        name: row.name,
        theme_config: row.theme_config.unwrap_or_default(),
        categories: vec!["Technology".to_string(), "Programming".to_string()],
    }
}

/// Create a test user
pub async fn create_test_user(pool: &PgPool, email: &str, name: &str, role: &str) -> UserContext {
    let row = sqlx::query!(
        r#"
        INSERT INTO users (email, name, password_hash, role)
        VALUES ($1, $2, '$2b$10$rOiMbkqEhUc7BxB7N2ZkzOK8jE4zF3tA8LdKvC2pQ7eH9gS5wX1nC', $3)
        RETURNING id, email, name, role
        "#,
        email,
        name,
        role
    )
    .fetch_one(pool)
    .await
    .expect("Failed to create test user");

    UserContext {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role.unwrap_or_default(),
        domain_permissions: vec![],
    }
}

/// Create domain permission for test user
pub async fn create_test_permission(pool: &PgPool, user_id: i32, domain_id: i32, role: &str) {
    sqlx::query!(
        "INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES ($1, $2, $3)",
        user_id,
        domain_id,
        role
    )
    .execute(pool)
    .await
    .expect("Failed to create test permission");
}

/// Create a test post
pub async fn create_test_post(
    pool: &PgPool,
    domain_id: i32,
    title: &str,
    content: &str,
    author: &str,
    status: &str,
) -> i32 {
    let row = sqlx::query!(
        r#"
        INSERT INTO posts (domain_id, title, content, author, category, slug, status)
        VALUES ($1, $2, $3, $4, 'Technology', $5, $6)
        RETURNING id
        "#,
        domain_id,
        title,
        content,
        author,
        title.to_lowercase().replace(" ", "-"),
        status
    )
    .fetch_one(pool)
    .await
    .expect("Failed to create test post");

    row.id
}

/// Mock JWT token for testing
pub fn mock_jwt_token(user_id: i32) -> String {
    format!("mock_token_for_user_{}", user_id)
}

#[macro_export]
macro_rules! test_with_db {
    ($test_name:ident, $test_fn:expr) => {
        #[tokio::test]
        #[serial_test::serial]
        async fn $test_name() {
            let pool = crate::test_utils::create_test_db().await;

            // Run the test
            let result = $test_fn(&pool).await;

            // Clean up
            crate::test_utils::cleanup_test_db(&pool).await;

            result
        }
    };
}
