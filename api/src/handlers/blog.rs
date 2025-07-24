// src/handlers/blog.rs
use crate::utils::{AnalyticsSpan, BusinessSpan, DatabaseSpan};
use crate::{AnalyticsContext, AppState, DomainContext};
use axum::{
    Extension, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use tracing::{info, instrument, warn};
use utoipa::{IntoParams, OpenApi, ToSchema};

pub struct BlogModule;

impl super::HandlerModule for BlogModule {
    fn routes() -> Router<Arc<AppState>> {
        Router::new()
            .route("/", get(home))
            .route("/posts", get(list_posts))
            .route("/posts/{slug}", get(get_post))
            .route("/category/{category}", get(get_category_posts))
            .route("/search", get(search_posts))
            .route("/feed.xml", get(rss_feed))
    }

    fn mount_path() -> &'static str {
        "/"
    }
}

#[derive(Serialize, sqlx::FromRow, ToSchema)]
#[schema(example = json!({
    "id": 1,
    "title": "Sample Blog Post",
    "content": "This is the content of the blog post...",
    "author": "John Doe",
    "category": "Technology",
    "slug": "sample-blog-post",
    "created_at": "2025-07-20T04:00:00Z"
}))]
struct PostResponse {
    /// Unique identifier for the post
    id: i32,
    /// Title of the blog post
    title: String,
    /// Full content of the blog post
    content: String,
    /// Author of the post
    author: String,
    /// Category the post belongs to
    category: String,
    /// URL-friendly slug for the post
    slug: String,
    /// When the post was created
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "posts": [
        {
            "id": 1,
            "title": "Sample Post",
            "author": "John Doe",
            "category": "Technology",
            "slug": "sample-post",
            "created_at": "2025-07-20T04:00:00Z"
        }
    ],
    "total": 25,
    "page": 1,
    "per_page": 10
}))]
struct PostListResponse {
    /// List of blog post summaries
    posts: Vec<PostSummary>,
    /// Total number of posts matching the query
    total: i64,
    /// Current page number
    page: i32,
    /// Number of posts per page
    per_page: i32,
}

#[derive(Serialize, sqlx::FromRow, ToSchema)]
#[schema(example = json!({
    "id": 1,
    "title": "Sample Blog Post",
    "author": "John Doe",
    "category": "Technology",
    "slug": "sample-blog-post",
    "created_at": "2025-07-20T04:00:00Z"
}))]
struct PostSummary {
    /// Unique identifier for the post
    id: i32,
    /// Title of the blog post
    title: String,
    /// Author of the post
    author: String,
    /// Category the post belongs to
    category: String,
    /// URL-friendly slug for the post
    slug: String,
    /// When the post was created
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize, ToSchema, IntoParams)]
struct ListQuery {
    /// Page number (default: 1)
    #[schema(example = 1, minimum = 1)]
    page: Option<i32>,
    /// Number of posts per page (default: 10, max: 50)
    #[schema(example = 10, minimum = 1, maximum = 50)]
    per_page: Option<i32>,
    /// Filter posts by category
    #[schema(example = "Technology")]
    category: Option<String>,
}

#[derive(Deserialize, ToSchema, IntoParams)]
struct SearchQuery {
    /// Search query string
    #[schema(example = "rust programming")]
    q: String,
    /// Page number (default: 1)
    #[schema(example = 1, minimum = 1)]
    page: Option<i32>,
}

#[utoipa::path(
    get,
    path = "/",
    responses(
        (status = 200, description = "Blog home page with latest posts")
    ),
    tag = "blog"
)]
async fn home(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Log the page view
    log_page_view(&state, &domain, &analytics, "/").await?;

    // Get recent posts for homepage
    let posts = sqlx::query_as::<_, PostSummary>(
        r#"
        SELECT id, title, author, category, slug, created_at
        FROM posts 
        WHERE domain_id = $1 AND status = 'published'
        ORDER BY created_at DESC 
        LIMIT 5
        "#,
    )
    .bind(domain.id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "domain": domain.name,
        "recent_posts": posts,
        "categories": domain.categories
    })))
}

