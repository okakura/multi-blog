use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;

// Module declarations
pub mod extractors;
pub mod handlers;
pub mod middleware;
pub mod services;
pub mod telemetry;
pub mod utils;

#[cfg(test)]
pub mod test_utils;

// Re-export commonly used types
pub use extractors::*;

// Core context types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainContext {
    pub id: i32,
    pub hostname: String,
    pub name: String,
    pub theme_config: serde_json::Value,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub role: String,
    pub domain_permissions: Vec<DomainPermission>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainPermission {
    pub domain_id: i32,
    pub role: String, // admin, editor, viewer
}

#[derive(Debug, Clone)]
pub struct AnalyticsContext {
    pub ip_address: String,
    pub user_agent: String,
    pub referrer: Option<String>,
}

pub struct AppState {
    pub db: PgPool,
}

// Helper struct for database operations
#[derive(Debug, Clone, sqlx::FromRow)]
struct DomainContextDb {
    pub id: i32,
    pub hostname: String,
    pub name: String,
    pub theme_config: serde_json::Value,
    pub categories: serde_json::Value,
}

// Middleware to resolve domain from hostname
pub async fn domain_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract hostname from headers
    let hostname = request
        .headers()
        .get("x-domain")
        .and_then(|v| v.to_str().ok())
        .or_else(|| {
            request
                .headers()
                .get("host")
                .and_then(|v| v.to_str().ok())
                .and_then(|h| h.split(':').next()) // Remove port if present
        })
        .unwrap_or("localhost")
        .to_string();

    let span = tracing::info_span!(
        "domain_middleware",
        hostname = %hostname,
        domain_id = tracing::field::Empty,
        domain_name = tracing::field::Empty,
    );

    let _guard = span.enter();
    tracing::debug!("Looking up domain for hostname");

    // Query domain from database
    let domain_db = sqlx::query_as::<_, DomainContextDb>(
        r#"
        SELECT id, hostname, name, theme_config, 
               COALESCE(categories, '[]'::jsonb) as categories
        FROM domains 
        WHERE hostname = $1
        "#,
    )
    .bind(&hostname)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Database error in domain middleware");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let domain = match domain_db {
        Some(d) => {
            span.record("domain_id", d.id);
            span.record("domain_name", &d.name);
            tracing::info!(domain_id = d.id, domain_name = %d.name, "Domain found");

            // Parse categories JSON into Vec<String>
            let categories = d
                .categories
                .as_array()
                .unwrap_or(&Vec::new())
                .iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect::<Vec<_>>();

            DomainContext {
                id: d.id,
                hostname: d.hostname,
                name: d.name,
                theme_config: d.theme_config,
                categories,
            }
        }
        None => {
            tracing::warn!("Domain not found for hostname");
            return Err(StatusCode::NOT_FOUND);
        }
    };

    // Insert domain context into request extensions
    request.extensions_mut().insert(domain);

    Ok(next.run(request).await)
}

// Middleware to extract analytics context
pub async fn analytics_middleware(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Response {
    let span = tracing::info_span!(
        "analytics_middleware",
        ip_address = tracing::field::Empty,
        user_agent = tracing::field::Empty,
        has_referrer = tracing::field::Empty,
    );

    let _guard = span.enter();

    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    let referrer = headers
        .get("referer")
        .and_then(|v| v.to_str().ok())
        .map(String::from);

    // In production, you'd want to handle X-Forwarded-For, X-Real-IP, etc.
    let ip_address = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .unwrap_or("127.0.0.1")
        .trim()
        .to_string();

    let analytics_ctx = AnalyticsContext {
        ip_address: ip_address.clone(),
        user_agent: user_agent.clone(),
        referrer: referrer.clone(),
    };

    span.record("ip_address", &ip_address);
    span.record("user_agent", &user_agent);
    span.record("has_referrer", referrer.is_some());

    tracing::debug!("Analytics context extracted");

    // Store the analytics context in request extensions
    request.extensions_mut().insert(analytics_ctx);

    tracing::debug!("Calling next handler");
    let response = next.run(request).await;
    tracing::debug!("Handler completed");

    crate::telemetry::record_analytics_event("request_processed");
    response
}

// Middleware for admin authentication (JWT or session-based)
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let span = tracing::info_span!(
        "auth_middleware",
        user_id = tracing::field::Empty,
        user_email = tracing::field::Empty,
        has_token = tracing::field::Empty,
        permissions_count = tracing::field::Empty,
    );

    let _guard = span.enter();
    tracing::debug!("Starting authentication check");

    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match token {
        Some(t) => {
            span.record("has_token", true);
            tracing::debug!(token_prefix = %&t[..20.min(t.len())], "Found authorization token");
            t
        }
        None => {
            span.record("has_token", false);
            tracing::warn!("No authorization token provided");
            crate::telemetry::record_auth_metrics("missing_token", false);
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Validate JWT and get user claims
    let claims = match crate::handlers::auth::validate_jwt_token(token) {
        Ok(claims) => {
            span.record("user_email", &claims.sub);
            tracing::info!(user_email = %claims.sub, "Token validation successful");
            crate::telemetry::record_auth_metrics("token_validation", true);
            claims
        }
        Err(e) => {
            tracing::error!(error = %e, "Token validation failed");
            crate::telemetry::record_auth_metrics("token_validation", false);
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Get user and domain permissions from database
    let user = sqlx::query!(
        "SELECT id, email, name, role FROM users WHERE id = $1 AND email = $2",
        claims.user_id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Database error while fetching user");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let user = match user {
        Some(u) => {
            span.record("user_id", u.id);
            u
        }
        None => {
            tracing::warn!(user_email = %claims.sub, "User not found in database");
            crate::telemetry::record_auth_metrics("user_lookup", false);
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Get domain permissions
    let permissions_rows = sqlx::query!(
        "SELECT domain_id, role FROM user_domain_permissions WHERE user_id = $1",
        user.id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = user.id, "Error fetching user permissions");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let domain_permissions = permissions_rows
        .into_iter()
        .map(|row| DomainPermission {
            domain_id: row.domain_id.unwrap_or(0),
            role: row.role,
        })
        .collect::<Vec<_>>();

    span.record("permissions_count", domain_permissions.len());

    // Create user context with real data from database
    let user_context = UserContext {
        id: user.id,
        email: user.email.clone(),
        name: user.name,
        role: user.role.unwrap_or_default(),
        domain_permissions,
    };

    tracing::info!(
        user_id = user_context.id,
        user_email = %user_context.email,
        user_role = %user_context.role,
        "Authentication successful, user context created"
    );

    crate::telemetry::record_auth_metrics("authentication", true);
    request.extensions_mut().insert(user_context);

    Ok(next.run(request).await)
}
