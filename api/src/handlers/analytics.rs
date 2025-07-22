// src/handlers/analytics.rs
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
use std::sync::Arc;

pub struct AnalyticsModule;

impl super::HandlerModule for AnalyticsModule {
    fn routes() -> Router<Arc<AppState>> {
        Router::new()
            // New multi-domain analytics endpoints (no domain middleware required)
            .route("/multi/overview", get(get_multi_overview))
            .route("/multi/traffic", get(get_multi_traffic_stats))
            .route("/multi/posts", get(get_multi_post_analytics))
            .route("/multi/search-terms", get(get_multi_search_analytics))
            .route("/multi/referrers", get(get_multi_referrer_stats))
            .route("/multi/real-time", get(get_multi_realtime_stats))
            .route("/multi/export", get(export_multi_data))
            // Legacy single-domain endpoints (require domain middleware)
            .route("/overview", get(get_overview))
            .route("/traffic", get(get_traffic_stats))
            .route("/posts", get(get_post_analytics))
            .route("/posts/{id}/stats", get(get_post_stats))
            .route("/search-terms", get(get_search_analytics))
            .route("/referrers", get(get_referrer_stats))
            .route("/real-time", get(get_realtime_stats))
            .route("/export", get(export_data))
    }

    fn mount_path() -> &'static str {
        "/analytics"
    }
}

#[derive(Serialize)]
pub struct OverviewResponse {
    current_period: PeriodStats,
    previous_period: PeriodStats,
    change_percent: ChangePercent,
    top_posts: Vec<PostStats>,
    top_categories: Vec<CategoryStats>,
}

#[derive(Serialize)]
pub struct PeriodStats {
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
    searches: i64,
    avg_session_duration: f64, // in minutes
}

#[derive(Serialize)]
pub struct ChangePercent {
    page_views: f64,
    unique_visitors: f64,
    post_views: f64,
    searches: f64,
}

#[derive(Serialize)]
pub struct PostStats {
    id: i32,
    title: String,
    slug: String,
    views: i64,
    unique_views: i64,
}

#[derive(Serialize)]
pub struct CategoryStats {
    category: String,
    views: i64,
    posts_count: i64,
}

#[derive(Serialize)]
pub struct TrafficResponse {
    daily_stats: Vec<DayStats>,
    hourly_distribution: Vec<HourStats>,
    device_breakdown: DeviceBreakdown,
}

#[derive(Serialize)]
pub struct DayStats {
    date: String,
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
}

