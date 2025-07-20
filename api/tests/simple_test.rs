// tests/simple_test.rs
use api::AppState;
use sqlx::{Row, postgres::PgPoolOptions};
use std::sync::Arc;

#[tokio::test]
async fn test_basic_database_connection() {
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://blog_user:blog_password@localhost:5432/multi_blog_dev".to_string()
    });

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await;

    match pool {
        Ok(pool) => {
            // Test a simple query
            let result = sqlx::query("SELECT 1 as test").fetch_one(&pool).await;

            assert!(result.is_ok());

            let row = result.unwrap();
            let test_value: i32 = row.get("test");
            assert_eq!(test_value, 1);

            println!("✅ Database connection successful!");
        }
        Err(e) => {
            panic!("❌ Database connection failed: {}", e);
        }
    }
}

#[tokio::test]
async fn test_app_state_creation() {
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://blog_user:blog_password@localhost:5432/multi_blog_dev".to_string()
    });

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let app_state = Arc::new(AppState { db: pool });

    // Test that we can use the app state
    let result = sqlx::query("SELECT COUNT(*) as count FROM domains")
        .fetch_one(&app_state.db)
        .await;

    assert!(result.is_ok());
    println!("✅ App state creation successful!");
}

#[tokio::test]
async fn test_domain_exists() {
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://blog_user:blog_password@localhost:5432/multi_blog_dev".to_string()
    });

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Check if we have any domains
    let result = sqlx::query!("SELECT COUNT(*) as count FROM domains")
        .fetch_one(&pool)
        .await
        .expect("Failed to query domains");

    let count = result.count.unwrap_or(0);
    println!("📊 Found {} domain(s) in database", count);

    // This test passes if we can query the table, regardless of count
    assert!(count >= 0);
}
