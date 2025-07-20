// tests/admin_tests.rs
use api::{handlers::admin::AdminModule, test_utils::*, AppState, DomainContext, UserContext};
use axum::{
    body::Body,
    http::{Request, StatusCode, HeaderValue},
    Extension, Router,
};
use axum_test::TestServer;
use serde_json::{json, Value};
use serial_test::serial;
use std::sync::Arc;

fn create_admin_app(state: Arc<AppState>) -> Router {
    AdminModule::routes().with_state(state)
}

#[tokio::test]
#[serial]
async fn test_list_admin_posts() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "admin@test.com", "Admin User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;
    
    // Create test posts
    for i in 1..=3 {
        create_test_post(
            &pool,
            domain.id,
            &format!("Admin Post {}", i),
            &format!("Admin content {}", i),
            "Admin",
            if i == 3 { "draft" } else { "published" },
        ).await;
    }

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/posts").await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: Value = response.json();
    let posts = body.as_array().unwrap();
    assert_eq!(posts.len(), 3); // Should include drafts
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_create_post() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "editor@test.com", "Editor User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "editor").await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "editor".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    
    let new_post = json!({
        "title": "New Test Post",
        "content": "This is a new test post",
        "category": "Technology",
        "slug": "new-test-post",
        "status": "published"
    });

    let response = server.post("/posts").json(&new_post).await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: Value = response.json();
    assert_eq!(body.get("title").unwrap().as_str().unwrap(), "New Test Post");
    assert_eq!(body.get("status").unwrap().as_str().unwrap(), "published");
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_create_post_insufficient_permissions() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "viewer@test.com", "Viewer User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await; // Only viewer permission

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    
    let new_post = json!({
        "title": "Unauthorized Post",
        "content": "This should fail",
        "category": "Technology"
    });

    let response = server.post("/posts").json(&new_post).await;

    assert_eq!(response.status_code(), StatusCode::FORBIDDEN);
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_get_admin_post() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "admin@test.com", "Admin User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;
    
    let post_id = create_test_post(
        &pool,
        domain.id,
        "Admin Test Post",
        "Admin test content",
        "Admin Author",
        "published",
    ).await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "viewer".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get(&format!("/posts/{}", post_id)).await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: Value = response.json();
    assert_eq!(body.get("title").unwrap().as_str().unwrap(), "Admin Test Post");
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_update_post() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "editor@test.com", "Editor User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "editor").await;
    
    let post_id = create_test_post(
        &pool,
        domain.id,
        "Original Title",
        "Original content",
        "Original Author",
        "draft",
    ).await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "editor".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    
    let updated_post = json!({
        "title": "Updated Title",
        "content": "Updated content",
        "category": "Programming",
        "status": "published"
    });

    let response = server.put(&format!("/posts/{}", post_id)).json(&updated_post).await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: Value = response.json();
    assert_eq!(body.get("title").unwrap().as_str().unwrap(), "Updated Title");
    assert_eq!(body.get("status").unwrap().as_str().unwrap(), "published");
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_delete_post() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "admin@test.com", "Admin User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "admin").await; // Admin permission needed for delete
    
    let post_id = create_test_post(
        &pool,
        domain.id,
        "Post to Delete",
        "This will be deleted",
        "Author",
        "published",
    ).await;

    let mut user_with_permissions = user.clone();
    user_with_permissions.domain_permissions = vec![api::DomainPermission {
        domain_id: domain.id,
        role: "admin".to_string(),
    }];

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.delete(&format!("/posts/{}", post_id)).await;

    assert_eq!(response.status_code(), StatusCode::NO_CONTENT);
    
    cleanup_test_db(&pool).await;
}

#[tokio::test]
#[serial]
async fn test_analytics_summary() {
    let pool = create_test_db().await;
    let state = Arc::new(AppState { db: pool.clone() });
    
    let domain = create_test_domain(&pool, "admin.testblog.com", "Admin Test Blog").await;
    let user = create_test_user(&pool, "admin@test.com", "Admin User", "user").await;
    create_test_permission(&pool, user.id, domain.id, "viewer").await;

    // Create some analytics events
    sqlx::query!(
        r#"
        INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent)
        VALUES 
            ($1, 'page_view', '/', '127.0.0.1', 'test-agent'),
            ($1, 'post_view', '/posts/test', '127.0.0.1', 'test-agent'),
            ($1, 'search', '/search', '127.0.0.2', 'test-agent')
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

    let app = create_admin_app(state)
        .layer(Extension(domain))
        .layer(Extension(user_with_permissions));

    let server = TestServer::new(app).unwrap();
    let response = server.get("/analytics").await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: Value = response.json();
    let last_30_days = body.get("last_30_days").unwrap();
    assert_eq!(last_30_days.get("page_views").unwrap().as_i64().unwrap(), 1);
    assert_eq!(last_30_days.get("post_views").unwrap().as_i64().unwrap(), 1);
    assert_eq!(last_30_days.get("searches").unwrap().as_i64().unwrap(), 1);
    
    cleanup_test_db(&pool).await;
}
