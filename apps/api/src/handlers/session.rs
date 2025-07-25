// src/handlers/session.rs
use crate::{AppState, DomainContext, AnalyticsContext};
use crate::services::session_tracking::SessionTracker;
use crate::validation::extractors::ValidatedJson;
use axum::{
    Extension,
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct CreateSessionRequest {
    #[validate(length(min = 1, max = 500, message = "User agent must be between 1 and 500 characters"))]
    pub user_agent: String,
    #[validate(url(message = "Invalid referrer URL"))]
    pub referrer: Option<String>,
    #[validate(length(max = 50, message = "Screen resolution too long"))]
    pub screen_resolution: Option<String>,
    #[validate(length(max = 10, message = "Language code too long"))]
    pub language: Option<String>,
}

#[derive(Serialize)]
pub struct CreateSessionResponse {
    pub session_id: Uuid,
}

#[derive(Deserialize, Validate)]
pub struct UpdateSessionRequest {
    pub session_id: Uuid,
    #[validate(length(min = 1, message = "Last activity timestamp is required"))]
    pub last_activity: String,
}

#[derive(Serialize)]
pub struct UpdateSessionResponse {
    pub success: bool,
}

#[derive(Deserialize, Validate)]
pub struct EndSessionRequest {
    pub session_id: Uuid,
    #[validate(length(min = 1, message = "End timestamp is required"))]
    pub ended_at: String,
}

#[derive(Serialize)]
pub struct EndSessionResponse {
    pub success: bool,
}

/// Create a new session
pub async fn create_session(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<CreateSessionRequest>,
) -> Result<Json<CreateSessionResponse>, StatusCode> {
    let session_id = Uuid::new_v4();
    
    // Create session info from request and analytics context
    let session_info = crate::services::session_tracking::SessionInfo {
        user_agent: Some(payload.user_agent),
        ip_address: analytics.ip_address.parse().ok(),
        referrer: payload.referrer,
        domain_name: Some(domain.hostname.clone()),
    };
    
    match SessionTracker::get_or_create_session(&state.db, session_id, session_info).await {
        Ok(_) => Ok(Json(CreateSessionResponse { session_id })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Update session activity (for now, just call get_or_create_session to update last_activity)
pub async fn update_session(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<UpdateSessionRequest>,
) -> Result<Json<UpdateSessionResponse>, StatusCode> {
    // Create session info for the update
    let session_info = crate::services::session_tracking::SessionInfo {
        user_agent: Some(analytics.user_agent.clone()),
        ip_address: analytics.ip_address.parse().ok(),
        referrer: analytics.referrer.clone(),
        domain_name: Some(domain.hostname.clone()),
    };
    
    match SessionTracker::get_or_create_session(&state.db, payload.session_id, session_info).await {
        Ok(_) => Ok(Json(UpdateSessionResponse { success: true })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// End a session
pub async fn end_session(
    Extension(_domain): Extension<DomainContext>,
    Extension(_analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<EndSessionRequest>,
) -> Result<Json<EndSessionResponse>, StatusCode> {
    match SessionTracker::end_session(&state.db, payload.session_id).await {
        Ok(_) => Ok(Json(EndSessionResponse { success: true })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
