// src/handlers/session.rs
use crate::{AppState, DomainContext, AnalyticsContext};
use crate::services::session_tracking::SessionTracker;
use axum::{
    Extension,
    extract::{State, Json as AxumJson},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateSessionRequest {
    pub user_agent: String,
    pub referrer: Option<String>,
    pub screen_resolution: Option<String>,
    pub language: Option<String>,
}

#[derive(Serialize)]
pub struct CreateSessionResponse {
    pub session_id: String,
}

#[derive(Deserialize)]
pub struct UpdateSessionRequest {
    pub session_id: String,
    pub last_activity: String,
}

#[derive(Serialize)]
pub struct UpdateSessionResponse {
    pub success: bool,
}

#[derive(Deserialize)]
pub struct EndSessionRequest {
    pub session_id: String,
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
    AxumJson(payload): AxumJson<CreateSessionRequest>,
) -> Result<Json<CreateSessionResponse>, StatusCode> {
    let session_id = Uuid::new_v4().to_string();
    
    // Create session info from request and analytics context
    let session_info = crate::services::session_tracking::SessionInfo {
        user_agent: Some(payload.user_agent),
        ip_address: analytics.ip_address.parse().ok(),
        referrer: payload.referrer,
        domain_name: Some(domain.hostname.clone()),
    };
    
    match SessionTracker::get_or_create_session(&state.db, &session_id, session_info).await {
        Ok(_) => Ok(Json(CreateSessionResponse { session_id })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Update session activity (for now, just call get_or_create_session to update last_activity)
pub async fn update_session(
    Extension(domain): Extension<DomainContext>,
    Extension(analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    AxumJson(payload): AxumJson<UpdateSessionRequest>,
) -> Result<Json<UpdateSessionResponse>, StatusCode> {
    // Create session info for the update
    let session_info = crate::services::session_tracking::SessionInfo {
        user_agent: Some(analytics.user_agent.clone()),
        ip_address: analytics.ip_address.parse().ok(),
        referrer: analytics.referrer.clone(),
        domain_name: Some(domain.hostname.clone()),
    };
    
    match SessionTracker::get_or_create_session(&state.db, &payload.session_id, session_info).await {
        Ok(_) => Ok(Json(UpdateSessionResponse { success: true })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// End a session
pub async fn end_session(
    Extension(_domain): Extension<DomainContext>,
    Extension(_analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    AxumJson(payload): AxumJson<EndSessionRequest>,
) -> Result<Json<EndSessionResponse>, StatusCode> {
    match SessionTracker::end_session(&state.db, &payload.session_id).await {
        Ok(_) => Ok(Json(EndSessionResponse { success: true })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
