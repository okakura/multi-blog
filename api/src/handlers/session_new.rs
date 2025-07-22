// src/handlers/session.rs
use crate::services::session_tracking::SessionTracker;
use crate::{AnalyticsContext, AppState, DomainContext};
use axum::{
    Extension,
    extract::{Json as AxumJson, State},
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
    let session_tracker = SessionTracker::new(&state.db);

    let session_id = Uuid::new_v4().to_string();

    match session_tracker
        .start_session(
            &session_id,
            &analytics.ip_address,
            &payload.user_agent,
            payload.referrer.as_deref(),
            &domain.id,
        )
        .await
    {
        Ok(_) => Ok(Json(CreateSessionResponse { session_id })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Update session activity
pub async fn update_session(
    Extension(_domain): Extension<DomainContext>,
    Extension(_analytics): Extension<AnalyticsContext>,
    State(state): State<Arc<AppState>>,
    AxumJson(payload): AxumJson<UpdateSessionRequest>,
) -> Result<Json<UpdateSessionResponse>, StatusCode> {
    let session_tracker = SessionTracker::new(&state.db);

    match session_tracker.update_activity(&payload.session_id).await {
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
    let session_tracker = SessionTracker::new(&state.db);

    match session_tracker.end_session(&payload.session_id).await {
        Ok(_) => Ok(Json(EndSessionResponse { success: true })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
