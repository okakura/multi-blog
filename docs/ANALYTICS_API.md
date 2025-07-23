# Analytics API Documentation

This document provides comprehensive documentation for the analytics system implemented in the multi-blog platform.

## Overview

The analytics system provides detailed insights into user behavior, content performance, search patterns, and overall site engagement. It consists of two main components:

1. **Analytics Dashboard APIs** - Authenticated endpoints for viewing analytics data
2. **Behavior Tracking APIs** - Public endpoints for collecting user interaction data

## Database Schema

The analytics system uses four main tables for behavior tracking:

### behavior_events
Tracks user interactions like clicks, scrolls, and mouse movements.
```sql
CREATE TABLE behavior_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL REFERENCES user_sessions(session_id),
    event_type VARCHAR NOT NULL,
    element VARCHAR,
    x DECIMAL,
    y DECIMAL,
    scroll_depth DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### search_events
Tracks search queries and their results.
```sql
CREATE TABLE search_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL REFERENCES user_sessions(session_id),
    query VARCHAR NOT NULL,
    results_count INTEGER NOT NULL,
    no_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### search_click_events
Tracks clicks on search results.
```sql
CREATE TABLE search_click_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL REFERENCES user_sessions(session_id),
    query VARCHAR NOT NULL,
    clicked_result VARCHAR NOT NULL,
    position_clicked INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### content_metrics
Tracks detailed content engagement metrics.
```sql
CREATE TABLE content_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL REFERENCES user_sessions(session_id),
    content_id VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    reading_time INTEGER NOT NULL,
    scroll_percentage DECIMAL NOT NULL,
    time_on_page INTEGER NOT NULL,
    bounce BOOLEAN NOT NULL,
    engagement_events INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Analytics Dashboard APIs

All dashboard endpoints require authentication via JWT token in the Authorization header.

### GET /analytics/dashboard

Returns a comprehensive analytics dashboard with overview, behavior, search, and content metrics.

**Query Parameters:**
- `range` (optional): "24h", "7d", "30d" - Predefined time ranges
- `days` (optional): Integer 1-365 - Number of days to look back
- `start_date` (optional): ISO 8601 date string - Custom start date
- `end_date` (optional): ISO 8601 date string - Custom end date
- `domain_id` (optional): Integer - Filter by specific domain (admin/super admin only)

**Response:**
```json
{
  "overview": {
    "total_sessions": 1250,
    "total_page_views": 4890,
    "avg_session_duration": 185.5,
    "bounce_rate": 42.3,
    "unique_visitors": 892,
    "previous_period": {
      "page_views": 3240,
      "unique_visitors": 678,
      "post_views": 1450,
      "searches": 234,
      "avg_session_duration": 167.2
    },
    "change_percent": {
      "page_views": 50.9,
      "unique_visitors": 31.6,
      "post_views": 28.3,
      "searches": 45.7
    }
  },
  "behavior": {
    "top_clicked_elements": [
      {"element": "nav-menu", "clicks": 342},
      {"element": "read-more-btn", "clicks": 289},
      {"element": "share-button", "clicks": 156}
    ],
    "scroll_depth_distribution": [
      {"depth": 25, "percentage": 85.2},
      {"depth": 50, "percentage": 67.8},
      {"depth": 75, "percentage": 45.3},
      {"depth": 90, "percentage": 28.9}
    ],
    "engagement_score_avg": 6.8
  },
  "search": {
    "top_queries": [
      {"query": "rust tutorial", "count": 45, "results_avg": 8.5},
      {"query": "web development", "count": 38, "results_avg": 12.3}
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
  },
  "top_posts": [
    {
      "id": 123,
      "title": "Advanced Rust Programming",
      "slug": "advanced-rust-programming",
      "views": 1250,
      "unique_views": 892
    }
  ],
  "top_categories": [
    {
      "category": "Programming",
      "views": 3450,
      "posts_count": 12
    }
  ]
}
```

### GET /analytics/traffic

Returns detailed traffic statistics with daily/hourly breakdown and device information.

**Query Parameters:** Same as dashboard endpoint

**Response:**
```json
{
  "daily_stats": [
    {
      "date": "2024-01-15",
      "page_views": 234,
      "unique_visitors": 156,
      "post_views": 89
    }
  ],
  "hourly_distribution": [
    {
      "hour": 9,
      "page_views": 45,
      "unique_visitors": 32
    }
  ],
  "device_breakdown": {
    "mobile": 567,
    "desktop": 423,
    "tablet": 89,
    "unknown": 12
  }
}
```

### GET /analytics/posts

Returns post-specific analytics with views, engagement, and performance metrics.

**Response:**
```json
{
  "posts": [
    {
      "id": 123,
      "title": "Getting Started with Rust",
      "slug": "getting-started-rust",
      "category": "Programming",
      "views": 1250,
      "unique_views": 892,
      "avg_days_to_view": 3.4
    }
  ]
}
```

### GET /analytics/search-terms

Returns search analytics with popular terms and volume trends.

**Response:**
```json
{
  "popular_terms": [
    {
      "query": "rust programming",
      "count": 45,
      "results_found": true
    }
  ],
  "search_volume_trend": [
    {
      "date": "2024-01-15",
      "searches": 23
    }
  ],
  "no_results_queries": []
}
```

### GET /analytics/referrers

Returns referrer statistics with source breakdown.

