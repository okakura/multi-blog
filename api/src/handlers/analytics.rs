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
struct OverviewResponse {
    current_period: PeriodStats,
    previous_period: PeriodStats,
    change_percent: ChangePercent,
    top_posts: Vec<PostStats>,
    top_categories: Vec<CategoryStats>,
}

#[derive(Serialize)]
struct PeriodStats {
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
    searches: i64,
    avg_session_duration: f64, // in minutes
}

#[derive(Serialize)]
struct ChangePercent {
    page_views: f64,
    unique_visitors: f64,
    post_views: f64,
    searches: f64,
}

#[derive(Serialize)]
struct PostStats {
    id: i32,
    title: String,
    slug: String,
    views: i64,
    unique_views: i64,
}

#[derive(Serialize)]
struct CategoryStats {
    category: String,
    views: i64,
    posts_count: i64,
}

#[derive(Serialize)]
struct TrafficResponse {
    daily_stats: Vec<DayStats>,
    hourly_distribution: Vec<HourStats>,
    device_breakdown: DeviceBreakdown,
}

#[derive(Serialize)]
struct DayStats {
    date: String,
    page_views: i64,
    unique_visitors: i64,
    post_views: i64,
}

#[derive(Serialize)]
struct HourStats {
    hour: i32,
    page_views: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
struct DeviceBreakdown {
    mobile: i64,
    desktop: i64,
    tablet: i64,
    unknown: i64,
}

#[derive(Serialize)]
struct SearchAnalyticsResponse {
    popular_terms: Vec<SearchTerm>,
    search_volume_trend: Vec<SearchVolumeDay>,
    no_results_queries: Vec<SearchTerm>,
}

#[derive(Serialize)]
struct SearchTerm {
    query: String,
    count: i64,
    results_found: bool,
}

#[derive(Serialize)]
struct SearchVolumeDay {
    date: String,
    searches: i64,
}

#[derive(Serialize)]
struct ReferrerResponse {
    top_referrers: Vec<ReferrerStats>,
    referrer_types: ReferrerTypeBreakdown,
}

#[derive(Serialize)]
struct ReferrerStats {
    referrer: String,
    visits: i64,
    unique_visitors: i64,
}

#[derive(Serialize)]
struct ReferrerTypeBreakdown {
    direct: i64,
    search_engines: i64,
    social_media: i64,
    other_websites: i64,
}

#[derive(Serialize)]
struct RealtimeResponse {
    active_visitors: i64,
    page_views_last_hour: i64,
    top_pages_now: Vec<ActivePageStats>,
    recent_events: Vec<RecentEvent>,
}

#[derive(Serialize)]
struct ActivePageStats {
    path: String,
    active_visitors: i64,
}

#[derive(Serialize)]
struct RecentEvent {
    event_type: String,
    path: String,
    timestamp: DateTime<Utc>,
    ip_address: String, // anonymized
    user_agent: String,
}

#[derive(Deserialize)]
struct AnalyticsQuery {
    days: Option<i32>, // Default 30
    start_date: Option<String>,
    end_date: Option<String>,
}

// Check analytics permission (viewer level required)
fn check_analytics_permission(user: &UserContext, domain_id: i32) -> Result<(), StatusCode> {
    if user.role == "super_admin" {
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

async fn get_overview(
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

async fn get_traffic_stats(
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

async fn get_search_analytics(
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

async fn get_referrer_stats(
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

async fn get_realtime_stats(
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

async fn get_post_analytics(
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

async fn get_post_stats(
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

async fn export_data(
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
