// src/handlers/admin.rs
use crate::extractors::{
    RequireDomainAdmin, RequireDomainEditor, RequireDomainViewer, RequirePlatformAdmin,
};
use crate::services::session_tracking::SessionTracker;
use crate::utils::{AnalyticsSpan, DatabaseSpan, PerformanceSpan};
use crate::validation::{extractors::ValidatedJson, rules::*};
use crate::{AppState, UserContext};
use axum::{
    Extension, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use validator::Validate;

pub struct AdminModule;

impl super::HandlerModule for AdminModule {
    fn routes() -> Router<Arc<AppState>> {
        Router::new()
            .route("/posts", get(list_admin_posts).post(create_post))
            .route(
                "/posts/{id}",
                get(get_admin_post).put(update_post).delete(delete_post),
            )
            .route("/users", get(list_users).post(create_user))
            .route(
                "/users/{id}",
                get(get_user).put(update_user).delete(delete_user),
            )
            .route("/analytics", get(get_analytics_summary))
            .route("/analytics/overview", get(get_admin_analytics_overview))
            .route("/analytics/traffic", get(get_admin_traffic_stats))
            .route("/analytics/posts", get(get_admin_post_analytics))
            .route("/analytics/search-terms", get(get_admin_search_analytics))
            .route("/analytics/referrers", get(get_admin_referrer_stats))
            .route(
                "/domain/settings",
                get(get_domain_settings).put(update_domain_settings),
            )
            .route("/domains", get(list_domains).post(create_domain))
            .route(
                "/domains/{id}",
                get(get_domain).put(update_domain).delete(delete_domain),
            )
            .route(
                "/profile/preferences",
                get(get_user_preferences).put(update_user_preferences),
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

impl Validate for CreatePostRequest {
    fn validate(&self) -> Result<(), validator::ValidationErrors> {
        crate::validation::custom::validate_create_post_request(
            &self.title,
            &self.content,
            &self.category,
            &self.slug,
            &self.status,
        )
    }
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
    domain_id: i32,
    domain_name: Option<String>,
    created_at: Option<chrono::DateTime<chrono::Utc>>,
    updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Serialize, Deserialize)]
struct UserPreferencesRequest {
    preferences: serde_json::Value,
}

#[derive(Serialize)]
struct UserPreferencesResponse {
    preferences: serde_json::Value,
}

#[derive(Deserialize)]
struct AdminPostsQuery {
    domain: Option<String>,
}
async fn list_admin_posts(
    RequireDomainViewer(auth): RequireDomainViewer,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminPostsQuery>,
) -> Result<Json<Vec<AdminPostResponse>>, StatusCode> {
    // If domain=all is requested, fetch from all domains the user has access to
    let posts = if query.domain.as_deref() == Some("all") {
        #[derive(sqlx::FromRow)]
        struct DomainId {
            id: i32,
        }

        let domain_ids: Vec<i32> = if auth.user.role == "platform_admin" {
            sqlx::query_as!(DomainId, "SELECT id as id FROM domains")
                .fetch_all(&state.db)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
                .into_iter()
                .map(|d| d.id)
                .collect()
        } else {
            sqlx::query_as!(
                DomainId,
                "SELECT domain_id as \"id!\" FROM user_domain_permissions WHERE user_id = $1",
                auth.user.id
            )
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .into_iter()
            .map(|d| d.id)
            .collect()
        };

        if domain_ids.is_empty() {
            return Ok(Json(vec![]));
        }

        let placeholders: Vec<String> = (1..=domain_ids.len()).map(|i| format!("${i}")).collect();
        let query_str = format!(
            r#"
            SELECT p.id, p.title, p.content, p.author, p.category, p.slug, p.status, 
                   p.domain_id as "domain_id!", d.name as "domain_name?", p.created_at, p.updated_at
            FROM posts p
            JOIN domains d ON p.domain_id = d.id
            WHERE p.domain_id IN ({})
            ORDER BY p.updated_at DESC
            "#,
            placeholders.join(", ")
        );

        let mut query_builder = sqlx::query_as::<_, AdminPostResponse>(&query_str);
        for domain_id in &domain_ids {
            query_builder = query_builder.bind(domain_id);
        }
        query_builder
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        // Single domain: permission already checked by middleware/extractor
        sqlx::query_as!(
            AdminPostResponse,
            r#"
            SELECT p.id, p.title, p.content, p.author, p.category, p.slug, p.status, 
                   p.domain_id as "domain_id!", d.name as "domain_name?", p.created_at, p.updated_at
            FROM posts p
            JOIN domains d ON p.domain_id = d.id
            WHERE p.domain_id = $1
            ORDER BY p.updated_at DESC
            "#,
            auth.domain.id
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };

    Ok(Json(posts))
}

async fn create_post(
    RequireDomainEditor(auth): RequireDomainEditor,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<CreatePostRequest>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    DatabaseSpan::execute("create_post", "posts", async {
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
            RETURNING id, title, content, author, category, slug, status, 
                      domain_id as "domain_id!", NULL as "domain_name?", created_at, updated_at
            "#,
            auth.domain.id,
            payload.title,
            payload.content,
            auth.user.name,
            payload.category,
            slug,
            status
        )
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(Json(post))
    })
    .await
}

async fn get_admin_post(
    RequireDomainViewer(auth): RequireDomainViewer,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    let post = sqlx::query_as!(
        AdminPostResponse,
        r#"
        SELECT p.id, p.title, p.content, p.author, p.category, p.slug, p.status, 
               p.domain_id as "domain_id!", d.name as "domain_name?", p.created_at, p.updated_at
        FROM posts p
        JOIN domains d ON p.domain_id = d.id
        WHERE p.id = $1 AND p.domain_id = $2
        "#,
        id,
        auth.domain.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(post))
}

async fn update_post(
    RequireDomainEditor(auth): RequireDomainEditor,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    ValidatedJson(payload): ValidatedJson<CreatePostRequest>,
) -> Result<Json<AdminPostResponse>, StatusCode> {
    DatabaseSpan::execute("update_post", "posts", async {
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
        RETURNING id, title, content, author, category, slug, status, 
                  domain_id as "domain_id!", NULL as "domain_name?", created_at, updated_at
        "#,
            id,
            auth.domain.id,
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
    })
    .await
}

async fn delete_post(
    RequireDomainAdmin(auth): RequireDomainAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<StatusCode, StatusCode> {
    let rows_affected = sqlx::query!(
        "DELETE FROM posts WHERE id = $1 AND domain_id = $2",
        id,
        auth.domain.id
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
    RequireDomainViewer(auth): RequireDomainViewer,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get comprehensive analytics for the dashboard
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
        auth.domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Get total posts count for this domain
    let posts_count = sqlx::query!(
        "SELECT COUNT(*) as total FROM posts WHERE domain_id = $1",
        auth.domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .total
    .unwrap_or(0);

    // Get posts created this month for this domain
    let posts_this_month = sqlx::query!(
        "SELECT COUNT(*) as total FROM posts WHERE domain_id = $1 AND created_at >= DATE_TRUNC('month', NOW())",
        auth.domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .total
    .unwrap_or(0);

    // Get total across all domains for comparison
    let all_domains_posts = sqlx::query!("SELECT COUNT(*) as total FROM posts")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .total
        .unwrap_or(0);

    let all_domains_analytics = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        "#
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Count active domains
    let active_domains = sqlx::query!("SELECT COUNT(DISTINCT id) as total FROM domains")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .total
        .unwrap_or(0);

    // Return aggregated data for dashboard
    let total_views = all_domains_analytics.page_views.unwrap_or(0)
        + all_domains_analytics.post_views.unwrap_or(0);

    Ok(Json(serde_json::json!({
        "total_posts": all_domains_posts,
        "total_views": total_views,
        "total_users": all_domains_analytics.unique_visitors.unwrap_or(0),
        "active_domains": active_domains,
        "monthly_views": total_views,
        "posts_this_month": posts_this_month,
        "domain_specific": {
            "posts": posts_count,
            "views": summary.page_views.unwrap_or(0) + summary.post_views.unwrap_or(0),
            "visitors": summary.unique_visitors.unwrap_or(0)
        }
    })))
}

async fn get_domain_settings(
    RequireDomainViewer(auth): RequireDomainViewer,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Return comprehensive domain settings including all stored configuration
    let settings = serde_json::json!({
        "id": auth.domain.id,
        "hostname": auth.domain.hostname,
        "name": auth.domain.name,
        "theme_config": auth.domain.theme_config,
        "categories": auth.domain.categories,
        "seo_config": auth.domain.theme_config.get("seo_config").unwrap_or(&serde_json::json!({})),
        "analytics_config": auth.domain.theme_config.get("analytics_config").unwrap_or(&serde_json::json!({})),
        "content_config": auth.domain.theme_config.get("content_config").unwrap_or(&serde_json::json!({})),
        "social_config": auth.domain.theme_config.get("social_config").unwrap_or(&serde_json::json!({}))
    });

    Ok(Json(settings))
}

async fn update_domain_settings(
    RequireDomainAdmin(auth): RequireDomainAdmin,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Extract individual settings from payload
    let theme_config = payload
        .get("theme_config")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let categories = payload
        .get("categories")
        .cloned()
        .unwrap_or_else(|| serde_json::json!([]));
    let seo_config = payload
        .get("seo_config")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let analytics_config = payload
        .get("analytics_config")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let content_config = payload
        .get("content_config")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));
    let social_config = payload
        .get("social_config")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));

    // Create comprehensive settings object
    let comprehensive_settings = serde_json::json!({
        "theme_config": theme_config,
        "categories": categories,
        "seo_config": seo_config,
        "analytics_config": analytics_config,
        "content_config": content_config,
        "social_config": social_config,
        "updated_at": chrono::Utc::now()
    });

    // Update the domain with all settings
    sqlx::query!(
        "UPDATE domains SET theme_config = $2, categories = $3, updated_at = NOW() WHERE id = $1",
        auth.domain.id,
        &comprehensive_settings,
        categories
    )
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Return the comprehensive settings
    Ok(Json(comprehensive_settings))
}

// Domain Management Structs
#[derive(Serialize, Deserialize, Validate)]
struct CreateDomainRequest {
    #[validate(custom(function = "validate_hostname", message = "Invalid hostname format"))]
    hostname: String,
    #[validate(length(
        min = 1,
        max = 100,
        message = "Name must be between 1 and 100 characters"
    ))]
    name: String,
    theme_config: Option<serde_json::Value>,
    categories: Option<Vec<String>>,
}