#[utoipa::path(
    get,
    path = "/posts",
    params(ListQuery),
    responses(
        (status = 200, description = "List of blog posts retrieved successfully", body = PostListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "blog"
)]
async fn list_posts(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<PostListResponse>, StatusCode> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(10).clamp(1, 50);
    let offset = (page - 1) * per_page;

    log_page_view(&state, &domain, &analytics, "/posts").await?;

    let mut query = "SELECT id, title, author, category, slug, created_at FROM posts WHERE domain_id = $1 AND status = 'published'".to_string();
    let mut bind_count = 1;

    if let Some(_category) = &params.category {
        bind_count += 1;
        query.push_str(&format!(" AND category = ${}", bind_count));
    }

    query.push_str(&format!(
        " ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        bind_count + 1,
        bind_count + 2
    ));

    let mut sqlx_query = sqlx::query_as::<_, PostSummary>(&query).bind(domain.id);

    if let Some(category) = &params.category {
        sqlx_query = sqlx_query.bind(category);
    }

    let posts = sqlx_query
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Get total count
    let total_query = if params.category.is_some() {
        "SELECT COUNT(*) as count FROM posts WHERE domain_id = $1 AND status = 'published' AND category = $2"
    } else {
        "SELECT COUNT(*) as count FROM posts WHERE domain_id = $1 AND status = 'published'"
    };

    let mut count_query = sqlx::query_scalar::<_, i64>(total_query).bind(domain.id);
    if let Some(category) = &params.category {
        count_query = count_query.bind(category);
    }

    let total = count_query
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(PostListResponse {
        posts,
        total,
        page,
        per_page,
    }))
}

