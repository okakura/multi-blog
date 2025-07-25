# Input Validation System

This document describes the comprehensive input validation system implemented for the multi-blog API.

## Overview

The validation system provides:

1. **Automatic validation** using the `validator` crate
2. **Custom validation rules** for domain-specific logic
3. **Axum extractors** for seamless integration with handlers
4. **Detailed error responses** with field-specific error messages

## Components

### 1. Validation Rules (`src/validation/rules.rs`)

Contains domain-specific validation functions:

- `validate_slug()` - Validates URL slugs (alphanumeric + hyphens)
- `validate_hostname()` - Validates domain hostnames
- `validate_user_role()` - Validates user role values
- `validate_domain_permission_role()` - Validates permission roles
- `validate_post_status()` - Validates post status values
- `validate_password_strength()` - Enforces strong password requirements
- `validate_post_content()` - Validates post content length
- `validate_category()` - Validates category names

### 2. Custom Validation (`src/validation/custom.rs`)

Manual validation implementations for complex structures that require multiple field validation.

### 3. Extractors (`src/validation/extractors.rs`)

Provides `ValidatedJson<T>` extractor that automatically validates request bodies.

## Usage Examples

### Basic Usage with ValidatedJson

```rust
use crate::validation::extractors::ValidatedJson;

// Handler function
async fn create_post(
    auth: RequireDomainEditor,
    State(state): State<Arc<AppState>>,
    ValidatedJson(payload): ValidatedJson<CreatePostRequest>,
) -> Result<Json<PostResponse>, StatusCode> {
    // Input is automatically validated
    // Process the validated request...
}
```

### Request Structure with Validation

```rust
use validator::Validate;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Validate)]
struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    #[validate(length(min = 1, message = "Email is required"))]
    email: String,
    
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    name: String,
    
    #[validate(custom(function = "validate_password_strength", message = "Password does not meet security requirements"))]
    password: String,
}
```

### Custom Validation Implementation

For complex validation logic, implement the `Validate` trait manually:

```rust
impl Validate for CreatePostRequest {
    fn validate(&self) -> Result<(), validator::ValidationErrors> {
        crate::validation::custom::validate_create_post_request(
            &self.title,
            &self.content,
            &self.category,
            &self.slug,
            &self.status,
        )
    }
}
```

## Validation Rules

### Password Requirements

Passwords must:
- Be at least 8 characters long
- Be no more than 128 characters long
- Contain at least 3 of the following:
  - Lowercase letters
  - Uppercase letters
  - Numbers
  - Special characters (`!@#$%^&*()_+-=[]{}|;:,.<>?`)

### Slug Format

Slugs must:
- Contain only letters, numbers, and hyphens
- Not start or end with hyphens
- Not contain consecutive hyphens
- Not be empty

### Hostname Format

Hostnames must:
- Follow standard domain name format
- Be no more than 253 characters
- Not be empty

### Content Validation

Post content must:
- Not be empty (after trimming)
- Be no more than 100,000 characters

## Error Responses

Validation errors return structured responses:

```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "field_errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters long"]
  }
}
```

## Testing

Run validation tests:

```bash
cargo test validation
```

The validation system includes comprehensive tests for all validation rules and error handling.

## Benefits

1. **Security**: Prevents invalid data from entering the system
2. **User Experience**: Provides clear, actionable error messages
3. **Maintainability**: Centralized validation logic
4. **Type Safety**: Compile-time guarantees about request structure
5. **Consistency**: Uniform validation across all endpoints

## Future Enhancements

- Rate limiting per validation failure
- Internationalization of error messages
- More granular validation rules
- Integration with OpenAPI schema generation