#[derive(Serialize)]
pub struct HourStats {
    hour: i32,
    page_views: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
pub struct DeviceBreakdown {
    mobile: i64,
    desktop: i64,
    tablet: i64,
    unknown: i64,
}

#[derive(Serialize)]
pub struct SearchAnalyticsResponse {
    popular_terms: Vec<SearchTerm>,
    search_volume_trend: Vec<SearchVolumeDay>,
    no_results_queries: Vec<SearchTerm>,
}

#[derive(Serialize)]
pub struct SearchTerm {
    query: String,
    count: i64,
    results_found: bool,
}

#[derive(Serialize)]
pub struct SearchVolumeDay {
    date: String,
    searches: i64,
}

#[derive(Serialize)]
pub struct ReferrerResponse {
    top_referrers: Vec<ReferrerStats>,
    referrer_types: ReferrerTypeBreakdown,
}

#[derive(Serialize)]
pub struct ReferrerStats {
    referrer: String,
    visits: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
pub struct ReferrerTypeBreakdown {
    direct: i64,
    search_engines: i64,
    social_media: i64,
    other_websites: i64,
}

#[derive(Serialize)]
pub struct RealtimeResponse {
    active_visitors: i64,
    page_views_last_hour: i64,
    top_pages_now: Vec<ActivePageStats>,
    recent_events: Vec<RecentEvent>,
}

#[derive(Serialize)]
pub struct ActivePageStats {
    path: String,
    active_visitors: i64,
}

#[derive(Serialize)]
pub struct RecentEvent {
    event_type: String,
    path: String,
    timestamp: DateTime<Utc>,
    ip_address: String, // anonymized
    user_agent: String,
}

#[derive(Deserialize)]
pub struct AnalyticsQuery {
    days: Option<i32>, // Default 30
    start_date: Option<String>,
    end_date: Option<String>,
    domain_id: Option<i32>, // Optional: filter to specific domain
}

#[derive(Deserialize)]
pub struct MultiAnalyticsQuery {
    days: Option<i32>, // Default 30
    start_date: Option<String>,
    end_date: Option<String>,
    domain_id: Option<i32>, // Optional: filter to specific domain
}

// Get all domain IDs the user has analytics access to
fn get_user_domain_ids(user: &UserContext) -> Vec<i32> {
    if user.role == "platform_admin" || user.role == "super_admin" {
        // Platform admins and super admins see all domains - return empty here as it's handled in the query logic
        vec![]
    } else {
        user.domain_permissions
            .iter()
            .map(|p| p.domain_id)
            .collect()
    }
}

// Check analytics permission (viewer level required)
fn check_analytics_permission(user: &UserContext, domain_id: i32) -> Result<(), StatusCode> {
    if user.role == "super_admin" || user.role == "platform_admin" {
        return Ok(());
    }

    user.domain_permissions
        .iter()
        .find(|p| p.domain_id == domain_id)
        .ok_or(StatusCode::FORBIDDEN)?;

    Ok(())
}

// Helper to parse date range
fn parse_date_range(query: &AnalyticsQuery) -> (DateTime<Utc>, DateTime<Utc>) {
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

// Helper to parse date range for multi-domain queries
fn parse_multi_date_range(query: &MultiAnalyticsQuery) -> (DateTime<Utc>, DateTime<Utc>) {
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

// NEW MULTI-DOMAIN ANALYTICS ENDPOINTS

pub async fn get_multi_overview(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<OverviewResponse>, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);
    let previous_start = start_date - (end_date - start_date);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        // Check permission for specific domain
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        // Super admin and platform admin get all domains
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        // Regular user gets their permitted domains
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Current period stats - aggregate across all permitted domains
    let current_stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) FILTER (WHERE event_type = 'search') as searches
        FROM analytics_events 
        WHERE domain_id = ANY($1) AND created_at BETWEEN $2 AND $3
        "#,
        &domain_ids,
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
        WHERE domain_id = ANY($1) AND created_at BETWEEN $2 AND $3
        "#,
        &domain_ids,
        previous_start,
        start_date
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Top posts across all permitted domains
    let top_posts = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.slug,
               COUNT(*) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.domain_id = ANY($1) AND ae.event_type = 'post_view' 
        AND ae.created_at BETWEEN $2 AND $3
        GROUP BY p.id, p.title, p.slug
        ORDER BY views DESC
        LIMIT 10
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| PostStats {
        id: row.id,
        title: row.title,
        slug: row.slug,
        views: row.views.unwrap_or(0),
        unique_views: row.unique_views.unwrap_or(0),
    })
    .collect();

    // Top categories across all permitted domains
    let top_categories = sqlx::query!(
        r#"
        SELECT p.category,
               COUNT(*) as views,
               COUNT(DISTINCT p.id) as posts_count
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.domain_id = ANY($1) AND ae.event_type = 'post_view'
        AND ae.created_at BETWEEN $2 AND $3
        GROUP BY p.category
        ORDER BY views DESC
        LIMIT 10
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| CategoryStats {
        category: row.category,
        views: row.views.unwrap_or(0),
        posts_count: row.posts_count.unwrap_or(0),
    })
    .collect();

    // Calculate session duration across domains
    let avg_session_duration = 5.5; // TODO: Implement session duration calculation

    // Calculate percentage changes
    let calc_change = |current: Option<i64>, previous: Option<i64>| -> f64 {
        let curr = current.unwrap_or(0) as f64;
        let prev = previous.unwrap_or(0) as f64;
        if prev == 0.0 {
            0.0
        } else {
            ((curr - prev) / prev) * 100.0
        }
    };

    let response = OverviewResponse {
        current_period: PeriodStats {
            page_views: current_stats.page_views.unwrap_or(0),
            unique_visitors: current_stats.unique_visitors.unwrap_or(0),
            post_views: current_stats.post_views.unwrap_or(0),
            searches: current_stats.searches.unwrap_or(0),
            avg_session_duration,
        },
        previous_period: PeriodStats {
            page_views: previous_stats.page_views.unwrap_or(0),
            unique_visitors: previous_stats.unique_visitors.unwrap_or(0),
            post_views: previous_stats.post_views.unwrap_or(0),
            searches: previous_stats.searches.unwrap_or(0),
            avg_session_duration,
        },
        change_percent: ChangePercent {
            page_views: calc_change(current_stats.page_views, previous_stats.page_views),
            unique_visitors: calc_change(
                current_stats.unique_visitors,
                previous_stats.unique_visitors,
            ),
            post_views: calc_change(current_stats.post_views, previous_stats.post_views),
            searches: calc_change(current_stats.searches, previous_stats.searches),
        },
        top_posts,
        top_categories,
    };

