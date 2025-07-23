# Multi-Blog API

A multi-tenant blog platform API built with Rust, Axum, and PostgreSQL.

## Features

- **Multi-tenant architecture**: Support for multiple blog domains/subdomains
- **Domain-based routing**: Automatic domain detection and context switching
- **Role-based permissions**: Admin, editor, and viewer roles per domain
- **Comprehensive analytics**: Built-in analytics with behavior tracking, search analytics, and content engagement metrics
- **Real-time tracking**: Track user interactions, clicks, scrolls, search queries, and content consumption
- **Session management**: Advanced session tracking with device detection and engagement scoring
- **RESTful API**: Clean REST endpoints for blog management
- **Authentication**: JWT-based authentication with role-based access control

## API Endpoints

### Public Blog Routes

- `GET /` - Homepage with recent posts
- `GET /posts` - List all published posts (with pagination)
- `GET /posts/:slug` - Get specific post by slug
- `GET /category/:category` - Get posts by category
- `GET /search?q=term` - Search posts
- `GET /feed.xml` - RSS feed

### Admin Routes (Auth Required)

- `GET /admin/posts` - List all posts (including drafts)
- `POST /admin/posts` - Create new post
- `GET /admin/posts/:id` - Get post by ID
- `PUT /admin/posts/:id` - Update post
- `DELETE /admin/posts/:id` - Delete post
- `GET /admin/analytics` - Get analytics summary
- `GET /admin/domain/settings` - Get domain settings
- `PUT /admin/domain/settings` - Update domain settings

### Analytics Routes (Auth Required)

#### Analytics Dashboard & Reports
- `GET /analytics/dashboard` - Complete analytics dashboard with overview, behavior, search, and content metrics
- `GET /analytics/traffic` - Traffic statistics with daily/hourly breakdown and device info
- `GET /analytics/posts` - Post analytics with views, unique views, and performance metrics
- `GET /analytics/search-terms` - Search analytics with popular terms and volume trends
- `GET /analytics/referrers` - Referrer statistics with type breakdown (direct, search, social)
- `GET /analytics/real-time` - Real-time visitor data and active pages
- `GET /analytics/export` - Export analytics data as CSV

#### Behavior Tracking (Public Endpoints)
- `POST /analytics/behavior` - Track user behavior events (clicks, scrolls, mouse movements)
- `POST /analytics/search` - Track search events and query data
- `POST /analytics/search-click` - Track search result clicks and positions
- `POST /analytics/content-metrics` - Track content engagement (reading time, scroll depth, completion)

## Setup

1. **Database Setup**:

   ```bash
   # Install PostgreSQL and create database
   createdb multi_blog_dev

   # Set environment variable
   export DATABASE_URL="postgresql://user:password@localhost/multi_blog_dev"
   ```

2. **Run Migrations**:

   ```bash
   cargo install sqlx-cli
   sqlx migrate run
   ```

3. **Start the Server**:
   ```bash
   cargo run
   ```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing (optional, defaults to dev key)
- `RUST_LOG` - Log level (optional, defaults to info)

## Domain Configuration

The API supports multiple domains/subdomains. Each domain has its own:

- Theme configuration (colors, styling)
- Categories
- Posts
- Analytics
- User permissions

Example domains from the sample data:

- `tech.localhost` - Tech blog
- `lifestyle.localhost` - Lifestyle blog
- `business.localhost` - Business blog

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Note**: Behavior tracking endpoints (`/analytics/behavior`, `/analytics/search`, `/analytics/search-click`, `/analytics/content-metrics`) are public and do not require authentication to enable client-side tracking.

## Analytics & Behavior Tracking

### Dashboard Data Structure

The analytics dashboard provides comprehensive metrics:

```json
{
  "overview": {
    "total_sessions": 1250,
    "total_page_views": 4890,
    "avg_session_duration": 185.5,
    "bounce_rate": 42.3,
    "unique_visitors": 892,
    "previous_period": { /* comparison data */ },
    "change_percent": { /* percentage changes */ }
  },
  "behavior": {
    "top_clicked_elements": [
      {"element": "nav-menu", "clicks": 342},
      {"element": "read-more-btn", "clicks": 289}
    ],
    "scroll_depth_distribution": [
      {"depth": 25, "percentage": 85.2},
      {"depth": 50, "percentage": 67.8}
    ],
    "engagement_score_avg": 6.8
  },
  "search": {
    "top_queries": [
      {"query": "rust tutorial", "count": 45, "results_avg": 8.5}
    ],
    "no_results_rate": 0.12,
    "search_to_click_rate": 0.68
  },
  "content": {
    "top_content": [
      {
        "content_id": "123",
        "title": "Getting Started with Rust",
        "views": 1250,
        "avg_reading_time": 340,
        "engagement_score": 7.2
      }
    ],
    "avg_reading_time": 245,
    "content_completion_rate": 64.8
  }
}
```

### Behavior Tracking Endpoints

#### Track User Behavior Event
`POST /analytics/behavior`

Track user interactions like clicks, scrolls, and mouse movements:

```json
{
  "event_type": "click",
  "element": "read-more-btn",
  "x": 450.5,
  "y": 320.8,
  "scroll_depth": 45.2,
  "timestamp": "2024-01-15T14:30:00Z",
  "session_id": "sess_abc123"
}
```

#### Track Search Event
`POST /analytics/search`

Track search queries and results:

```json
{
  "query": "rust programming",
  "results_count": 12,
  "no_results": false,
  "timestamp": "2024-01-15T14:30:00Z",
  "session_id": "sess_abc123"
}
```

#### Track Search Click Event
`POST /analytics/search-click`

Track clicks on search results:

```json
{
  "query": "rust programming",
  "clicked_result": "Getting Started with Rust Programming",
  "position_clicked": 2,
  "timestamp": "2024-01-15T14:30:00Z",
  "session_id": "sess_abc123"
}
```

#### Track Content Metrics
`POST /analytics/content-metrics`

Track detailed content engagement:

```json
{
  "content_id": "post_123",
  "content_type": "blog_post",
  "title": "Advanced Rust Patterns",
  "reading_time": 420,
  "scroll_percentage": 85.6,
  "time_on_page": 380,
  "bounce": false,
  "engagement_events": 7,
  "session_id": "sess_abc123",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### Query Parameters

Most analytics endpoints support these query parameters:

- `range`: `"24h"`, `"7d"`, `"30d"` - Predefined time ranges
- `days`: Number of days to look back (1-365)
- `start_date`: Custom start date (ISO 8601)
- `end_date`: Custom end date (ISO 8601)
- `domain_id`: Filter by specific domain (admin users only)

Example: `GET /analytics/dashboard?range=7d&domain_id=1`

## Sample Data

The migration includes sample data:

- 3 domains (tech, lifestyle, business)
- Admin user (email: admin@example.com, password: admin123)
- Sample posts for each domain

## Architecture

The API is structured with:

- **Middleware**: Domain detection, analytics tracking, authentication
- **Handlers**: Modular route handlers (blog, admin, analytics)
- **Context**: Domain and user context passed through request pipeline
- **Database**: PostgreSQL with proper indexing for performance
