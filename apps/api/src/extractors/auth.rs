use crate::UserContext;
use axum::{
    extract::{Extension, FromRequestParts},
    http::{StatusCode, request::Parts},
};

pub struct RequirePlatformAdmin {
    pub user: UserContext,
}

impl<S> FromRequestParts<S> for RequirePlatformAdmin
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = Extension::<UserContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        if user.role != "platform_admin" {
            return Err(StatusCode::FORBIDDEN);
        }

        Ok(RequirePlatformAdmin { user })
    }
}

pub struct RequireAuthenticated {
    pub user: UserContext,
}

impl<S> FromRequestParts<S> for RequireAuthenticated
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = Extension::<UserContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(RequireAuthenticated { user })
    }
}