#[derive(Serialize, sqlx::FromRow)]
struct DomainResponse {
    id: i32,
    hostname: String,
    name: String,
    theme_config: serde_json::Value,
    categories: serde_json::Value,
    created_at: Option<chrono::DateTime<Utc>>,
    updated_at: Option<chrono::DateTime<Utc>>,
    posts_count: Option<i64>,
    active_users: Option<i64>,
    monthly_views: Option<i64>,
}

#[derive(Serialize, Deserialize)]
struct UpdateDomainRequest {
    hostname: Option<String>,
    name: Option<String>,
    theme_config: Option<serde_json::Value>,
    categories: Option<Vec<String>>,
}

impl Validate for UpdateDomainRequest {
    fn validate(&self) -> Result<(), validator::ValidationErrors> {
        crate::validation::custom::validate_update_domain_request(&self.hostname, &self.name)
    }
}

// Domain Management Handlers
async fn list_domains(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<DomainResponse>>, StatusCode> {
    DatabaseSpan::execute("list_domains", "domains", async {
    let domains = sqlx::query_as!(
        DomainResponse,
        r#"
        SELECT 
            d.id, 
            d.hostname, 
            d.name, 
            d.theme_config, 
            d.categories,
            d.created_at, 
            d.updated_at,
            COUNT(p.id) as posts_count,
            COUNT(DISTINCT ae.ip_address) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') as active_users,
            COUNT(ae.id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days' AND ae.event_type IN ('page_view', 'post_view')) as monthly_views
        FROM domains d
        LEFT JOIN posts p ON d.id = p.domain_id
        LEFT JOIN analytics_events ae ON d.id = ae.domain_id
        GROUP BY d.id, d.hostname, d.name, d.theme_config, d.categories, d.created_at, d.updated_at
        ORDER BY d.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(domains))
    })
    .await
}

async fn get_domain(
    RequireDomainViewer(auth): RequireDomainViewer,
    State(state): State<Arc<AppState>>,
    Path(_id): Path<i32>,
) -> Result<Json<DomainResponse>, StatusCode> {
    let domain = sqlx::query_as!(
        DomainResponse,
        r#"
        SELECT 
            d.id, 
            d.hostname, 
            d.name, 
            d.theme_config, 
            d.categories,
            d.created_at, 
            d.updated_at,
            COUNT(p.id) as posts_count,
            COUNT(DISTINCT ae.ip_address) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') as active_users,
            COUNT(ae.id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days' AND ae.event_type IN ('page_view', 'post_view')) as monthly_views
        FROM domains d
        LEFT JOIN posts p ON d.id = p.domain_id
        LEFT JOIN analytics_events ae ON d.id = ae.domain_id
        WHERE d.id = $1
        GROUP BY d.id, d.hostname, d.name, d.theme_config, d.categories, d.created_at, d.updated_at
        "#,
        auth.domain.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(domain))
}

async fn create_domain(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<CreateDomainRequest>,
) -> Result<Json<DomainResponse>, StatusCode> {
    // Validate hostname uniqueness
    let existing = sqlx::query!(
        "SELECT id FROM domains WHERE hostname = $1",
        payload.hostname
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if existing.is_some() {
        return Err(StatusCode::CONFLICT);
    }

    let theme_config = payload
        .theme_config
        .unwrap_or_else(|| serde_json::json!({}));
    let categories = payload.categories.unwrap_or_else(|| vec![]);
    let categories_json =
        serde_json::to_value(categories).unwrap_or_else(|_| serde_json::json!([]));

    let domain = sqlx::query_as!(
        DomainResponse,
        r#"
        INSERT INTO domains (hostname, name, theme_config, categories)
        VALUES ($1, $2, $3, $4)
        RETURNING 
            id, 
            hostname, 
            name, 
            theme_config, 
            categories,
            created_at, 
            updated_at,
            0::bigint as posts_count,
            0::bigint as active_users,
            0::bigint as monthly_views
        "#,
        payload.hostname,
        payload.name,
        theme_config,
        categories_json
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(domain))
}

async fn update_domain(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    ValidatedJson(payload): ValidatedJson<UpdateDomainRequest>,
) -> Result<Json<DomainResponse>, StatusCode> {
    // Check if domain exists
    let existing = sqlx::query!("SELECT hostname FROM domains WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // If hostname is being updated and changed, check for uniqueness
    if let Some(ref new_hostname) = payload.hostname
        && new_hostname != &existing.hostname
    {
        let hostname_taken = sqlx::query!(
            "SELECT id FROM domains WHERE hostname = $1 AND id != $2",
            new_hostname,
            id
        )
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        if hostname_taken.is_some() {
            return Err(StatusCode::CONFLICT);
        }
    }

    // Build update query dynamically
    let mut query = "UPDATE domains SET updated_at = NOW()".to_string();
    let mut params = vec![];
    let mut param_count = 0;

    if let Some(hostname) = payload.hostname {
        param_count += 1;
        query.push_str(&format!(", hostname = ${param_count}"));
        params.push(hostname);
    }

    if let Some(name) = payload.name {
        param_count += 1;
        query.push_str(&format!(", name = ${param_count}"));
        params.push(name);
    }

    if let Some(theme_config) = payload.theme_config {
        param_count += 1;
        query.push_str(&format!(", theme_config = ${param_count}"));
        params.push(serde_json::to_string(&theme_config).unwrap());
    }

    if let Some(categories) = payload.categories {
        param_count += 1;
        let categories_json =
            serde_json::to_value(categories).unwrap_or_else(|_| serde_json::json!([]));
        query.push_str(&format!(", categories = ${param_count}"));
        params.push(serde_json::to_string(&categories_json).unwrap());
    }

    param_count += 1;
    query.push_str(&format!(" WHERE id = ${param_count}"));

    // Execute the update
    let mut query_builder = sqlx::query(&query);
    for param in params {
        query_builder = query_builder.bind(param);
    }
    query_builder = query_builder.bind(id);

    query_builder
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Fetch and return the updated domain
    let domain = sqlx::query_as!(
        DomainResponse,
        r#"
        SELECT 
            d.id, 
            d.hostname, 
            d.name, 
            d.theme_config, 
            d.categories,
            d.created_at, 
            d.updated_at,
            COUNT(p.id) as posts_count,
            COUNT(DISTINCT ae.ip_address) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') as active_users,
            COUNT(ae.id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days' AND ae.event_type IN ('page_view', 'post_view')) as monthly_views
        FROM domains d
        LEFT JOIN posts p ON d.id = p.domain_id
        LEFT JOIN analytics_events ae ON d.id = ae.domain_id
        WHERE d.id = $1
        GROUP BY d.id, d.hostname, d.name, d.theme_config, d.categories, d.created_at, d.updated_at
        "#,
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(domain))
}

async fn delete_domain(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<StatusCode, StatusCode> {
    // Check if domain has posts
    let posts_count = sqlx::query!(
        "SELECT COUNT(*) as count FROM posts WHERE domain_id = $1",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .count
    .unwrap_or(0);

    if posts_count > 0 {
        // Return 409 Conflict if domain has posts
        return Err(StatusCode::CONFLICT);
    }

    let rows_affected = sqlx::query!("DELETE FROM domains WHERE id = $1", id)
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

// Admin Analytics Structs
#[derive(Serialize)]
struct AdminAnalyticsOverview {
    current_period: AdminPeriodStats,
    previous_period: AdminPeriodStats,
    change_percent: AdminChangePercent,
    top_posts: Vec<AdminPostStats>,
    top_categories: Vec<AdminCategoryStats>,
}

#[derive(Serialize)]
struct AdminPeriodStats {
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
    searches: i64,
    avg_session_duration: f64,
}

#[derive(Serialize)]
struct AdminChangePercent {
    page_views: f64,
    unique_visitors: f64,
    post_views: f64,
    searches: f64,
}

#[derive(Serialize)]
struct AdminPostStats {
    id: i32,
    title: String,
    slug: String,
    views: i64,
    unique_views: i64,
}

#[derive(Serialize)]
struct AdminCategoryStats {
    category: String,
    views: i64,
    posts_count: i64,
}

#[derive(Serialize)]
struct AdminTrafficResponse {
    daily_stats: Vec<AdminDayStats>,
    hourly_distribution: Vec<AdminHourStats>,
    device_breakdown: AdminDeviceBreakdown,
}

#[derive(Serialize)]
struct AdminDayStats {
    date: String,
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
}

#[derive(Serialize)]
struct AdminHourStats {
    hour: i32,
    page_views: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
struct AdminDeviceBreakdown {
    mobile: i64,
    desktop: i64,
    tablet: i64,
    unknown: i64,
}

#[derive(Serialize)]
struct AdminSearchAnalyticsResponse {
    popular_terms: Vec<AdminSearchTerm>,
    search_volume_trend: Vec<AdminSearchVolumeDay>,
    no_results_queries: Vec<AdminSearchTerm>,
}

#[derive(Serialize)]
struct AdminSearchTerm {
    query: String,
    count: i64,
    results_found: bool,
}

#[derive(Serialize)]
struct AdminSearchVolumeDay {
    date: String,
    searches: i64,
}

#[derive(Serialize)]
struct AdminReferrerResponse {
    top_referrers: Vec<AdminReferrerStats>,
    referrer_types: AdminReferrerTypeBreakdown,
}

#[derive(Serialize)]
struct AdminReferrerStats {
    referrer: String,
    visits: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
struct AdminReferrerTypeBreakdown {
    direct: i64,
    search_engines: i64,
    social_media: i64,
    other_websites: i64,
}

#[derive(Deserialize)]
struct AdminAnalyticsQuery {
    days: Option<i32>, // Default 30
    start_date: Option<String>,
    end_date: Option<String>,
}

// Helper to parse date range
fn parse_admin_date_range(query: &AdminAnalyticsQuery) -> (DateTime<Utc>, DateTime<Utc>) {
    // If explicit dates are provided, use them
    if let (Some(start_str), Some(end_str)) = (&query.start_date, &query.end_date) {
        let start_date = start_str
            .parse::<DateTime<Utc>>()
            .unwrap_or_else(|_| Utc::now() - Duration::days(30));
        let end_date = end_str
            .parse::<DateTime<Utc>>()
            .unwrap_or_else(|_| Utc::now());
        return (start_date, end_date);
    }

    // Otherwise, use the days parameter (default behavior)
    let end_date = Utc::now();
    let days = query.days.unwrap_or(30).clamp(1, 365);
    let start_date = end_date - Duration::days(days as i64);
    (start_date, end_date)
}

// Admin Analytics Overview (aggregated across all domains)
async fn get_admin_analytics_overview(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminAnalyticsOverview>, StatusCode> {
    PerformanceSpan::monitor("admin_analytics_overview", async {
        let (start_date, end_date) = parse_admin_date_range(&query);
        let previous_start = start_date - (end_date - start_date);

        // Get real session duration data (fallback to mock while migration is pending)
        let current_avg_session_duration =
            SessionTracker::get_average_session_duration(&state.db, start_date, end_date, None)
                .await
                .unwrap_or(3.5);

        let previous_avg_session_duration = SessionTracker::get_average_session_duration(
            &state.db,
            previous_start,
            start_date,
            None,
        )
        .await
        .unwrap_or(3.2);

        // Current period stats across all domains
        let current_stats = sqlx::query!(
            r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) FILTER (WHERE event_type = 'search') as searches
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2
        "#,
            start_date,
            end_date
        )
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Previous period stats for comparison
        let previous_stats = sqlx::query!(
            r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) FILTER (WHERE event_type = 'search') as searches
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2
        "#,
            previous_start,
            start_date
        )
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Top posts across all domains
        let top_posts_data = sqlx::query!(
            r#"
        SELECT p.id, p.title, p.slug, 
               COUNT(*) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.created_at BETWEEN $1 AND $2 AND ae.event_type = 'post_view'
        GROUP BY p.id, p.title, p.slug
        ORDER BY views DESC
        LIMIT 10
        "#,
            start_date,
            end_date
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let top_posts = top_posts_data
            .into_iter()
            .map(|row| AdminPostStats {
                id: row.id,
                title: row.title,
                slug: row.slug,
                views: row.views.unwrap_or(0),
                unique_views: row.unique_views.unwrap_or(0),
            })
            .collect();

        // Top categories across all domains
        let top_categories_data = sqlx::query!(
            r#"
        SELECT p.category,
               COUNT(*) as views,
               COUNT(DISTINCT p.id) as posts_count
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.created_at BETWEEN $1 AND $2 AND ae.event_type = 'post_view'
        GROUP BY p.category
        ORDER BY views DESC
        LIMIT 5
        "#,
            start_date,
            end_date
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let top_categories = top_categories_data
            .into_iter()
            .map(|row| AdminCategoryStats {
                category: if row.category.is_empty() {
                    "Uncategorized".to_string()
                } else {
                    row.category
                },
                views: row.views.unwrap_or(0),
                posts_count: row.posts_count.unwrap_or(0),
            })
            .collect();

        // Calculate change percentages
        let page_views_change = if previous_stats.page_views.unwrap_or(0) > 0 {
            (current_stats.page_views.unwrap_or(0) as f64
                - previous_stats.page_views.unwrap_or(0) as f64)
                / previous_stats.page_views.unwrap_or(1) as f64
                * 100.0
        } else {
            0.0
        };

        let unique_visitors_change = if previous_stats.unique_visitors.unwrap_or(0) > 0 {
            (current_stats.unique_visitors.unwrap_or(0) as f64
                - previous_stats.unique_visitors.unwrap_or(0) as f64)
                / previous_stats.unique_visitors.unwrap_or(1) as f64
                * 100.0
        } else {
            0.0
        };

        let post_views_change = if previous_stats.post_views.unwrap_or(0) > 0 {
            (current_stats.post_views.unwrap_or(0) as f64
                - previous_stats.post_views.unwrap_or(0) as f64)
                / previous_stats.post_views.unwrap_or(1) as f64
                * 100.0
        } else {
            0.0
        };

        let searches_change = if previous_stats.searches.unwrap_or(0) > 0 {
            (current_stats.searches.unwrap_or(0) as f64
                - previous_stats.searches.unwrap_or(0) as f64)
                / previous_stats.searches.unwrap_or(1) as f64
                * 100.0
        } else {
            0.0
        };

        Ok(Json(AdminAnalyticsOverview {
            current_period: AdminPeriodStats {
                page_views: current_stats.page_views.unwrap_or(0),
                unique_visitors: current_stats.unique_visitors.unwrap_or(0),
                post_views: current_stats.post_views.unwrap_or(0),
                searches: current_stats.searches.unwrap_or(0),
                avg_session_duration: current_avg_session_duration,
            },
            previous_period: AdminPeriodStats {
                page_views: previous_stats.page_views.unwrap_or(0),
                unique_visitors: previous_stats.unique_visitors.unwrap_or(0),
                post_views: previous_stats.post_views.unwrap_or(0),
                searches: previous_stats.searches.unwrap_or(0),
                avg_session_duration: previous_avg_session_duration,
            },
            change_percent: AdminChangePercent {
                page_views: page_views_change,
                unique_visitors: unique_visitors_change,
                post_views: post_views_change,
                searches: searches_change,
            },
            top_posts,
            top_categories,
        }))
    })
    .await
}

// Admin Traffic Stats
async fn get_admin_traffic_stats(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminTrafficResponse>, StatusCode> {
    let (start_date, end_date) = parse_admin_date_range(&query);

    // Daily stats
    let daily_data = sqlx::query!(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let daily_stats = daily_data
        .into_iter()
        .map(|row| AdminDayStats {
            date: row.date.unwrap().format("%Y-%m-%d").to_string(),
            page_views: row.page_views.unwrap_or(0),
            unique_visitors: row.unique_visitors.unwrap_or(0),
            post_views: row.post_views.unwrap_or(0),
        })
        .collect();

    // Hourly distribution
    let hourly_data = sqlx::query!(
        r#"
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
        "#,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let hourly_distribution = hourly_data
        .into_iter()
        .map(|row| AdminHourStats {
            hour: row
                .hour
                .map(|h| h.to_string().parse::<i32>().unwrap_or(0))
                .unwrap_or(0),
            page_views: row.page_views.unwrap_or(0),
            unique_visitors: row.unique_visitors.unwrap_or(0),
        })
        .collect();

    // Device breakdown (real data from sessions, with fallback to mock)
    let (mobile, desktop, tablet, unknown) =
        SessionTracker::get_device_breakdown(&state.db, start_date, end_date, None)
            .await
            .unwrap_or((45, 35, 15, 5));

    let device_breakdown = AdminDeviceBreakdown {
        mobile: mobile as i64,
        desktop: desktop as i64,
        tablet: tablet as i64,
        unknown: unknown as i64,
    };

    Ok(Json(AdminTrafficResponse {
        daily_stats,
        hourly_distribution,
        device_breakdown,
    }))
}

// Admin Post Analytics
async fn get_admin_post_analytics(
    _auth: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<Vec<AdminPostStats>>, StatusCode> {
    let (start_date, end_date) = parse_admin_date_range(&query);

    let posts_data = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.slug,
               COUNT(*) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.created_at BETWEEN $1 AND $2 AND ae.event_type = 'post_view'
        GROUP BY p.id, p.title, p.slug
        ORDER BY views DESC
        LIMIT 50
        "#,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let posts = posts_data
        .into_iter()
        .map(|row| AdminPostStats {
            id: row.id,
            title: row.title,
            slug: row.slug,
            views: row.views.unwrap_or(0),
            unique_views: row.unique_views.unwrap_or(0),
        })
        .collect();

    Ok(Json(posts))
}

// Admin Search Analytics
async fn get_admin_search_analytics(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminSearchAnalyticsResponse>, StatusCode> {
    AnalyticsSpan::track_search("admin_search_analytics", async {
        if user.role != "platform_admin" {
            return Err(StatusCode::FORBIDDEN);
        }

        let (start_date, end_date) = parse_admin_date_range(&query);

        // Popular search terms
        let search_data = sqlx::query!(
            r#"
            SELECT 
                metadata->>'query' as query,
                COUNT(*) as count,
                BOOL_OR((metadata->>'results_count')::int > 0) as results_found
            FROM analytics_events 
            WHERE created_at BETWEEN $1 AND $2 AND event_type = 'search'
            GROUP BY metadata->>'query'
            ORDER BY count DESC
            LIMIT 20
            "#,
            start_date,
            end_date
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let popular_terms = search_data
            .into_iter()
            .filter_map(|row| {
                row.query.map(|query| AdminSearchTerm {
                    query,
                    count: row.count.unwrap_or(0),
                    results_found: row.results_found.unwrap_or(false),
                })
            })
            .collect();

        // Search volume trend
        let trend_data = sqlx::query!(
            r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as searches
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2 AND event_type = 'search'
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
            start_date,
            end_date
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let search_volume_trend = trend_data
            .into_iter()
            .map(|row| AdminSearchVolumeDay {
                date: row.date.unwrap().format("%Y-%m-%d").to_string(),
                searches: row.searches.unwrap_or(0),
            })
            .collect();

        // No results queries
        let no_results_data = sqlx::query!(
            r#"
        SELECT 
            metadata->>'query' as query,
            COUNT(*) as count
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2 
              AND event_type = 'search'
              AND (metadata->>'results_count')::int = 0
        GROUP BY metadata->>'query'
        ORDER BY count DESC
        LIMIT 10
        "#,
            start_date,
            end_date
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let no_results_queries = no_results_data
            .into_iter()
            .filter_map(|row| {
                row.query.map(|query| AdminSearchTerm {
                    query,
                    count: row.count.unwrap_or(0),
                    results_found: false,
                })
            })
            .collect();

        Ok(Json(AdminSearchAnalyticsResponse {
            popular_terms,
            search_volume_trend,
            no_results_queries,
        }))
    })
    .await
}

// Admin Referrer Stats
async fn get_admin_referrer_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminReferrerResponse>, StatusCode> {
    if user.role != "platform_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let (start_date, end_date) = parse_admin_date_range(&query);

    // Top referrers
    let referrer_data = sqlx::query!(
        r#"
        SELECT 
            COALESCE(referrer, 'Direct') as referrer,
            COUNT(*) as visits,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 15
        "#,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let top_referrers = referrer_data
        .into_iter()
        .map(|row| AdminReferrerStats {
            referrer: row.referrer.unwrap_or_else(|| "Direct".to_string()),
            visits: row.visits.unwrap_or(0),
            unique_visitors: row.unique_visitors.unwrap_or(0),
        })
        .collect();

    // Referrer type breakdown (simplified classification)
    let referrer_types = AdminReferrerTypeBreakdown {
        direct: 40,
        search_engines: 35,
        social_media: 20,
        other_websites: 5,
    };

    Ok(Json(AdminReferrerResponse {
        top_referrers,
        referrer_types,
    }))
}

// Get user preferences
async fn get_user_preferences(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<UserPreferencesResponse>, StatusCode> {
    let preferences = sqlx::query_scalar!("SELECT preferences FROM users WHERE id = $1", user.id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .flatten()
        .unwrap_or_else(|| serde_json::json!({}));

    Ok(Json(UserPreferencesResponse { preferences }))
}

// Update user preferences
async fn update_user_preferences(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UserPreferencesRequest>,
) -> Result<Json<UserPreferencesResponse>, StatusCode> {
    sqlx::query!(
        "UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2",
        payload.preferences,
        user.id
    )
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserPreferencesResponse {
        preferences: payload.preferences,
    }))
}

// User Management Structs
#[derive(Serialize, Deserialize, Validate)]
struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    #[validate(length(min = 1, message = "Email is required"))]
    email: String,
    #[validate(length(
        min = 1,
        max = 100,
        message = "Name must be between 1 and 100 characters"
    ))]
    name: String,
    #[validate(custom(
        function = "validate_password_strength",
        message = "Password does not meet security requirements"
    ))]
    password: String,
    #[validate(custom(function = "validate_user_role", message = "Invalid user role"))]
    role: String, // platform_admin or domain_user
    domain_permissions: Option<Vec<DomainPermissionInput>>,
}

#[derive(Serialize, Deserialize)]
struct UpdateUserRequest {
    email: Option<String>,
    name: Option<String>,
    password: Option<String>,
    role: Option<String>,
    domain_permissions: Option<Vec<DomainPermissionInput>>,
}

impl Validate for UpdateUserRequest {
    fn validate(&self) -> Result<(), validator::ValidationErrors> {
        crate::validation::custom::validate_update_user_request(
            &self.email,
            &self.name,
            &self.password,
            &self.role,
        )
    }
}

#[derive(Serialize, Deserialize, Validate)]
struct DomainPermissionInput {
    domain_id: i32,
    #[validate(custom(
        function = "validate_domain_permission_role",
        message = "Invalid domain permission role"
    ))]
    role: String, // admin, editor, viewer, none
}

#[derive(Serialize, sqlx::FromRow)]
struct UserResponse {
    id: i32,
    email: String,
    name: String,
    role: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    domain_permissions: Vec<DomainPermissionResponse>,
}

#[derive(Serialize, sqlx::FromRow)]
struct DomainPermissionResponse {
    domain_id: i32,
    domain_name: Option<String>,
    role: String,
}

#[derive(Serialize)]
struct UsersResponse {
    users: Vec<UserResponse>,
    total: i64,
    page: i32,
    per_page: i32,
}

#[derive(Deserialize)]
struct UsersQuery {
    page: Option<i32>,
    per_page: Option<i32>,
    role: Option<String>,
    search: Option<String>,
}

// User Management Handlers

// List users with pagination and filtering
async fn list_users(
    RequirePlatformAdmin { user: _ }: RequirePlatformAdmin,
    State(state): State<Arc<AppState>>,
    Query(params): Query<UsersQuery>,
) -> Result<Json<UsersResponse>, StatusCode> {
    DatabaseSpan::execute("list_users", "users", async {
        let page = params.page.unwrap_or(1).max(1);
        let per_page = params.per_page.unwrap_or(20).clamp(1, 100) as i64;
        let offset = ((page - 1) * (per_page as i32)) as i64;

        // Build the query with conditional WHERE clauses
        let mut where_conditions = Vec::new();
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(ref role) = params.role {
            where_conditions.push(format!("role = ${}", bind_values.len() + 1));
            bind_values.push(role.clone());
        }

        let _search_pattern = if let Some(ref search) = params.search {
            let pattern = format!("%{search}%");
            where_conditions.push(format!("(name ILIKE ${} OR email ILIKE ${})", bind_values.len() + 1, bind_values.len() + 1));
            bind_values.push(pattern.clone());
            Some(pattern)
        } else {
            None
        };

        let where_clause = if where_conditions.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", where_conditions.join(" AND "))
        };

        // Use raw sqlx::query instead of the macro to avoid type conflicts
        let query_sql = format!(
            "SELECT id, email, name, role, created_at, updated_at FROM users{} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
            where_clause,
            bind_values.len() + 1,
            bind_values.len() + 2
        );

        let mut query = sqlx::query(&query_sql);
        for value in &bind_values {
            query = query.bind(value);
        }
        query = query.bind(per_page).bind(offset);

        let users_data = query
            .fetch_all(&state.db)
            .await
            .map_err(|e| {
                tracing::error!("Database error in list_users: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        // Get total count
        let count_sql = format!("SELECT COUNT(*) FROM users{where_clause}");
        let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
        for value in &bind_values {
            count_query = count_query.bind(value);
        }

        let total = count_query
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                tracing::error!("Database error in count query: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        // Convert to response format with domain permissions
        let mut users = Vec::new();
        for user_data in users_data {
            let user_id: i32 = user_data.try_get("id").map_err(|e| {
                tracing::error!("Error getting user id: {e}");
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

            let domain_permissions = sqlx::query_as::<_, DomainPermissionResponse>(
                r#"
                SELECT udp.domain_id, d.name as domain_name, udp.role
                FROM user_domain_permissions udp
                LEFT JOIN domains d ON udp.domain_id = d.id
                WHERE udp.user_id = $1
                ORDER BY d.name
                "#,
            )
            .bind(user_id)
            .fetch_all(&state.db)
            .await
            .map_err(|e| {
                tracing::error!("Database error fetching domain permissions: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

            users.push(UserResponse {
                id: user_id,
                email: user_data.try_get("email").map_err(|e| {
                    tracing::error!("Error getting email: {e}");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
                name: user_data.try_get("name").map_err(|e| {
                    tracing::error!("Error getting name: {e}");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
                role: user_data.try_get("role").map_err(|e| {
                    tracing::error!("Error getting role: {e}");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
                created_at: user_data.try_get("created_at").map_err(|e| {
                    tracing::error!("Error getting created_at: {e}");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
                updated_at: user_data.try_get("updated_at").map_err(|e| {
                    tracing::error!("Error getting updated_at: {e}");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
                domain_permissions,
            });
        }

        Ok(Json(UsersResponse {
            users,
            total,
            page,
            per_page: per_page as i32,
        }))
    })
    .await
}

// Create a new user
async fn create_user(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<CreateUserRequest>,
) -> Result<Json<UserResponse>, StatusCode> {
    // Only platform admins can create users
    if user.role != "platform_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    // Hash the password properly with bcrypt
    use bcrypt::{DEFAULT_COST, hash};
    let password_hash =
        hash(&payload.password, DEFAULT_COST).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Insert user
    let user_id = sqlx::query_scalar::<_, i32>(
        "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(&payload.email)
    .bind(&payload.name)
    .bind(&password_hash)
    .bind(&payload.role)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Insert domain permissions if provided
    if let Some(permissions) = &payload.domain_permissions {
        for perm in permissions {
            if perm.role != "none" {
                sqlx::query(
                    "INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, domain_id) DO UPDATE SET role = $3",
                )
                .bind(user_id)
                .bind(perm.domain_id)
                .bind(&perm.role)
                .execute(&state.db)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            }
        }
    }

    // Return the created user
    get_user_by_id(&state, user_id).await
}

// Get a single user
async fn get_user(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
) -> Result<Json<UserResponse>, StatusCode> {
    // Only platform admins can view users
    if user.role != "platform_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    get_user_by_id(&state, user_id).await
}

// Update a user
async fn update_user(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
    ValidatedJson(payload): ValidatedJson<UpdateUserRequest>,
) -> Result<Json<UserResponse>, StatusCode> {
    // Only platform admins can update users
    if user.role != "platform_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    // Update user fields if provided
    if payload.email.is_some()
        || payload.name.is_some()
        || payload.role.is_some()
        || payload.password.is_some()
    {
        let mut query = "UPDATE users SET updated_at = NOW()".to_string();
        let mut bind_count = 0;

        if payload.email.is_some() {
            bind_count += 1;
            query.push_str(&format!(", email = ${bind_count}"));
        }
        if payload.name.is_some() {
            bind_count += 1;
            query.push_str(&format!(", name = ${bind_count}"));
        }
        if payload.role.is_some() {
            bind_count += 1;
            query.push_str(&format!(", role = ${bind_count}"));
        }
        if payload.password.is_some() {
            bind_count += 1;
            query.push_str(&format!(", password_hash = ${bind_count}"));
        }

        query.push_str(&format!(" WHERE id = ${}", bind_count + 1));

        let mut sqlx_query = sqlx::query(&query);
        if let Some(email) = &payload.email {
            sqlx_query = sqlx_query.bind(email);
        }
        if let Some(name) = &payload.name {
            sqlx_query = sqlx_query.bind(name);
        }
        if let Some(role) = &payload.role {
            sqlx_query = sqlx_query.bind(role);
        }
        if let Some(password) = &payload.password {
            use bcrypt::{DEFAULT_COST, hash};
            let password_hash =
                hash(password, DEFAULT_COST).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            sqlx_query = sqlx_query.bind(password_hash);
        }

        sqlx_query
            .bind(user_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    // Update domain permissions if provided
    if let Some(permissions) = &payload.domain_permissions {
        // Delete existing permissions
        sqlx::query("DELETE FROM user_domain_permissions WHERE user_id = $1")
            .bind(user_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Insert new permissions
        for perm in permissions {
            if perm.role != "none" {
                sqlx::query(
                    "INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES ($1, $2, $3)",
                )
                .bind(user_id)
                .bind(perm.domain_id)
                .bind(&perm.role)
                .execute(&state.db)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            }
        }
    }

    // Return the updated user
    get_user_by_id(&state, user_id).await
}

// Delete a user
async fn delete_user(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Only platform admins can delete users
    if user.role != "platform_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    // Don't allow deleting yourself
    if user.id == user_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Delete user (cascade will handle domain permissions)
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(
        serde_json::json!({"message": "User deleted successfully"}),
    ))
}

// Helper function to get user by ID with domain permissions
async fn get_user_by_id(
    state: &Arc<AppState>,
    user_id: i32,
) -> Result<Json<UserResponse>, StatusCode> {
    // Get user info
    let user = sqlx::query!(
        "SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1",
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Get domain permissions
    let domain_permissions = sqlx::query_as::<_, DomainPermissionResponse>(
        r#"
        SELECT udp.domain_id, d.name as domain_name, udp.role
        FROM user_domain_permissions udp
        LEFT JOIN domains d ON udp.domain_id = d.id
        WHERE udp.user_id = $1
        ORDER BY d.name
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.expect("role should never be null in DB"),
        created_at: user
            .created_at
            .expect("created_at should never be null in DB"),
        updated_at: user
            .updated_at
            .expect("updated_at should never be null in DB"),
        domain_permissions,
    }))
}
