// src/validation/rules.rs
//! Custom validation rules for the multi-blog API

use regex::Regex;
use validator::ValidationError;

/// Validate that a slug contains only alphanumeric characters and hyphens
pub fn validate_slug(slug: &str) -> Result<(), ValidationError> {
    let slug_regex = Regex::new(r"^[a-zA-Z0-9\-]+$").unwrap();

    if slug.is_empty() {
        return Err(ValidationError::new("Slug cannot be empty"));
    }

    if !slug_regex.is_match(slug) {
        return Err(ValidationError::new(
            "Slug can only contain letters, numbers, and hyphens",
        ));
    }

    if slug.starts_with('-') || slug.ends_with('-') {
        return Err(ValidationError::new(
            "Slug cannot start or end with a hyphen",
        ));
    }

    if slug.contains("--") {
        return Err(ValidationError::new(
            "Slug cannot contain consecutive hyphens",
        ));
    }

    Ok(())
}

/// Validate optional slug - used for Option<String> fields
pub fn validate_slug_option(slug_opt: &Option<String>) -> Result<(), ValidationError> {
    if let Some(slug) = slug_opt {
        validate_slug(slug)
    } else {
        Ok(())
    }
}

/// Validate hostname format (basic domain validation)
pub fn validate_hostname(hostname: &str) -> Result<(), ValidationError> {
    let hostname_regex = Regex::new(r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$").unwrap();

    if hostname.is_empty() {
        return Err(ValidationError::new("Hostname cannot be empty"));
    }

    if hostname.len() > 253 {
        return Err(ValidationError::new(
            "Hostname is too long (max 253 characters)",
        ));
    }

    if !hostname_regex.is_match(hostname) {
        return Err(ValidationError::new("Invalid hostname format"));
    }

    Ok(())
}

/// Validate optional hostname - used for Option<String> fields
pub fn validate_hostname_option(hostname_opt: &Option<String>) -> Result<(), ValidationError> {
    if let Some(hostname) = hostname_opt {
        validate_hostname(hostname)
    } else {
        Ok(())
    }
}

/// Validate user role
pub fn validate_user_role(role: &str) -> Result<(), ValidationError> {
    match role {
        "platform_admin" | "domain_user" => Ok(()),
        _ => Err(ValidationError::new(
            "Role must be either 'platform_admin' or 'domain_user'",
        )),
    }
}

/// Validate optional user role - used for Option<String> fields
pub fn validate_user_role_option(role_opt: &Option<String>) -> Result<(), ValidationError> {
    if let Some(role) = role_opt {
        validate_user_role(role)
    } else {
        Ok(())
    }
}

/// Validate domain permission role
pub fn validate_domain_permission_role(role: &str) -> Result<(), ValidationError> {
    match role {
        "admin" | "editor" | "viewer" | "none" => Ok(()),
        _ => Err(ValidationError::new(
            "Domain role must be 'admin', 'editor', 'viewer', or 'none'",
        )),
    }
}

/// Validate post status
pub fn validate_post_status(status: &str) -> Result<(), ValidationError> {
    match status {
        "draft" | "published" | "archived" => Ok(()),
        _ => Err(ValidationError::new(
            "Status must be 'draft', 'published', or 'archived'",
        )),
    }
}

/// Validate optional post status - used for Option<String> fields
pub fn validate_post_status_option(status_opt: &Option<String>) -> Result<(), ValidationError> {
    if let Some(status) = status_opt {
        validate_post_status(status)
    } else {
        Ok(())
    }
}

/// Validate password strength
pub fn validate_password_strength(password: &str) -> Result<(), ValidationError> {
    if password.len() < 8 {
        return Err(ValidationError::new(
            "Password must be at least 8 characters long",
        ));
    }

    if password.len() > 128 {
        return Err(ValidationError::new(
            "Password is too long (max 128 characters)",
        ));
    }

    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password
        .chars()
        .any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));

    let strength_count = [has_lowercase, has_uppercase, has_digit, has_special]
        .iter()
        .filter(|&&x| x)
        .count();

    if strength_count < 3 {
        return Err(ValidationError::new(
            "Password must contain at least 3 of: lowercase letter, uppercase letter, number, special character",
        ));
    }

    Ok(())
}

/// Validate optional password strength - used for Option<String> fields
pub fn validate_password_strength_option(
    password_opt: &Option<String>,
) -> Result<(), ValidationError> {
    if let Some(password) = password_opt {
        validate_password_strength(password)
    } else {
        Ok(())
    }
}

/// Validate content length for posts
pub fn validate_post_content(content: &str) -> Result<(), ValidationError> {
    if content.trim().is_empty() {
        return Err(ValidationError::new("Post content cannot be empty"));
    }

    if content.len() > 100_000 {
        return Err(ValidationError::new(
            "Post content is too long (max 100,000 characters)",
        ));
    }

    Ok(())
}

/// Validate category name
pub fn validate_category(category: &str) -> Result<(), ValidationError> {
    if category.trim().is_empty() {
        return Err(ValidationError::new("Category cannot be empty"));
    }

    if category.len() > 50 {
        return Err(ValidationError::new(
            "Category name is too long (max 50 characters)",
        ));
    }

    let category_regex = Regex::new(r"^[a-zA-Z0-9\s\-_]+$").unwrap();
    if !category_regex.is_match(category) {
        return Err(ValidationError::new(
            "Category can only contain letters, numbers, spaces, hyphens, and underscores",
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_slug() {
        assert!(validate_slug("valid-slug-123").is_ok());
        assert!(validate_slug("").is_err());
        assert!(validate_slug("-invalid").is_err());
        assert!(validate_slug("invalid-").is_err());
        assert!(validate_slug("invalid--slug").is_err());
        assert!(validate_slug("invalid@slug").is_err());
    }

    #[test]
    fn test_validate_hostname() {
        assert!(validate_hostname("example.com").is_ok());
        assert!(validate_hostname("sub.example.com").is_ok());
        assert!(validate_hostname("").is_err());
        assert!(validate_hostname("invalid..com").is_err());
    }

    #[test]
    fn test_validate_password_strength() {
        assert!(validate_password_strength("Password123!").is_ok());
        assert!(validate_password_strength("weak").is_err());
        assert!(validate_password_strength("password").is_err());
        assert!(validate_password_strength("PASSWORD").is_err());
        assert!(validate_password_strength("Password123").is_ok()); // 3 character types
    }

    #[test]
    fn test_validate_user_role() {
        assert!(validate_user_role("platform_admin").is_ok());
        assert!(validate_user_role("domain_user").is_ok());
        assert!(validate_user_role("invalid_role").is_err());
    }

    #[test]
    fn test_validate_domain_permission_role() {
        assert!(validate_domain_permission_role("admin").is_ok());
        assert!(validate_domain_permission_role("editor").is_ok());
        assert!(validate_domain_permission_role("viewer").is_ok());
        assert!(validate_domain_permission_role("none").is_ok());
        assert!(validate_domain_permission_role("invalid").is_err());
    }
}
