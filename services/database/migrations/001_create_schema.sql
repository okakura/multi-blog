-- Migration: 001_create_schema.sql
-- Consolidated schema for multi-blog platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table - each blog domain/subdomain
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    theme_config JSONB DEFAULT '{}',
    categories JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'domain_user', -- platform_admin, domain_user
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User domain permissions
CREATE TABLE user_domain_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- admin, editor, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, domain_id)
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    read_time INTEGER DEFAULT 0, -- estimated read time in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(domain_id, slug)
);

-- User sessions for analytics and authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    domain_name VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    is_bot BOOLEAN DEFAULT FALSE,
    referrer TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    token_hash VARCHAR(255), -- for authenticated sessions
    expires_at TIMESTAMP WITH TIME ZONE, -- for authenticated sessions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- page_view, post_view, search, etc.
    path VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavior events table (clicks, scrolls, interactions)
CREATE TABLE behavior_events (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    element VARCHAR(255),
    x DECIMAL(10,2),
    y DECIMAL(10,2),
    scroll_depth DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Search events table (search queries and results)
CREATE TABLE search_events (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    no_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Search click events table (clicks on search results)
CREATE TABLE search_click_events (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    clicked_result TEXT NOT NULL,
    position_clicked INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Content metrics table (reading time, engagement, scroll tracking)
CREATE TABLE content_metrics (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    reading_time INTEGER NOT NULL DEFAULT 0, -- in seconds
    scroll_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    time_on_page INTEGER NOT NULL DEFAULT 0, -- in seconds
    interactions_count INTEGER NOT NULL DEFAULT 0,
    bounce BOOLEAN DEFAULT FALSE, -- tracks if user bounced without engaging
    engagement_events INTEGER NOT NULL DEFAULT 0, -- number of engagement events
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance Indexes
-- Domain indexes
CREATE INDEX idx_domains_hostname ON domains(hostname);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Post indexes
CREATE INDEX idx_posts_domain_status ON posts(domain_id, status);
CREATE INDEX idx_posts_domain_slug ON posts(domain_id, slug);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_author ON posts(author);

-- Session indexes
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_domain ON user_sessions(domain_name);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_device_type ON user_sessions(device_type);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Analytics indexes
CREATE INDEX idx_analytics_session_created ON analytics_events(session_id, created_at);
CREATE INDEX idx_analytics_domain_created ON analytics_events(domain_id, created_at);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_post_id ON analytics_events(post_id);

-- Behavior tracking indexes
CREATE INDEX idx_behavior_events_session_created ON behavior_events(session_id, created_at);
CREATE INDEX idx_behavior_events_type ON behavior_events(event_type);

-- Search indexes
CREATE INDEX idx_search_events_session_created ON search_events(session_id, created_at);
CREATE INDEX idx_search_events_query ON search_events USING GIN (to_tsvector('english', query));
CREATE INDEX idx_search_click_events_session_created ON search_click_events(session_id, created_at);

-- Content metrics indexes
CREATE INDEX idx_content_metrics_session_created ON content_metrics(session_id, created_at);
CREATE INDEX idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX idx_content_metrics_content_type ON content_metrics(content_type);

-- Functions for session management
CREATE OR REPLACE FUNCTION end_session(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_sessions 
    SET 
        ended_at = NOW(),
        last_activity_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    WHERE id = session_uuid 
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql;
