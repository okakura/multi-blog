// src/handlers/admin.rs
use crate::{AppState, DomainContext, UserContext};
use axum::{
    Extension, Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub struct AdminModule;

impl super::HandlerModule for AdminModule {
    fn routes() -> Router<Arc<AppState>> {
        Router::new()
            .route("/posts", get(list_admin_posts).post(create_post))
            .route(
                "/posts/{id}",
                get(get_admin_post).put(update_post).delete(delete_post),
            )
            .route("/analytics", get(get_analytics_summary))
            .route(
                "/domain/settings",
                get(get_domain_settings).put(update_domain_settings),
            )
    }

    fn mount_path() -> &'static str {
        "/admin"
    }
}

#[derive(Serialize, Deserialize)]
struct CreatePostRequest {
    title: String,
    content: String,
    category: String,
    slug: Option<String>,
    status: Option<String>, // draft, published
}

#[derive(Serialize, sqlx::FromRow)]
struct AdminPostResponse {
    id: i32,
    title: String,
    content: String,
    author: Option<String>,
    category: Option<String>,
    slug: String,
    status: Option<String>,
    created_at: Option<chrono::DateTime<chrono::Utc>>,
    updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

// Check if user has permission for this domain
fn check_domain_permission(
    user: &UserContext,
    domain_id: i32,
    required_role: &str,
) -> Result<(), StatusCode> {
    if user.role == "super_admin" {
        return Ok(());
    }

    let permission = user
        .domain_permissions
        .iter()
        .find(|p| p.domain_id == domain_id)
        .ok_or(StatusCode::FORBIDDEN)?;

    match (required_role, permission.role.as_str()) {
        ("viewer", _) => Ok(()),
        ("editor", "editor" | "admin") => Ok(()),
        ("admin", "admin") => Ok(()),
        _ => Err(StatusCode::FORBIDDEN),
    }
}

async fn list_admin_posts(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<AdminPostResponse>>, StatusCode> {
    check_domain_permission(&user, domain.id, "viewer")?;

    let posts = sqlx::query_as!(
        AdminPostResponse,
        r#"
        SELECT id, title, content, author, category, slug, status, created_at, updated_at
        FROM posts 
        WHERE domain_id = $1
        ORDER BY updated_at DESC
        "#,
        domain.id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(posts))
}

async fn create_post(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreatePostRequest>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    check_domain_permission(&user, domain.id, "editor")?;

    let slug = payload.slug.unwrap_or_else(|| {
        payload
            .title
            .to_lowercase()
            .replace(" ", "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect()
    });

    let status = payload.status.unwrap_or_else(|| "draft".to_string());

    let post = sqlx::query_as!(
        AdminPostResponse,
        r#"
        INSERT INTO posts (domain_id, title, content, author, category, slug, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, content, author, category, slug, status, created_at, updated_at
        "#,
        domain.id,
        payload.title,
        payload.content,
        user.name,
        payload.category,
        slug,
        status
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(post))
}

async fn get_admin_post(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    check_domain_permission(&user, domain.id, "viewer")?;

    let post = sqlx::query_as!(
        AdminPostResponse,
        r#"
        SELECT id, title, content, author, category, slug, status, created_at, updated_at
        FROM posts 
        WHERE id = $1 AND domain_id = $2
        "#,
        id,
        domain.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(post))
}

async fn update_post(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(payload): Json<CreatePostRequest>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    check_domain_permission(&user, domain.id, "editor")?;

    let slug = payload.slug.unwrap_or_else(|| {
        payload
            .title
            .to_lowercase()
            .replace(" ", "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect()
    });

    let status = payload.status.unwrap_or_else(|| "draft".to_string());

    let post = sqlx::query_as!(
        AdminPostResponse,
        r#"
        UPDATE posts 
        SET title = $3, content = $4, category = $5, slug = $6, status = $7, updated_at = NOW()
        WHERE id = $1 AND domain_id = $2
        RETURNING id, title, content, author, category, slug, status, created_at, updated_at
        "#,
        id,
        domain.id,
        payload.title,
        payload.content,
        payload.category,
        slug,
        status
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(post))
}

async fn delete_post(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<StatusCode, StatusCode> {
    check_domain_permission(&user, domain.id, "admin")?;

    let rows_affected = sqlx::query!(
        "DELETE FROM posts WHERE id = $1 AND domain_id = $2",
        id,
        domain.id
    )
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .rows_affected();

    if rows_affected > 0 {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn get_analytics_summary(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    check_domain_permission(&user, domain.id, "viewer")?;

    // Get basic analytics for the last 30 days
    let summary = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) FILTER (WHERE event_type = 'search') as searches
        FROM analytics_events 
        WHERE domain_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        "#,
        domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "last_30_days": {
            "page_views": summary.page_views.unwrap_or(0),
            "post_views": summary.post_views.unwrap_or(0),
            "unique_visitors": summary.unique_visitors.unwrap_or(0),
            "searches": summary.searches.unwrap_or(0)
        }
    })))
}

async fn get_domain_settings(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
) -> Result<Json<DomainContext>, StatusCode> {
    check_domain_permission(&user, domain.id, "viewer")?;
    Ok(Json(domain))
}

async fn update_domain_settings(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<DomainContext>, StatusCode> {
    check_domain_permission(&user, domain.id, "admin")?;

    // Update domain settings (simplified)
    let default_theme = serde_json::json!({});
    let default_categories = serde_json::json!([]);

    let theme_config = payload.get("theme_config").unwrap_or(&default_theme);
    let categories = payload.get("categories").unwrap_or(&default_categories);

    sqlx::query!(
        "UPDATE domains SET theme_config = $2, categories = $3 WHERE id = $1",
        domain.id,
        theme_config,
        categories
    )
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Return updated domain (in real implementation, you'd fetch from DB)
    Ok(Json(domain))
}
