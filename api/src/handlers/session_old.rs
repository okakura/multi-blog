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
    let session_tracker = SessionTracker::new(&state.db);
    
    let session_id = Uuid::new_v4().to_string();
    
    match session_tracker.start_session(
        &session_id,
        &analytics.ip_address,
        &payload.user_agent,
        payload.referrer.as_deref(),
        &domain.id,
    ).await {
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
    State(state): State<Arc<AppState>>,
    AxumJson(payload): AxumJson<TrackSessionRequest>,
) -> Result<Json<TrackSessionResponse>, StatusCode> {
    
    // Create session info from analytics context
    let session_info = SessionInfo {
        user_agent: Some(analytics.user_agent.clone()),
        ip_address: analytics.ip_address.parse().ok(),
        referrer: analytics.referrer.clone(),
        domain_name: Some(domain.hostname.clone()),
    };

    // Create or update session
    let session_uuid = SessionTracker::get_or_create_session(
        &state.db,
        &payload.session_id,
        session_info,
    )
    .await
    .map_err(|e| {
        eprintln!("Error creating/updating session: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // If this is a specific event (page_view, post_view), record it in analytics_events
    if let Some(event_type) = payload.event_type {
        let result = sqlx::query!(
            r#"
            INSERT INTO analytics_events (
                domain_id, event_type, path, ip_address, user_agent, 
                referrer, post_id, session_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            "#,
            domain.id,
            event_type,
            payload.path,
            analytics.ip_address.parse::<std::net::IpAddr>().ok().map(|ip| sqlx::types::ipnetwork::IpNetwork::from(ip)),
            Some(analytics.user_agent.clone()),
            analytics.referrer.clone(),
            payload.post_id,
            session_uuid
        )
        .execute(&state.db)
        .await;

        if let Err(e) = result {
            eprintln!("Error recording analytics event: {}", e);
            // Don't fail the session tracking if analytics recording fails
        }
    }

    Ok(Json(TrackSessionResponse {
        success: true,
        session_uuid: session_uuid.to_string(),
    }))
}

/// End a session
pub async fn end_session(
    State(state): State<Arc<AppState>>,
    AxumJson(payload): AxumJson<EndSessionRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    
    SessionTracker::end_session(&state.db, &payload.session_id)
        .await
        .map_err(|e| {
            eprintln!("Error ending session: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Session ended successfully"
    })))
}
