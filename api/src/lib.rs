use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;

pub mod handlers;

#[cfg(test)]
pub mod test_utils;

// Domain context that gets passed through requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainContext {
    pub id: i32,
    pub hostname: String,
    pub name: String,
    pub theme_config: serde_json::Value,
    pub categories: Vec<String>,
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

// User context for admin operations
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

// Analytics context for tracking
#[derive(Debug, Clone)]
pub struct AnalyticsContext {
    pub ip_address: String,
    pub user_agent: String,
    pub referrer: Option<String>,
}

pub struct AppState {
    pub db: PgPool,
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

    println!("🔍 Domain middleware: Looking for hostname '{}'", hostname);

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
        println!("❌ Database error in domain middleware: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let domain = match domain_db {
        Some(d) => {
            println!("✅ Found domain: {} ({})", d.name, d.hostname);
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
            println!("❌ Domain not found: '{}'", hostname);
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
    println!("🔍 Analytics middleware: Processing request");

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

    println!(
        "✅ Analytics context: IP={}, UA={}, Referrer={:?}",
        ip_address, user_agent, referrer
    );

    request.extensions_mut().insert(analytics_ctx);

    println!("🔍 Analytics middleware: Calling next handler");
    let response = next.run(request).await;
    println!("✅ Analytics middleware: Handler completed");

    response
}

// Middleware for admin authentication (JWT or session-based)
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    println!("🔐 Auth middleware: Starting authentication check");

    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match token {
        Some(t) => {
            println!("🔐 Auth middleware: Found token: {}", &t[..20.min(t.len())]);
            t
        }
        None => {
            println!("❌ Auth middleware: No token provided");
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Validate JWT and get user claims
    let claims = match crate::handlers::auth::validate_jwt_token(token) {
        Ok(claims) => {
            println!("✅ Auth middleware: Token valid for user: {}", claims.sub);
            claims
        }
        Err(e) => {
            println!("❌ Auth middleware: Token validation failed: {}", e);
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
        println!("❌ Auth middleware: Database error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let user = match user {
        Some(u) => u,
        None => {
            println!("❌ Auth middleware: User not found in database");
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
        println!("❌ Auth middleware: Error fetching permissions: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let domain_permissions = permissions_rows
        .into_iter()
        .map(|row| DomainPermission {
            domain_id: row.domain_id.unwrap_or(0),
            role: row.role,
        })
        .collect();

    // Create user context with real data from database
    let user_context = UserContext {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.unwrap_or_default(),
        domain_permissions,
    };

    println!(
        "✅ Auth middleware: Created user context for: {}",
        user_context.email
    );
    request.extensions_mut().insert(user_context);

    Ok(next.run(request).await)
}
