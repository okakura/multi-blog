// src/validation/custom.rs
//! Custom validation implementations for complex structures

use crate::validation::rules::*;
use validator::{ValidationError, ValidationErrors};

/// Manual validation implementation for CreatePostRequest
pub fn validate_create_post_request(
    title: &str,
    content: &str,
    category: &str,
    slug: &Option<String>,
    status: &Option<String>,
) -> Result<(), ValidationErrors> {
    let mut errors = ValidationErrors::new();

    // Validate title
    if title.trim().is_empty() || title.len() > 200 {
        let mut error = ValidationError::new("length");
        error.message = Some("Title must be between 1 and 200 characters".into());
        errors.add("title", error);
    }

    // Validate content
    if let Err(error) = validate_post_content(content) {
        errors.add("content", error);
    }

    // Validate category
    if let Err(error) = validate_category(category) {
        errors.add("category", error);
    }

    // Validate slug if provided
    if let Some(slug_value) = slug {
        if let Err(error) = validate_slug(slug_value) {
            errors.add("slug", error);
        }
    }

    // Validate status if provided
    if let Some(status_value) = status {
        if let Err(error) = validate_post_status(status_value) {
            errors.add("status", error);
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Manual validation implementation for UpdateDomainRequest
pub fn validate_update_domain_request(
    hostname: &Option<String>,
    name: &Option<String>,
) -> Result<(), ValidationErrors> {
    let mut errors = ValidationErrors::new();

    // Validate hostname if provided
    if let Some(hostname_value) = hostname {
        if let Err(error) = validate_hostname(hostname_value) {
            errors.add("hostname", error);
        }
    }

    // Validate name if provided
    if let Some(name_value) = name {
        if name_value.trim().is_empty() || name_value.len() > 100 {
            let mut error = ValidationError::new("length");
            error.message = Some("Name must be between 1 and 100 characters".into());
            errors.add("name", error);
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Manual validation implementation for UpdateUserRequest
pub fn validate_update_user_request(
    email: &Option<String>,
    name: &Option<String>,
    password: &Option<String>,
    role: &Option<String>,
) -> Result<(), ValidationErrors> {
    let mut errors = ValidationErrors::new();

    // Validate email if provided
    if let Some(email_value) = email {
        if !email_value.contains('@') || email_value.trim().is_empty() {
            let mut error = ValidationError::new("email");
            error.message = Some("Invalid email format".into());
            errors.add("email", error);
        }
    }

    // Validate name if provided
    if let Some(name_value) = name {
        if name_value.trim().is_empty() || name_value.len() > 100 {
            let mut error = ValidationError::new("length");
            error.message = Some("Name must be between 1 and 100 characters".into());
            errors.add("name", error);
        }
    }

    // Validate password if provided
    if let Some(password_value) = password {
        if let Err(error) = validate_password_strength(password_value) {
            errors.add("password", error);
        }
    }

    // Validate role if provided
    if let Some(role_value) = role {
        if let Err(error) = validate_user_role(role_value) {
            errors.add("role", error);
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}
