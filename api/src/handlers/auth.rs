use crate::AppState;
use axum::{
    Router,
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: UserInfo,
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub role: String,
}

/// Login endpoint
pub async fn login(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // TODO: Implement proper password validation with database
    // For now, simple hardcoded credentials for demo
    let is_valid = match payload.email.as_str() {
        "admin@multi-blog.com" => payload.password == "admin123",
        "editor@multi-blog.com" => payload.password == "editor123",
        "viewer@multi-blog.com" => payload.password == "viewer123",
        _ => false,
    };

    if !is_valid {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Generate simple token (in production, use proper JWT)
    let token = format!(
        "auth_token_{}_{}",
        payload.email,
        chrono::Utc::now().timestamp()
    );

    // Return user info based on email
    let (id, name, role) = match payload.email.as_str() {
        "admin@multi-blog.com" => (1, "Josh Gautier", "super_admin"),
        "editor@multi-blog.com" => (2, "Jane Smith", "editor"),
        "viewer@multi-blog.com" => (3, "John Doe", "viewer"),
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    let user = UserInfo {
        id,
        email: payload.email,
        name: name.to_string(),
        role: role.to_string(),
    };

    Ok(Json(LoginResponse { user, token }))
}

/// Verify token endpoint
pub async fn verify_token(
    State(_state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<VerifyResponse>, StatusCode> {
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match token {
        Some(t) => t,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // TODO: Implement proper JWT validation
    // For now, extract email from token format
    if !token.starts_with("auth_token_") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let email = token
        .strip_prefix("auth_token_")
        .and_then(|t| t.split('_').next())
        .unwrap_or("");

    let (id, name, role) = match email {
        "admin@multi-blog.com" => (1, "Josh Gautier", "super_admin"),
        "editor@multi-blog.com" => (2, "Jane Smith", "editor"),
        "viewer@multi-blog.com" => (3, "John Doe", "viewer"),
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    Ok(Json(VerifyResponse {
        id,
        email: email.to_string(),
        name: name.to_string(),
        role: role.to_string(),
    }))
}

/// Logout endpoint (for now just returns success)
pub async fn logout() -> Result<Json<serde_json::Value>, StatusCode> {
    Ok(Json(
        serde_json::json!({ "message": "Logged out successfully" }),
    ))
}

/// Create auth router
pub fn auth_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/login", post(login))
        .route("/verify", get(verify_token))
        .route("/logout", post(logout))
}
