// src/handlers/mod.rs
pub mod admin;
pub mod analytics;
pub mod auth;
pub mod blog;

use crate::AppState;
use axum::Router;
use std::sync::Arc;

// Trait that each handler module implements
pub trait HandlerModule {
    fn routes() -> Router<Arc<AppState>>;
    fn mount_path() -> &'static str;
}
