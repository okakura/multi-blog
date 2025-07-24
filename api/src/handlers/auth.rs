use crate::utils::{ErrorSpan, PerformanceSpan};
use crate::{AppState, DomainPermission};
use axum::{
    Router,
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
};
use bcrypt::verify;
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use std::{env, sync::Arc};

// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // user email
    pub user_id: i32, // user id
    pub role: String, // user role
    pub exp: usize,   // expiry
    pub iat: usize,   // issued at
}

// Get JWT secret from environment variable
fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").expect("JWT_SECRET must be set in environment")
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

impl LoginRequest {
    fn validate(&self) -> Result<(), String> {
        if self.email.trim().is_empty() {
            return Err("Email is required".to_string());
        }
        if !self.email.contains('@') {
            return Err("Invalid email format".to_string());
        }
        if self.password.len() < 6 {
            return Err("Password must be at least 6 characters".to_string());
        }
        Ok(())
    }
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
    pub domain_permissions: Vec<DomainPermission>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub role: String,
    pub domain_permissions: Vec<DomainPermission>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

impl ErrorResponse {
    pub fn new(error: &str, message: &str) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
        }
    }
}

/// Login endpoint
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    PerformanceSpan::monitor("user_login", async {
        // Validate input
        if let Err(validation_error) = payload.validate() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse::new("validation_error", &validation_error)),
            ));
        }
        // Look up user in database
        let user = sqlx::query!(
            "SELECT id, email, name, password_hash, role FROM users WHERE email = $1",
            payload.email
        )
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new("database_error", "Failed to query user")),
            )
        })?;

        let user = match user {
            Some(u) => u,
            None => {
                ErrorSpan::track_error(
                    "auth_invalid_credentials",
                    "warning",
                    &format!("Login attempt failed for email: {}", payload.email),
                    Some(serde_json::json!({
                        "email": payload.email,
                        "reason": "user_not_found"
                    })),
                );
                return Err((
                    StatusCode::UNAUTHORIZED,
                    Json(ErrorResponse::new(
                        "invalid_credentials",
                        "Invalid email or password",
                    )),
                ));
            }
        };

        // Verify password
        if !verify(&payload.password, &user.password_hash).map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(
                    "auth_error",
                    "Password verification failed",
                )),
            )
        })? {
            ErrorSpan::track_error(
                "auth_invalid_password",
                "warning",
                &format!("Invalid password attempt for user: {}", user.email),
                Some(serde_json::json!({
                    "user_id": user.id,
                    "email": user.email,
                    "reason": "incorrect_password"
                })),
            );
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new(
                    "invalid_credentials",
                    "Invalid email or password",
                )),
            ));
        }

        // Get domain permissions for this user
        let permissions_rows = sqlx::query!(
            "SELECT domain_id, role FROM user_domain_permissions WHERE user_id = $1",
            user.id
        )
        .fetch_all(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(
                    "database_error",
                    "Failed to query permissions",
                )),
            )
        })?;

        let domain_permissions = permissions_rows
            .into_iter()
            .map(|row| DomainPermission {
                domain_id: row.domain_id.unwrap_or(0),
                role: row.role,
            })
            .collect();

        // Create JWT token
        let now = Utc::now();
        let exp = now + Duration::hours(24); // Token valid for 24 hours

        let claims = Claims {
            sub: user.email.clone(),
            user_id: user.id,
            role: user.role.clone().unwrap_or_default(),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(get_jwt_secret().as_bytes()),
        )
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(
                    "token_error",
                    "Failed to generate token",
                )),
            )
        })?;

        let user_info = UserInfo {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.unwrap_or_default(),
            domain_permissions,
        };

        Ok(Json(LoginResponse {
            user: user_info,
            token,
        }))
    })
    .await
}

/// Verify token endpoint
pub async fn verify_token(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<VerifyResponse>, (StatusCode, Json<ErrorResponse>)> {
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match token {
        Some(t) => t,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new(
                    "missing_token",
                    "Authorization header missing or invalid",
                )),
            ));
        }
    };

    // Decode and validate JWT
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(get_jwt_secret().as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse::new(
                "invalid_token",
                "Token is invalid or expired",
            )),
        )
    })?;

    let claims = token_data.claims;

    // Get user from database to ensure they still exist
    let user = sqlx::query!(
        "SELECT id, email, name, role FROM users WHERE id = $1 AND email = $2",
        claims.user_id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(
                "database_error",
                "Failed to verify user",
            )),
        )
    })?;

    let user = match user {
        Some(u) => u,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new(
                    "user_not_found",
                    "User no longer exists",
                )),
            ));
        }
    };

    // Get domain permissions for this user
    let permissions_rows = sqlx::query!(
        "SELECT domain_id, role FROM user_domain_permissions WHERE user_id = $1",
        user.id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(
                "database_error",
                "Failed to query permissions",
            )),
        )
    })?;

    let domain_permissions = permissions_rows
        .into_iter()
        .map(|row| DomainPermission {
            domain_id: row.domain_id.unwrap_or(0),
            role: row.role,
        })
        .collect();

    Ok(Json(VerifyResponse {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.unwrap_or_default(),
        domain_permissions,
    }))
}

/// Logout endpoint (for now just returns success)
pub async fn logout() -> Result<Json<serde_json::Value>, StatusCode> {
    Ok(Json(
        serde_json::json!({ "message": "Logged out successfully" }),
    ))
}

/// JWT validation function for middleware
pub fn validate_jwt_token(token: &str) -> Result<Claims, Box<dyn std::error::Error>> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(get_jwt_secret().as_bytes()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

/// Create auth router
pub fn auth_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/login", post(login))
        .route("/verify", get(verify_token))
        .route("/logout", post(logout))
}
