use crate::{DomainContext, UserContext};
use axum::{
    extract::{Extension, FromRequestParts},
    http::{request::Parts, StatusCode},
};

pub struct RequireDomainRole {
    pub user: UserContext,
    pub domain: DomainContext,
}

pub struct RequireDomainViewer(pub RequireDomainRole);
pub struct RequireDomainEditor(pub RequireDomainRole);
pub struct RequireDomainAdmin(pub RequireDomainRole);

// Helper function for permission checking
fn check_domain_permission(
    user: &UserContext,
    domain_id: i32,
    required_role: &str,
) -> Result<(), StatusCode> {
    if user.role == "platform_admin" {
        return Ok(());
    }

    let permission = user
        .domain_permissions
        .iter()
        .find(|p| p.domain_id == domain_id)
        .ok_or(StatusCode::FORBIDDEN)?;

    match (required_role, permission.role.as_str()) {
        ("viewer", _) => Ok(()),
        ("editor", "editor" | "admin") => Ok(()),
        ("admin", "admin") => Ok(()),
        _ => Err(StatusCode::FORBIDDEN),
    }
}

// Implement FromRequestParts for each role level
impl<S> FromRequestParts<S> for RequireDomainViewer
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = Extension::<UserContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        
        let Extension(domain) = Extension::<DomainContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::BAD_REQUEST)?;

        check_domain_permission(&user, domain.id, "viewer")?;

        Ok(RequireDomainViewer(RequireDomainRole { user, domain }))
    }
}

impl<S> FromRequestParts<S> for RequireDomainEditor
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = Extension::<UserContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        
        let Extension(domain) = Extension::<DomainContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::BAD_REQUEST)?;

        check_domain_permission(&user, domain.id, "editor")?;

        Ok(RequireDomainEditor(RequireDomainRole { user, domain }))
    }
}

impl<S> FromRequestParts<S> for RequireDomainAdmin
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = Extension::<UserContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        
        let Extension(domain) = Extension::<DomainContext>::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::BAD_REQUEST)?;

        check_domain_permission(&user, domain.id, "admin")?;

        Ok(RequireDomainAdmin(RequireDomainRole { user, domain }))
    }
}
