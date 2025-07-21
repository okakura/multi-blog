// src/handlers/admin.rs
use crate::{AppState, DomainContext, UserContext};
use axum::{
    Extension, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::BigDecimal;
use std::{str::FromStr, sync::Arc};

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
        domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Get total posts count for this domain
    let posts_count = sqlx::query!(
        "SELECT COUNT(*) as total FROM posts WHERE domain_id = $1",
        domain.id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .total
    .unwrap_or(0);

    // Get posts created this month for this domain
    let posts_this_month = sqlx::query!(
        "SELECT COUNT(*) as total FROM posts WHERE domain_id = $1 AND created_at >= DATE_TRUNC('month', NOW())",
        domain.id
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

// Domain Management Structs
#[derive(Serialize, Deserialize)]
struct CreateDomainRequest {
    hostname: String,
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

// Domain Management Handlers
async fn list_domains(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<DomainResponse>>, StatusCode> {
    // Only super admins can list all domains
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

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
}

async fn get_domain(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<DomainResponse>, StatusCode> {
    // Only super admins can view any domain, or users with permissions for this specific domain
    if user.role != "super_admin" {
        let has_permission = user.domain_permissions.iter().any(|p| p.domain_id == id);
        if !has_permission {
            return Err(StatusCode::FORBIDDEN);
        }
    }

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
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(domain))
}

async fn create_domain(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateDomainRequest>,
) -> Result<Json<DomainResponse>, StatusCode> {
    // Only super admins can create domains
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

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
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateDomainRequest>,
) -> Result<Json<DomainResponse>, StatusCode> {
    // Only super admins can update domains
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    // Check if domain exists
    let existing = sqlx::query!("SELECT hostname FROM domains WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // If hostname is being updated, check for uniqueness
    if let Some(ref new_hostname) = payload.hostname {
        if new_hostname != &existing.hostname {
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
    }

    // Build update query dynamically
    let mut query = "UPDATE domains SET updated_at = NOW()".to_string();
    let mut params = vec![];
    let mut param_count = 0;

    if let Some(hostname) = payload.hostname {
        param_count += 1;
        query.push_str(&format!(", hostname = ${}", param_count));
        params.push(hostname);
    }

    if let Some(name) = payload.name {
        param_count += 1;
        query.push_str(&format!(", name = ${}", param_count));
        params.push(name);
    }

    if let Some(theme_config) = payload.theme_config {
        param_count += 1;
        query.push_str(&format!(", theme_config = ${}", param_count));
        params.push(serde_json::to_string(&theme_config).unwrap());
    }

    if let Some(categories) = payload.categories {
        param_count += 1;
        let categories_json =
            serde_json::to_value(categories).unwrap_or_else(|_| serde_json::json!([]));
        query.push_str(&format!(", categories = ${}", param_count));
        params.push(serde_json::to_string(&categories_json).unwrap());
    }

    param_count += 1;
    query.push_str(&format!(" WHERE id = ${}", param_count));

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
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<StatusCode, StatusCode> {
    // Only super admins can delete domains
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

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
    let days = query.days.unwrap_or(30).min(365).max(1);
    let start_date = end_date - Duration::days(days as i64);
    (start_date, end_date)
}

// Admin Analytics Overview (aggregated across all domains)
async fn get_admin_analytics_overview(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminAnalyticsOverview>, StatusCode> {
    // Only super_admin can view cross-domain analytics
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let (start_date, end_date) = parse_admin_date_range(&query);
    let previous_start = start_date - (end_date - start_date);

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
        (current_stats.searches.unwrap_or(0) as f64 - previous_stats.searches.unwrap_or(0) as f64)
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
            avg_session_duration: 3.5, // Mock value for now
        },
        previous_period: AdminPeriodStats {
            page_views: previous_stats.page_views.unwrap_or(0),
            unique_visitors: previous_stats.unique_visitors.unwrap_or(0),
            post_views: previous_stats.post_views.unwrap_or(0),
            searches: previous_stats.searches.unwrap_or(0),
            avg_session_duration: 3.2, // Mock value for now
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
}

// Admin Traffic Stats
async fn get_admin_traffic_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminTrafficResponse>, StatusCode> {
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

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

    // Device breakdown (mock data for now)
    let device_breakdown = AdminDeviceBreakdown {
        mobile: 45,
        desktop: 35,
        tablet: 15,
        unknown: 5,
    };

    Ok(Json(AdminTrafficResponse {
        daily_stats,
        hourly_distribution,
        device_breakdown,
    }))
}

// Admin Post Analytics
async fn get_admin_post_analytics(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<Vec<AdminPostStats>>, StatusCode> {
    if user.role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

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
    if user.role != "super_admin" {
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
}

// Admin Referrer Stats
async fn get_admin_referrer_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AdminAnalyticsQuery>,
) -> Result<Json<AdminReferrerResponse>, StatusCode> {
    if user.role != "super_admin" {
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