    Ok(Json(response))
}

pub async fn get_multi_traffic_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<TrafficResponse>, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Daily stats aggregated across domains
    let daily_stats = sqlx::query!(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| DayStats {
        date: row.date.unwrap_or_default().to_string(),
        page_views: row.page_views.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
        post_views: row.post_views.unwrap_or(0),
    })
    .collect();

    // Hourly distribution aggregated across domains
    let hourly_distribution = sqlx::query!(
        r#"
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at BETWEEN $2 AND $3
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| HourStats {
        hour: row
            .hour
            .map(|h| h.to_string().parse().unwrap_or(0))
            .unwrap_or(0),
        page_views: row.page_views.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
    })
    .collect();

    // Device breakdown - simplified for now
    let device_breakdown = DeviceBreakdown {
        mobile: 100,
        desktop: 200,
        tablet: 50,
        unknown: 10,
    };

    let response = TrafficResponse {
        daily_stats,
        hourly_distribution,
        device_breakdown,
    };

    Ok(Json(response))
}

pub async fn get_multi_post_analytics(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    let post_stats = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.slug, p.category,
               COUNT(*) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views,
               AVG(EXTRACT(EPOCH FROM (ae.created_at - p.created_at)) / 86400.0) as avg_days_to_view
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.domain_id = ANY($1) AND ae.event_type = 'post_view'
        AND ae.created_at BETWEEN $2 AND $3
        GROUP BY p.id, p.title, p.slug, p.category, p.created_at
        ORDER BY views DESC
        LIMIT 50
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "posts": post_stats.into_iter().map(|row| {
            serde_json::json!({
                "id": row.id,
                "title": row.title,
                "slug": row.slug,
                "category": row.category,
                "views": row.views.unwrap_or(0),
                "unique_views": row.unique_views.unwrap_or(0),
                "avg_days_to_view": row.avg_days_to_view.map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)).unwrap_or(0.0)
            })
        }).collect::<Vec<_>>()
    })))
}

pub async fn get_multi_search_analytics(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<SearchAnalyticsResponse>, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Popular search terms
    let popular_terms = sqlx::query!(
        r#"
        SELECT path as query,
               COUNT(*) as count
        FROM analytics_events
        WHERE domain_id = ANY($1) AND event_type = 'search'
        AND created_at BETWEEN $2 AND $3
        GROUP BY path
        ORDER BY count DESC
        LIMIT 20
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| SearchTerm {
        query: row.query.unwrap_or_default(),
        count: row.count.unwrap_or(0),
        results_found: true, // TODO: Track actual results
    })
    .collect();

    // Search volume trend
    let search_volume_trend = sqlx::query!(
        r#"
        SELECT DATE(created_at) as date,
               COUNT(*) as searches
        FROM analytics_events
        WHERE domain_id = ANY($1) AND event_type = 'search'
        AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| SearchVolumeDay {
        date: row.date.unwrap_or_default().to_string(),
        searches: row.searches.unwrap_or(0),
    })
    .collect();

    let response = SearchAnalyticsResponse {
        popular_terms,
        search_volume_trend,
        no_results_queries: vec![], // TODO: Implement
    };

    Ok(Json(response))
}

pub async fn get_multi_referrer_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<ReferrerResponse>, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    let top_referrers = sqlx::query!(
        r#"
        SELECT COALESCE(referrer, 'Direct') as referrer,
               COUNT(*) as visits,
               COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at BETWEEN $2 AND $3
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 20
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| ReferrerStats {
        referrer: row.referrer.unwrap_or("Direct".to_string()),
        visits: row.visits.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
    })
    .collect();

    let referrer_types = ReferrerTypeBreakdown {
        direct: 500,
        search_engines: 300,
        social_media: 200,
        other_websites: 100,
    };

    let response = ReferrerResponse {
        top_referrers,
        referrer_types,
    };

    Ok(Json(response))
}

