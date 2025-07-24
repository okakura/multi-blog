-- Skip problematic migration 4 and recreate session tracking properly

-- First, clean up any partial artifacts from failed migration
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS calculate_session_duration(UUID) CASCADE;  
DROP FUNCTION IF EXISTS end_session(UUID) CASCADE;
ALTER TABLE analytics_events DROP COLUMN IF EXISTS session_id;

-- Now create the session tracking system properly
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

-- Add indexes
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_domain ON user_sessions(domain_name);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_device_type ON user_sessions(device_type);

-- Add session_id to analytics_events
ALTER TABLE analytics_events ADD COLUMN session_id UUID;
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Add foreign key
ALTER TABLE analytics_events 
ADD CONSTRAINT fk_analytics_events_session_id 
FOREIGN KEY (session_id) REFERENCES user_sessions(id) 
ON DELETE SET NULL;

-- Add sample session data for testing
INSERT INTO user_sessions (session_id, ip_address, domain_name, user_agent, device_type, browser, os, page_views, duration_seconds, started_at)
VALUES 
    ('sess_1', '192.168.1.1', 'tech.localhost', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', 'Chrome', 'macOS', 5, 180, NOW() - INTERVAL '2 hours'),
    ('sess_2', '192.168.1.2', 'blog.localhost', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', 'mobile', 'Safari', 'iOS', 3, 120, NOW() - INTERVAL '1 hour'),
    ('sess_3', '192.168.1.3', 'tech.localhost', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'Edge', 'Windows', 8, 420, NOW() - INTERVAL '3 hours'),
    ('sess_4', '192.168.1.4', 'blog.localhost', 'Mozilla/5.0 (iPad; CPU OS 15_0)', 'tablet', 'Safari', 'iPadOS', 2, 90, NOW() - INTERVAL '30 minutes'),
    ('sess_5', '192.168.1.5', 'tech.localhost', 'Mozilla/5.0 (Android 11; Mobile)', 'mobile', 'Chrome', 'Android', 4, 210, NOW() - INTERVAL '45 minutes'),
    ('sess_6', '192.168.1.6', 'blog.localhost', 'Mozilla/5.0 (X11; Linux x86_64)', 'desktop', 'Firefox', 'Linux', 6, 350, NOW() - INTERVAL '90 minutes');
