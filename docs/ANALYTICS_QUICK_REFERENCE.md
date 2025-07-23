# Analytics System Quick Reference

## Overview

The multi-blog platform includes a comprehensive analytics system with real-time behavior tracking and detailed reporting capabilities.

## Key Features

✅ **Real-time User Behavior Tracking**
- Click tracking with element identification
- Scroll depth measurement
- Mouse movement tracking
- Session engagement scoring

✅ **Search Analytics**
- Query tracking with result counts
- Search-to-click conversion rates
- No-results query identification

✅ **Content Performance Metrics**
- Reading time calculation
- Content completion rates
- Engagement event counting
- Bounce rate analysis

✅ **Comprehensive Dashboard**
- Multi-domain analytics support
- Time-range filtering (24h, 7d, 30d, custom)
- Period-over-period comparisons
- Real-time visitor monitoring

## Database Tables

| Table | Purpose | Key Metrics |
|-------|---------|-------------|
| `behavior_events` | User interactions | Clicks, scrolls, coordinates |
| `search_events` | Search queries | Query strings, result counts |
| `search_click_events` | Search result clicks | Click positions, result titles |
| `content_metrics` | Content engagement | Reading time, scroll depth, completion |
| `user_sessions` | Session tracking | Duration, page views, device info |

## API Endpoints

### Dashboard (Auth Required)
```
GET /analytics/dashboard      # Complete analytics overview
GET /analytics/traffic        # Traffic stats with device breakdown
GET /analytics/posts          # Post performance metrics
GET /analytics/search-terms   # Search analytics
GET /analytics/referrers      # Referrer source analysis
GET /analytics/real-time      # Live visitor data
GET /analytics/export         # CSV data export
```

### Tracking (Public)
```
POST /analytics/behavior        # User behavior events
POST /analytics/search          # Search queries
POST /analytics/search-click    # Search result clicks
POST /analytics/content-metrics # Content engagement
```

## Query Parameters

All dashboard endpoints support:
- `range`: "24h", "7d", "30d"
- `days`: 1-365 (custom day count)
- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date
- `domain_id`: Domain filter (admin only)

## Client Integration

### Basic Tracking Setup
```javascript
// Initialize session
const sessionId = generateSessionId();

// Track page interactions
document.addEventListener('click', (e) => {
  trackBehavior('click', e.target.id, { x: e.clientX, y: e.clientY });
});

// Track scroll depth
window.addEventListener('scroll', () => {
  const scrollDepth = (window.scrollY / document.body.scrollHeight) * 100;
  trackBehavior('scroll', null, null, scrollDepth);
});
```

### Search Tracking
```javascript
function handleSearch(query, results) {
  // Track the search
  trackSearch(query, results.length);
  
  // Track result clicks
  results.forEach((result, index) => {
    result.addEventListener('click', () => {
      trackSearchClick(query, result.title, index + 1);
    });
  });
}
```

### Content Metrics
```javascript
// Track when user finishes reading
window.addEventListener('beforeunload', () => {
  trackContentMetrics({
    content_id: 'post_123',
    content_type: 'blog_post',
    title: document.title,
    reading_time: calculateReadingTime(),
    scroll_percentage: getMaxScrollDepth(),
    time_on_page: getTimeOnPage(),
    bounce: checkIfBounced(),
    engagement_events: getEngagementCount()
  });
});
```

## Key Metrics Explained

**Engagement Score**: Calculated from session duration + page views
- 0-3: Low engagement (short visits, single page)
- 4-6: Medium engagement (moderate time, few pages)
- 7-10: High engagement (long sessions, multiple pages)

**Bounce Rate**: Percentage of single-page sessions lasting < 30 seconds

**Content Completion Rate**: Percentage of users who scroll ≥90% of content

**Search-to-Click Rate**: Percentage of searches that result in a click

## Performance Optimizations

- Indexed database tables for fast queries
- Aggregated analytics data for dashboard performance
- Efficient session tracking with automatic cleanup
- Batch processing for high-volume tracking data

## Privacy & Security

- IP address masking in exports (`192.168.1.XXX`)
- Bot detection and filtering
- Session-based tracking (no personal data storage)
- Public tracking endpoints (no auth required for user privacy)
- Dashboard endpoints require proper authentication and permissions

## Migration Status

✅ Migration 007 applied - All behavior tracking tables created
✅ Analytics handlers implemented with real data storage
✅ Dashboard updated with live behavior metrics
✅ Session tracking enhanced with engagement scoring
✅ Frontend-ready tracking endpoints available

## Next Steps

1. **Frontend Integration**: Implement client-side tracking scripts
2. **Dashboard UI**: Build analytics dashboard components
3. **Real-time Updates**: Add WebSocket support for live data
4. **Data Retention**: Configure cleanup policies for GDPR compliance
5. **Advanced Metrics**: Add funnel analysis and user journey tracking
