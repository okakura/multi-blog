-- Add session tracking for real analytics
-- This migration adds proper session tracking to replace mock data

-- Create sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_domain ON user_sessions(domain_name);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_device_type ON user_sessions(device_type);

-- Add session_id column to analytics_events
ALTER TABLE analytics_events ADD COLUMN session_id UUID;
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Add foreign key constraint
ALTER TABLE analytics_events 
ADD CONSTRAINT fk_analytics_events_session_id 
FOREIGN KEY (session_id) REFERENCES user_sessions(id) 
ON DELETE SET NULL;

-- Add sample session data for testing
INSERT INTO user_sessions (session_id, ip_address, domain_name, user_agent, device_type, browser, os, page_views, duration_seconds)
VALUES 
    ('sess_' || gen_random_uuid()::text, '192.168.1.1', 'tech.localhost', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', 'Chrome', 'macOS', 5, 180),
    ('sess_' || gen_random_uuid()::text, '192.168.1.2', 'blog.localhost', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', 'mobile', 'Safari', 'iOS', 3, 120),
    ('sess_' || gen_random_uuid()::text, '192.168.1.3', 'tech.localhost', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'Edge', 'Windows', 8, 420),
    ('sess_' || gen_random_uuid()::text, '192.168.1.4', 'blog.localhost', 'Mozilla/5.0 (iPad; CPU OS 15_0)', 'tablet', 'Safari', 'iPadOS', 2, 90);