**Response:**
```json
{
  "top_referrers": [
    {
      "referrer": "google.com",
      "visits": 234,
      "unique_visitors": 156
    }
  ],
  "referrer_types": {
    "direct": 456,
    "search_engines": 234,
    "social_media": 89,
    "other_websites": 67
  }
}
```

### GET /analytics/real-time

Returns real-time visitor data and current activity.

**Response:**
```json
{
  "active_visitors": 23,
  "page_views_last_hour": 156,
  "top_pages_now": [
    {
      "path": "/posts/rust-tutorial",
      "active_visitors": 8
    }
  ],
  "recent_events": [
    {
      "event_type": "page_view",
      "path": "/posts/advanced-rust",
      "timestamp": "2024-01-15T14:30:00Z",
      "ip_address": "192.168.1.XXX",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

### GET /analytics/export

Returns analytics data as CSV format for export.

**Query Parameters:** Same as dashboard endpoint

**Response:** CSV file with headers: `Domain,Event Type,Path,IP Address,User Agent,Referrer,Timestamp`

## Behavior Tracking APIs

These endpoints are public and do not require authentication, allowing client-side tracking.

### POST /analytics/behavior

Track user behavior events like clicks, scrolls, and mouse movements.

**Request Body:**
```json
{
  "event_type": "click",          // Required: "click", "scroll", "mousemove", etc.
  "element": "read-more-btn",     // Optional: DOM element identifier
  "x": 450.5,                     // Optional: X coordinate
  "y": 320.8,                     // Optional: Y coordinate
  "scroll_depth": 45.2,           // Optional: Scroll percentage (0-100)
  "timestamp": "2024-01-15T14:30:00Z",  // Required: ISO 8601 timestamp
  "session_id": "sess_abc123"     // Required: Session identifier
}
```

**Response:** `200 OK` or `500 Internal Server Error`

### POST /analytics/search

Track search queries and their results.

**Request Body:**
```json
{
  "query": "rust programming",    // Required: Search query string
  "results_count": 12,            // Required: Number of results found
  "no_results": false,            // Optional: Whether search returned no results
  "timestamp": "2024-01-15T14:30:00Z",  // Required: ISO 8601 timestamp
  "session_id": "sess_abc123"     // Required: Session identifier
}
```

**Response:** `200 OK` or `500 Internal Server Error`

### POST /analytics/search-click

Track clicks on search results.

**Request Body:**
```json
{
  "query": "rust programming",              // Required: Original search query
  "clicked_result": "Getting Started with Rust",  // Required: Title/identifier of clicked result
  "position_clicked": 2,                    // Optional: Position in search results (1-based)
  "timestamp": "2024-01-15T14:30:00Z",     // Required: ISO 8601 timestamp
  "session_id": "sess_abc123"              // Required: Session identifier
}
```

**Response:** `200 OK` or `500 Internal Server Error`

### POST /analytics/content-metrics

Track detailed content engagement metrics.

**Request Body:**
```json
{
  "content_id": "post_123",       // Required: Unique content identifier
  "content_type": "blog_post",    // Required: Type of content
  "title": "Advanced Rust Patterns",  // Required: Content title
  "reading_time": 420,            // Required: Time spent reading (seconds)
  "scroll_percentage": 85.6,      // Required: Maximum scroll depth (0-100)
  "time_on_page": 380,           // Required: Total time on page (seconds)
  "bounce": false,               // Required: Whether user bounced
  "engagement_events": 7,        // Required: Number of engagement events
  "session_id": "sess_abc123",   // Required: Session identifier
  "timestamp": "2024-01-15T14:30:00Z"  // Required: ISO 8601 timestamp
}
```

**Response:** `200 OK` or `500 Internal Server Error`

## Implementation Examples

### Client-Side JavaScript

```javascript
// Initialize session tracking
const sessionId = generateSessionId(); // Your session ID logic

// Track behavior events
function trackBehavior(eventType, element = null, coords = null) {
  fetch('/analytics/behavior', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      element: element,
      x: coords?.x,
      y: coords?.y,
      scroll_depth: getScrollPercentage(),
      timestamp: new Date().toISOString(),
      session_id: sessionId
    })
  });
}

// Track search
function trackSearch(query, resultsCount) {
  fetch('/analytics/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      results_count: resultsCount,
      no_results: resultsCount === 0,
      timestamp: new Date().toISOString(),
      session_id: sessionId
    })
  });
}

// Track content metrics when user leaves page
function trackContentMetrics(contentId, title) {
  const metrics = calculateEngagementMetrics(); // Your calculation logic
  
  fetch('/analytics/content-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_id: contentId,
      content_type: 'blog_post',
      title: title,
      reading_time: metrics.readingTime,
      scroll_percentage: metrics.maxScroll,
      time_on_page: metrics.timeOnPage,
      bounce: metrics.bounced,
      engagement_events: metrics.engagementCount,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    })
  });
}
```

## Error Handling

All analytics endpoints return appropriate HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication (dashboard endpoints only)
- `403 Forbidden` - Insufficient permissions for requested domain
- `500 Internal Server Error` - Server-side error

Error responses include descriptive messages for debugging.

## Performance Considerations

- All tracking tables include proper indexes for performance
- Behavior tracking endpoints are optimized for high throughput
- Analytics queries use efficient aggregations and filtering
- Session data is automatically cleaned up for privacy compliance

## Privacy & Compliance

- IP addresses are partially masked in exports (`192.168.1.XXX`)
- Session tracking includes bot detection
- All tracking respects user privacy settings
- Data retention policies can be configured per domain
