# API Configuration

This document describe# API Configuration

This document describes the centralized API configuration system for the multi-blog application.

## Overview

The API configuration is centralized in `src/config/dev.ts` to eliminate hardcoded URLs and provide a flexible system for different environments.

## Configuration Structure

### DEV_CONFIG

- `USE_MOCK_API`: Toggle between mock and real API (currently false for real backend)
- `BACKEND_URL`: Base URL for the API server (supports environment variable override)
- `MOCK_DELAY`: Simulated network delay for mock responses
- `DEBUG_API`: Enable debug logging in development

### API_CONFIG

Defines all API endpoints in a nested structure:

- `BASE_URL`: Resolves to the appropriate backend URL
- `ENDPOINTS`: Organized by service area (AUTH, ADMIN, ANALYTICS, BLOG, etc.)

## Environment Variables

You can override the API URL using environment variables:

```bash
# .env.local
REACT_APP_API_URL=https://your-production-api.com
```

For development, copy `.env.example` to `.env.local` and adjust as needed.

## Usage

### In Services

```typescript
import { buildApiUrl, API_CONFIG } from '../config/dev'

// Build URLs using the helper function
const url = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN)
// Results in: http://localhost:8000/auth/login

// For analytics endpoints
const analyticsUrl = buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.OVERVIEW)
// Results in: http://localhost:8000/analytics/overview
```

### Adding New Endpoints

1. Add the endpoint path to the appropriate section in `API_CONFIG.ENDPOINTS`
2. Use `buildApiUrl()` in your service to construct the full URL
3. Follow the existing pattern for consistency

## Endpoint Structure

### Backend Route Mapping

- **Auth**: `/auth/*` (login, logout, register)
- **Admin**: `/admin/*` (user management, domains, settings)
- **Analytics**: `/analytics/*` (overview, traffic, posts, search-terms, referrers)
- **Blog**: `/*` (public blog content)

### Frontend Configuration

```typescript
API_CONFIG.ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    // ...
  },
  ADMIN: {
    USERS: '/admin/users',
    POSTS: '/admin/posts',
    // ...
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    TRAFFIC: '/analytics/traffic',
    POSTS: '/analytics/posts',
    // ...
  },
}
```

## Benefits

- **Environment Flexibility**: Easy switching between development, staging, and production
- **Maintainability**: Single source of truth for all API endpoints
- **Type Safety**: TypeScript support for endpoint definitions
- **Debug Support**: Built-in logging capabilities
- **No Hardcoding**: Eliminates scattered URL strings throughout the codebase
- **Route Consistency**: Frontend routes match backend endpoint structure

## Environments

### Development

- Default: `http://localhost:8000`
- Override with `REACT_APP_API_URL` environment variable

### Production

- Set `REACT_APP_API_URL` to your production API domain
- Debug logging automatically disabled

## Troubleshooting

### Common Issues

1. **`process is not defined` Error**

   - Fixed by using browser-safe environment variable access
   - The config automatically detects development vs production

2. **404 Not Found on Analytics**

   - Analytics endpoints moved from `/admin/analytics/*` to `/analytics/*`
   - Update imports to use `API_CONFIG.ENDPOINTS.ANALYTICS.*`

3. **HTML response instead of JSON**
   - Usually indicates the backend endpoint doesn't exist
   - Check that the backend API is running on the correct port
   - Verify the endpoint path matches the backend route structure

## Migration

When adding new API calls:

1. Define the endpoint in `API_CONFIG.ENDPOINTS`
2. Use `buildApiUrl()` to construct URLs
3. Never hardcode URLs in service files
4. Test both development and production environments the centralized API configuration system for the multi-blog application.

## Overview

The API configuration is centralized in `src/config/dev.ts` to eliminate hardcoded URLs and provide a flexible system for different environments.

## Configuration Structure

### DEV_CONFIG

- `USE_MOCK_API`: Toggle between mock and real API (currently false for real backend)
- `BACKEND_URL`: Base URL for the API server (supports environment variable override)
- `MOCK_DELAY`: Simulated network delay for mock responses
- `DEBUG_API`: Enable debug logging in development

### API_CONFIG

Defines all API endpoints in a nested structure:

- `BASE_URL`: Resolves to the appropriate backend URL
- `ENDPOINTS`: Organized by service area (AUTH, ADMIN, BLOG, etc.)

## Environment Variables

You can override the API URL using environment variables:

```bash
# .env.local
REACT_APP_API_URL=https://your-production-api.com
```

For development, copy `.env.example` to `.env.local` and adjust as needed.

## Usage

### In Services

```typescript
import { buildApiUrl, API_CONFIG } from '../config/dev'

// Build URLs using the helper function
const url = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN)
// Results in: http://localhost:8000/auth/login

// For nested endpoints
const analyticsUrl = buildApiUrl(
  API_CONFIG.ENDPOINTS.ADMIN.ANALYTICS.POSTS_OVER_TIME
)
// Results in: http://localhost:8000/admin/analytics/posts-over-time
```

### Adding New Endpoints

1. Add the endpoint path to the appropriate section in `API_CONFIG.ENDPOINTS`
2. Use `buildApiUrl()` in your service to construct the full URL
3. Follow the existing pattern for consistency

## Benefits

- **Environment Flexibility**: Easy switching between development, staging, and production
- **Maintainability**: Single source of truth for all API endpoints
- **Type Safety**: TypeScript support for endpoint definitions
- **Debug Support**: Built-in logging capabilities
- **No Hardcoding**: Eliminates scattered URL strings throughout the codebase

## Environments

### Development

- Default: `http://localhost:8000`
- Override with `REACT_APP_API_URL` environment variable

### Production

- Set `REACT_APP_API_URL` to your production API domain
- Debug logging automatically disabled

## Migration

When adding new API calls:

1. Define the endpoint in `API_CONFIG.ENDPOINTS`
2. Use `buildApiUrl()` to construct URLs
3. Never hardcode URLs in service files
