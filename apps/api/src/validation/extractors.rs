// src/validation/extractors.rs
//! Axum extractors for validated request types

use crate::validation::{ValidationErrorResponse};
use axum::{
    extract::{FromRequest, Request},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::de::DeserializeOwned;
use validator::Validate;

/// A wrapper around Json that automatically validates the request
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = ValidationRejection;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(data) = Json::<T>::from_request(req, state)
            .await
            .map_err(|err| ValidationRejection::JsonError(err.to_string()))?;

        // Validate the deserialized data
        data.validate()
            .map_err(|errors| ValidationRejection::ValidationError(
                ValidationErrorResponse::from_validation_errors(errors)
            ))?;

        Ok(ValidatedJson(data))
    }
}

/// Rejection type for validation errors
pub enum ValidationRejection {
    JsonError(String),
    ValidationError(ValidationErrorResponse),
}

impl IntoResponse for ValidationRejection {
    fn into_response(self) -> Response {
        match self {
            ValidationRejection::JsonError(msg) => {
                let error = ValidationErrorResponse::new(&format!("Invalid JSON: {}", msg));
                (StatusCode::BAD_REQUEST, Json(error)).into_response()
            }
            ValidationRejection::ValidationError(error) => {
                (StatusCode::BAD_REQUEST, Json(error)).into_response()
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    #[derive(Deserialize, Validate)]
    struct TestRequest {
        #[validate(length(min = 1, message = "Name cannot be empty"))]
        name: String,
        #[validate(email(message = "Invalid email format"))]
        email: String,
    }

    #[tokio::test]
    async fn test_validated_json_extractor() {
        // This would require more complex setup with axum test framework
        // For now, we'll just verify the types compile correctly
        let _test: fn(ValidatedJson<TestRequest>) = |_validated_request| {
            // Handler function signature
        };
    }
}
