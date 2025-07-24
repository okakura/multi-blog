-- Add behavior tracking tables for analytics

-- Behavior events table (clicks, scrolls, interactions)
CREATE TABLE IF NOT EXISTS behavior_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    element VARCHAR(255),
    x DECIMAL(10,2),
    y DECIMAL(10,2),
    scroll_depth DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Search events table (search queries and results)
CREATE TABLE IF NOT EXISTS search_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    no_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Search click events table (clicks on search results)
CREATE TABLE IF NOT EXISTS search_click_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    clicked_result TEXT NOT NULL,
    position_clicked INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Content metrics table (reading time, engagement, scroll tracking)
CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    reading_time INTEGER NOT NULL DEFAULT 0, -- in seconds
    scroll_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    time_on_page INTEGER NOT NULL DEFAULT 0, -- in seconds
    bounce BOOLEAN DEFAULT FALSE,
    engagement_events INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_id ON behavior_events(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_event_type ON behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_created_at ON behavior_events(created_at);

CREATE INDEX IF NOT EXISTS idx_search_events_session_id ON search_events(session_id);
CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(query);
CREATE INDEX IF NOT EXISTS idx_search_events_created_at ON search_events(created_at);

CREATE INDEX IF NOT EXISTS idx_search_click_events_session_id ON search_click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_search_click_events_query ON search_click_events(query);
CREATE INDEX IF NOT EXISTS idx_search_click_events_created_at ON search_click_events(created_at);

CREATE INDEX IF NOT EXISTS idx_content_metrics_session_id ON content_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_created_at ON content_metrics(created_at);