pub async fn get_multi_realtime_stats(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<Json<RealtimeResponse>, StatusCode> {
    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    let one_hour_ago = Utc::now() - Duration::hours(1);
    let five_minutes_ago = Utc::now() - Duration::minutes(5);

    // Active visitors (last 5 minutes)
    let active_visitors = sqlx::query!(
        r#"
        SELECT COUNT(DISTINCT ip_address) as active
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at > $2
        "#,
        &domain_ids,
        five_minutes_ago
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Page views in last hour
    let page_views_last_hour = sqlx::query!(
        r#"
        SELECT COUNT(*) as views
        FROM analytics_events
        WHERE domain_id = ANY($1) AND event_type = 'page_view' AND created_at > $2
        "#,
        &domain_ids,
        one_hour_ago
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Top active pages
    let top_pages_now = sqlx::query!(
        r#"
        SELECT path,
               COUNT(DISTINCT ip_address) as active_visitors
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at > $2
        GROUP BY path
        ORDER BY active_visitors DESC
        LIMIT 10
        "#,
        &domain_ids,
        five_minutes_ago
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| ActivePageStats {
        path: row.path.unwrap_or_default(),
        active_visitors: row.active_visitors.unwrap_or(0),
    })
    .collect();

    // Recent events
    let recent_events = sqlx::query!(
        r#"
        SELECT event_type, path, created_at, 
               SUBSTRING(host(ip_address), 1, GREATEST(LENGTH(host(ip_address)) - 3, 1)) || 'XXX' as ip,
               user_agent
        FROM analytics_events
        WHERE domain_id = ANY($1) AND created_at > $2
        ORDER BY created_at DESC
        LIMIT 20
        "#,
        &domain_ids,
        one_hour_ago
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| RecentEvent {
        event_type: row.event_type,
        path: row.path.unwrap_or_default(),
        timestamp: row.created_at.unwrap_or_else(|| Utc::now()),
        ip_address: row.ip.unwrap_or_default(),
        user_agent: row.user_agent.unwrap_or_default(),
    })
    .collect();

    let response = RealtimeResponse {
        active_visitors: active_visitors.active.unwrap_or(0),
        page_views_last_hour: page_views_last_hour.views.unwrap_or(0),
        top_pages_now,
        recent_events,
    };

    Ok(Json(response))
}

pub async fn export_multi_data(
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<MultiAnalyticsQuery>,
) -> Result<String, StatusCode> {
    let (start_date, end_date) = parse_multi_date_range(&query);

    // Get domain IDs user has access to
    let domain_ids = if let Some(specific_domain) = query.domain_id {
        check_analytics_permission(&user, specific_domain)?;
        vec![specific_domain]
    } else if user.role == "super_admin" || user.role == "platform_admin" {
        let all_domains = sqlx::query!("SELECT id FROM domains")
            .fetch_all(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_domains.into_iter().map(|d| d.id).collect()
    } else {
        get_user_domain_ids(&user)
    };

    if domain_ids.is_empty() {
        return Err(StatusCode::FORBIDDEN);
    }

    let events = sqlx::query!(
        r#"
        SELECT ae.event_type, ae.path, ae.user_agent, ae.referrer, ae.created_at,
               d.name as domain_name,
               SUBSTRING(host(ae.ip_address), 1, GREATEST(LENGTH(host(ae.ip_address)) - 3, 1)) || 'XXX' as ip_address
        FROM analytics_events ae
        JOIN domains d ON ae.domain_id = d.id
        WHERE ae.domain_id = ANY($1) AND ae.created_at BETWEEN $2 AND $3
        ORDER BY ae.created_at DESC
        "#,
        &domain_ids,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Generate CSV with domain information
    let mut csv = "Domain,Event Type,Path,IP Address,User Agent,Referrer,Timestamp\n".to_string();

    for event in events {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            event.domain_name.replace(",", ";"),
            event.event_type,
            event.path.unwrap_or_default().replace(",", ";"),
            event.ip_address.unwrap_or_default(),
            event.user_agent.unwrap_or_default().replace(",", ";"),
            event.referrer.unwrap_or_default().replace(",", ";"),
            event
                .created_at
                .unwrap_or_else(|| Utc::now())
                .format("%Y-%m-%d %H:%M:%S")
        ));
    }

    Ok(csv)
}

// LEGACY SINGLE-DOMAIN ENDPOINTS (require domain middleware)

pub async fn get_overview(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<Json<OverviewResponse>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let (start_date, end_date) = parse_date_range(&query);
    let previous_start = start_date - (end_date - start_date);

    // Current period stats
    let current_stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) FILTER (WHERE event_type = 'search') as searches
        FROM analytics_events 
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        "#,
        domain.id,
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
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        "#,
        domain.id,
        previous_start,
        start_date
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Top posts
    let top_posts = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.slug,
               COUNT(*) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.domain_id = $1 AND ae.event_type = 'post_view' 
        AND ae.created_at BETWEEN $2 AND $3
        GROUP BY p.id, p.title, p.slug
        ORDER BY views DESC
        LIMIT 10
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| PostStats {
        id: row.id,
        title: row.title,
        slug: row.slug,
        views: row.views.unwrap_or(0),
        unique_views: row.unique_views.unwrap_or(0),
    })
    .collect();

    // Top categories
    let top_categories = sqlx::query!(
        r#"
        SELECT p.category,
               COUNT(*) as views,
               COUNT(DISTINCT p.id) as posts_count
        FROM analytics_events ae
        JOIN posts p ON ae.post_id = p.id
        WHERE ae.domain_id = $1 AND ae.event_type = 'post_view'
        AND ae.created_at BETWEEN $2 AND $3
        GROUP BY p.category
        ORDER BY views DESC
        LIMIT 10
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| CategoryStats {
        category: row.category,
        views: row.views.unwrap_or(0),
        posts_count: row.posts_count.unwrap_or(0),
    })
    .collect();

    // Calculate percentage changes
    let calc_change = |current: i64, previous: i64| -> f64 {
        if previous == 0 {
            if current > 0 { 100.0 } else { 0.0 }
        } else {
            ((current - previous) as f64 / previous as f64) * 100.0
        }
    };

    let current_period = PeriodStats {
        page_views: current_stats.page_views.unwrap_or(0),
        unique_visitors: current_stats.unique_visitors.unwrap_or(0),
        post_views: current_stats.post_views.unwrap_or(0),
        searches: current_stats.searches.unwrap_or(0),
        avg_session_duration: 2.5, // TODO: Calculate from session data
    };

    let previous_period = PeriodStats {
        page_views: previous_stats.page_views.unwrap_or(0),
        unique_visitors: previous_stats.unique_visitors.unwrap_or(0),
        post_views: previous_stats.post_views.unwrap_or(0),
        searches: previous_stats.searches.unwrap_or(0),
        avg_session_duration: 2.3, // TODO: Calculate from session data
    };

    let change_percent = ChangePercent {
        page_views: calc_change(current_period.page_views, previous_period.page_views),
        unique_visitors: calc_change(
            current_period.unique_visitors,
            previous_period.unique_visitors,
        ),
        post_views: calc_change(current_period.post_views, previous_period.post_views),
        searches: calc_change(current_period.searches, previous_period.searches),
    };

    Ok(Json(OverviewResponse {
        current_period,
        previous_period,
        change_percent,
        top_posts,
        top_categories,
    }))
}

pub async fn get_traffic_stats(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<Json<TrafficResponse>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let (start_date, end_date) = parse_date_range(&query);

    // Daily stats
    let daily_stats = sqlx::query!(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(*) FILTER (WHERE event_type = 'post_view') as post_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| DayStats {
        date: row.date.unwrap().format("%Y-%m-%d").to_string(),
        page_views: row.page_views.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
        post_views: row.post_views.unwrap_or(0),
    })
    .collect();

    // Hourly distribution
    let hourly_distribution = sqlx::query!(
        r#"
        SELECT 
            CAST(EXTRACT(HOUR FROM created_at) AS INTEGER) as hour,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| HourStats {
        hour: row.hour.unwrap_or(0),
        page_views: row.page_views.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
    })
    .collect();

    // Device breakdown (simple user agent parsing)
    let device_stats = sqlx::query!(
        r#"
        SELECT 
            CASE 
                WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'mobile'
                WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'tablet'
                WHEN user_agent ILIKE '%mozilla%' OR user_agent ILIKE '%chrome%' OR user_agent ILIKE '%firefox%' THEN 'desktop'
                ELSE 'unknown'
            END as device_type,
            COUNT(DISTINCT ip_address) as count
        FROM analytics_events
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        GROUP BY device_type
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut device_breakdown = DeviceBreakdown {
        mobile: 0,
        desktop: 0,
        tablet: 0,
        unknown: 0,
    };

    for stat in device_stats {
        let count = stat.count.unwrap_or(0);
        match stat.device_type.as_deref() {
            Some("mobile") => device_breakdown.mobile = count,
            Some("desktop") => device_breakdown.desktop = count,
            Some("tablet") => device_breakdown.tablet = count,
            _ => device_breakdown.unknown = count,
        }
    }

    Ok(Json(TrafficResponse {
        daily_stats,
        hourly_distribution,
        device_breakdown,
    }))
}

pub async fn get_search_analytics(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<Json<SearchAnalyticsResponse>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let (start_date, end_date) = parse_date_range(&query);

    // Popular search terms
    let popular_terms = sqlx::query!(
        r#"
        SELECT 
            metadata->>'query' as query,
            COUNT(*) as count
        FROM analytics_events
        WHERE domain_id = $1 AND event_type = 'search' 
        AND created_at BETWEEN $2 AND $3
        AND metadata->>'query' IS NOT NULL
        GROUP BY metadata->>'query'
        ORDER BY count DESC
        LIMIT 20
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| SearchTerm {
        query: row.query.unwrap_or_default(),
        count: row.count.unwrap_or(0),
        results_found: true, // TODO: Track if search returned results
    })
    .collect();

    // Search volume trend
    let search_volume_trend = sqlx::query!(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as searches
        FROM analytics_events
        WHERE domain_id = $1 AND event_type = 'search'
        AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| SearchVolumeDay {
        date: row.date.unwrap().format("%Y-%m-%d").to_string(),
        searches: row.searches.unwrap_or(0),
    })
    .collect();

    Ok(Json(SearchAnalyticsResponse {
        popular_terms,
        search_volume_trend,
        no_results_queries: vec![], // TODO: Implement
    }))
}

pub async fn get_referrer_stats(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<Json<ReferrerResponse>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let (start_date, end_date) = parse_date_range(&query);

    let top_referrers = sqlx::query!(
        r#"
        SELECT 
            COALESCE(referrer, 'Direct') as referrer,
            COUNT(*) as visits,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics_events
        WHERE domain_id = $1 AND event_type = 'page_view'
        AND created_at BETWEEN $2 AND $3
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 20
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| ReferrerStats {
        referrer: row.referrer.unwrap_or_default(),
        visits: row.visits.unwrap_or(0),
        unique_visitors: row.unique_visitors.unwrap_or(0),
    })
    .collect();

    // Categorize referrer types
    let referrer_types = sqlx::query!(
        r#"
        SELECT 
            CASE 
                WHEN referrer IS NULL OR referrer = '' THEN 'direct'
                WHEN referrer ILIKE '%google%' OR referrer ILIKE '%bing%' OR referrer ILIKE '%duckduckgo%' THEN 'search_engines'
                WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%twitter%' OR referrer ILIKE '%linkedin%' THEN 'social_media'
                ELSE 'other_websites'
            END as referrer_type,
            COUNT(DISTINCT ip_address) as count
        FROM analytics_events
        WHERE domain_id = $1 AND event_type = 'page_view'
        AND created_at BETWEEN $2 AND $3
        GROUP BY referrer_type
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut referrer_type_breakdown = ReferrerTypeBreakdown {
        direct: 0,
        search_engines: 0,
        social_media: 0,
        other_websites: 0,
    };

    for stat in referrer_types {
        let count = stat.count.unwrap_or(0);
        match stat.referrer_type.as_deref() {
            Some("direct") => referrer_type_breakdown.direct = count,
            Some("search_engines") => referrer_type_breakdown.search_engines = count,
            Some("social_media") => referrer_type_breakdown.social_media = count,
            _ => referrer_type_breakdown.other_websites = count,
        }
    }

    Ok(Json(ReferrerResponse {
        top_referrers,
        referrer_types: referrer_type_breakdown,
    }))
}

pub async fn get_realtime_stats(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<RealtimeResponse>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let now = Utc::now();
    let one_hour_ago = now - Duration::hours(1);
    let five_minutes_ago = now - Duration::minutes(5);

    // Active visitors (last 5 minutes)
    let active_visitors = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT ip_address) FROM analytics_events WHERE domain_id = $1 AND created_at >= $2",
        domain.id,
        five_minutes_ago
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    // Page views last hour
    let page_views_last_hour = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM analytics_events WHERE domain_id = $1 AND event_type = 'page_view' AND created_at >= $2",
        domain.id,
        one_hour_ago
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    // Top active pages
    let top_pages_now = sqlx::query!(
        r#"
        SELECT path, COUNT(DISTINCT ip_address) as active_visitors
        FROM analytics_events 
        WHERE domain_id = $1 AND created_at >= $2
        GROUP BY path
        ORDER BY active_visitors DESC
        LIMIT 10
        "#,
        domain.id,
        five_minutes_ago
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| ActivePageStats {
        path: row.path.unwrap_or_default(),
        active_visitors: row.active_visitors.unwrap_or(0),
    })
    .collect();

    // Recent events
    let ten_minutes_ago = Utc::now() - Duration::minutes(10);
    let recent_events = sqlx::query!(
        r#"
        SELECT event_type, path, created_at, 
               SUBSTRING(host(ip_address), 1, GREATEST(LENGTH(host(ip_address)) - 3, 1)) || 'XXX' as ip_address,
               SUBSTRING(user_agent, 1, 50) as user_agent
        FROM analytics_events
        WHERE domain_id = $1 AND created_at >= $2
        ORDER BY created_at DESC
        LIMIT 20
        "#,
        domain.id,
        ten_minutes_ago
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| RecentEvent {
        event_type: row.event_type,
        path: row.path.unwrap_or_default(),
        timestamp: row.created_at.unwrap_or_else(|| Utc::now()),
        ip_address: row.ip_address.unwrap_or_default(),
        user_agent: row.user_agent.unwrap_or_default(),
    })
    .collect();

    Ok(Json(RealtimeResponse {
        active_visitors,
        page_views_last_hour,
        top_pages_now,
        recent_events,
    }))
}

pub async fn get_post_analytics(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<PostStats>>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let post_stats = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.slug,
               COUNT(ae.id) as views,
               COUNT(DISTINCT ae.ip_address) as unique_views
        FROM posts p
        LEFT JOIN analytics_events ae ON p.id = ae.post_id AND ae.event_type = 'post_view'
        WHERE p.domain_id = $1
        GROUP BY p.id, p.title, p.slug
        ORDER BY views DESC
        "#,
        domain.id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .into_iter()
    .map(|row| PostStats {
        id: row.id,
        title: row.title,
        slug: row.slug,
        views: row.views.unwrap_or(0),
        unique_views: row.unique_views.unwrap_or(0),
    })
    .collect();

    Ok(Json(post_stats))
}

pub async fn get_post_stats(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Path(post_id): Path<i32>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let post_stats = sqlx::query!(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as views,
            COUNT(DISTINCT ip_address) as unique_views
        FROM analytics_events
        WHERE domain_id = $1 AND post_id = $2 AND event_type = 'post_view'
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
        "#,
        domain.id,
        post_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let daily_stats: Vec<serde_json::Value> = post_stats
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "date": row.date.unwrap().format("%Y-%m-%d").to_string(),
                "views": row.views.unwrap_or(0),
                "unique_views": row.unique_views.unwrap_or(0)
            })
        })
        .collect();

    Ok(Json(serde_json::json!({
        "daily_stats": daily_stats
    })))
}

