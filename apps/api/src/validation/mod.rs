// src/validation/mod.rs
//! Input validation utilities for the multi-blog API
//! 
//! This module provides validation rules and utilities for all request types.
//! It uses the `validator` crate for standardized validation with custom error messages.

pub mod rules;
pub mod extractors;
pub mod custom;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::{Validate, ValidationErrors};

/// Standard validation error response
#[derive(Serialize, Debug)]
pub struct ValidationErrorResponse {
    pub error: String,
    pub message: String,
    pub field_errors: HashMap<String, Vec<String>>,
}

impl ValidationErrorResponse {
    pub fn new(message: &str) -> Self {
        Self {
            error: "validation_error".to_string(),
            message: message.to_string(),
            field_errors: HashMap::new(),
        }
    }

    pub fn from_validation_errors(errors: ValidationErrors) -> Self {
        let mut field_errors = HashMap::new();
        
        for (field, field_errors_vec) in errors.field_errors() {
            let error_messages: Vec<String> = field_errors_vec
                .iter()
                .map(|error| {
                    error
                        .message
                        .as_ref()
                        .map(|msg| msg.to_string())
                        .unwrap_or_else(|| format!("Invalid value for field '{}'", field))
                })
                .collect();
            field_errors.insert(field.to_string(), error_messages);
        }

        Self {
            error: "validation_error".to_string(),
            message: "Request validation failed".to_string(),
            field_errors,
        }
    }
}

/// Trait for validating request structures
pub trait ValidatedRequest: for<'de> Deserialize<'de> + Validate {
    /// Validate the request and return detailed errors if validation fails
    fn validate_request(&self) -> Result<(), ValidationErrorResponse> {
        match self.validate() {
            Ok(()) => Ok(()),
            Err(errors) => Err(ValidationErrorResponse::from_validation_errors(errors)),
        }
    }
}

// Implement ValidatedRequest for any type that implements Deserialize + Validate
impl<T> ValidatedRequest for T where T: for<'de> Deserialize<'de> + Validate {}

#[cfg(test)]
mod tests {
    use super::*;
    use validator::Validate;
    use serde::Deserialize;

    #[derive(Deserialize, Validate)]
    struct TestRequest {
        #[validate(length(min = 1, message = "Name cannot be empty"))]
        name: String,
        #[validate(email(message = "Invalid email format"))]
        email: String,
    }

    #[test]
    fn test_validation_error_response() {
        let request = TestRequest {
            name: "".to_string(),
            email: "invalid-email".to_string(),
        };

        let result = request.validate_request();
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert_eq!(error.error, "validation_error");
        assert_eq!(error.message, "Request validation failed");
        assert!(error.field_errors.contains_key("name"));
        assert!(error.field_errors.contains_key("email"));
    }
}