#[utoipa::path(
    get,
    path = "/posts/{slug}",
    params(
        ("slug" = String, Path, description = "Post slug")
    ),
    responses(
        (status = 200, description = "Single blog post", body = PostResponse),
        (status = 404, description = "Post not found")
    ),
    tag = "blog"
)]
#[instrument(
    skip(state, domain, analytics),
    fields(
        blog.slug = %slug,
        blog.domain = %domain.name,
        blog.domain_id = %domain.id,
        blog.post_found = false,
        blog.post_title,
        blog.post_id,
        http.method = "GET",
        http.route = "/posts/{slug}"
    )
)]
async fn get_post(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<PostResponse>, StatusCode> {
    // Add request context to span
    BusinessSpan::add_request_context("", "GET", &format!("/posts/{}", slug));

    info!(
        "Looking for post with slug: {} in domain: {}",
        slug, domain.name
    );

    // Wrap database query with tracing
    let post = DatabaseSpan::execute("SELECT", "posts", async {
        sqlx::query_as::<_, PostResponse>(
            r#"
                SELECT id, title, content, author, category, slug, created_at
                FROM posts 
                WHERE domain_id = $1 AND slug = $2 AND status = 'published'
                "#,
        )
        .bind(domain.id)
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
    })
    .await
    .map_err(|e| {
        warn!("Database error retrieving post: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let post = match post {
        Some(p) => {
            // Record successful retrieval in span
            BusinessSpan::add_attribute("blog.post_found", "true");
            BusinessSpan::add_attribute("blog.post_title", &p.title);
            BusinessSpan::add_attribute("blog.post_id", &p.id.to_string());

            info!("Found post: '{}' (ID: {})", p.title, p.id);
            p
        }
        None => {
            warn!("Post not found for slug: {}", slug);
            return Err(StatusCode::NOT_FOUND);
        }
    };

    // Track page view with analytics tracing
    BusinessSpan::execute("log_page_view", async {
        log_page_view(&state, &domain, &analytics, &format!("/posts/{}", slug)).await
    })
    .await
    .unwrap_or_else(|e| {
        warn!("Analytics logging failed: {:?}", e);
    });

    // Track the analytics event with detailed context
    let event_data = serde_json::json!({
        "post_id": post.id,
        "post_title": post.title,
        "post_slug": slug,
        "domain": domain.name,
        "category": post.category
    });

    AnalyticsSpan::track_event("post_view", None, event_data);

    info!("Successfully retrieved and returning post: {}", post.title);
    Ok(Json(post))
}

async fn get_category_posts(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    Path(category): Path<String>,
) -> Result<Json<PostListResponse>, StatusCode> {
    log_page_view(
        &state,
        &domain,
        &analytics,
        &format!("/category/{}", category),
    )
    .await?;

    let posts = sqlx::query_as::<_, PostSummary>(
        r#"
        SELECT id, title, author, category, slug, created_at
        FROM posts 
        WHERE domain_id = $1 AND category = $2 AND status = 'published'
        ORDER BY created_at DESC
        LIMIT 20
        "#,
    )
    .bind(domain.id)
    .bind(category)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let total = posts.len() as i64;

    Ok(Json(PostListResponse {
        posts,
        total,
        page: 1,
        per_page: 20,
    }))
}

#[utoipa::path(
    get,
    path = "/search",
    params(SearchQuery),
    responses(
        (status = 200, description = "Search results", body = PostListResponse)
    ),
    tag = "blog"
)]
async fn search_posts(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<PostListResponse>, StatusCode> {
    log_page_view(&state, &domain, &analytics, "/search").await?;

    // Log search event with query
    sqlx::query(
        r#"
        INSERT INTO analytics_events (domain_id, event_type, path, user_agent, ip_address, referrer, metadata)
        VALUES ($1, 'search', '/search', $2, $3, $4, $5)
        "#
    )
    .bind(domain.id)
    .bind(&analytics.user_agent)
    .bind(&analytics.ip_address)
    .bind(&analytics.referrer)
    .bind(serde_json::json!({"query": params.q}))
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let posts = sqlx::query_as::<_, PostSummary>(
        r#"
        SELECT id, title, author, category, slug, created_at
        FROM posts 
        WHERE domain_id = $1 AND status = 'published' 
        AND (title ILIKE $2 OR content ILIKE $2)
        ORDER BY created_at DESC
        LIMIT 20
        "#,
    )
    .bind(domain.id)
    .bind(format!("%{}%", params.q))
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let total = posts.len() as i64;

    Ok(Json(PostListResponse {
        posts,
        total,
        page: params.page.unwrap_or(1),
        per_page: 20,
    }))
}

async fn rss_feed(
    Extension(domain): Extension<DomainContext>,
    State(state): State<Arc<AppState>>,
) -> Result<String, StatusCode> {
    let posts = sqlx::query(
        r#"
        SELECT title, content, author, slug, created_at
        FROM posts 
        WHERE domain_id = $1 AND status = 'published'
        ORDER BY created_at DESC
        LIMIT 20
        "#,
    )
    .bind(domain.id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut rss = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>{}</title>
<link>https://{}</link>
<description>Latest posts from {}</description>
"#,
        domain.name, domain.hostname, domain.name
    );

    for post in posts {
        let title: String = post.get("title");
        let content: String = post.get("content");
        let author: String = post.get("author");
        let slug: String = post.get("slug");
        let created_at: chrono::DateTime<chrono::Utc> = post.get("created_at");

        rss.push_str(&format!(
            r#"<item>
<title>{}</title>
<link>https://{}/posts/{}</link>
<description>{}</description>
<author>{}</author>
<pubDate>{}</pubDate>
</item>
"#,
            title,
            domain.hostname,
            slug,
            content.chars().take(200).collect::<String>(),
            author,
            created_at.format("%a, %d %b %Y %H:%M:%S GMT")
        ));
    }

    rss.push_str("</channel></rss>");
    Ok(rss)
}

// Helper function to log page views
async fn log_page_view(
    state: &Arc<AppState>,
    domain: &DomainContext,
    analytics: &AnalyticsContext,
    path: &str,
) -> Result<(), StatusCode> {
    // Convert IP address string to a format PostgreSQL INET can handle
    let ip_addr: std::net::IpAddr = analytics
        .ip_address
        .parse()
        .unwrap_or_else(|_| "127.0.0.1".parse().unwrap());

    sqlx::query(
        r#"
        INSERT INTO analytics_events (domain_id, event_type, path, user_agent, ip_address, referrer)
        VALUES ($1, 'page_view', $2, $3, $4, $5)
        "#,
    )
    .bind(domain.id)
    .bind(path)
    .bind(&analytics.user_agent)
    .bind(ip_addr)
    .bind(&analytics.referrer)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Analytics logging error");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(())
}

#[derive(OpenApi)]
#[openapi(
    paths(
        home,
        list_posts,
        get_post,
        search_posts,
    ),
    components(
        schemas(PostResponse, PostListResponse, PostSummary, ListQuery, SearchQuery)
    ),
    tags(
        (name = "blog", description = "Blog API endpoints")
    ),
    info(
        title = "Multi-Blog API",
        version = "1.0.0",
        description = "A multi-domain blog API with analytics"
    )
)]
pub struct ApiBlogDocs;