pub async fn export_data(
    Extension(domain): Extension<DomainContext>,
    Extension(user): Extension<UserContext>,
    State(state): State<Arc<AppState>>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<String, StatusCode> {
    check_analytics_permission(&user, domain.id)?;

    let (start_date, end_date) = parse_date_range(&query);

    let events = sqlx::query!(
        r#"
        SELECT event_type, path, user_agent, referrer, created_at,
               SUBSTRING(host(ip_address), 1, GREATEST(LENGTH(host(ip_address)) - 3, 1)) || 'XXX' as ip_address
        FROM analytics_events
        WHERE domain_id = $1 AND created_at BETWEEN $2 AND $3
        ORDER BY created_at DESC
        "#,
        domain.id,
        start_date,
        end_date
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Generate CSV
    let mut csv = "Event Type,Path,IP Address,User Agent,Referrer,Timestamp\n".to_string();

    for event in events {
        csv.push_str(&format!(
            "{},{},{},{},{},{}\n",
            event.event_type,
            event.path.unwrap_or_default().replacen(",", ";", 10),
            event.ip_address.unwrap_or_default(),
            event.user_agent.unwrap_or_default().replacen(",", ";", 10),
            event.referrer.unwrap_or_default().replacen(",", ";", 10),
            event
                .created_at
                .unwrap_or_else(|| Utc::now())
                .format("%Y-%m-%d %H:%M:%S")
        ));
    }

    Ok(csv)
}
