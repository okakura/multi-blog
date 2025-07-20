-- Migration: 001_initial_schema.sql
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
    role VARCHAR(50) DEFAULT 'user', -- super_admin, user
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

-- Analytics events table
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
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

-- Sessions table for user authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_domain_status ON posts(domain_id, status);
CREATE INDEX idx_posts_domain_slug ON posts(domain_id, slug);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_analytics_domain_created ON analytics_events(domain_id, created_at);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_post_id ON analytics_events(post_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert sample data
INSERT INTO domains (hostname, name, theme_config, categories) VALUES
('tech.localhost', 'TechInsights', 
 '{"primary": "from-blue-600 to-purple-600", "secondary": "from-cyan-400 to-blue-500", "accent": "#3b82f6"}',
 '["AI", "Web Dev", "Mobile", "Cloud"]'),
('lifestyle.localhost', 'LifeStyle Hub',
 '{"primary": "from-pink-500 to-rose-500", "secondary": "from-orange-400 to-pink-500", "accent": "#ec4899"}',
 '["Health", "Travel", "Food", "Fashion"]'),
('business.localhost', 'BizWorks',
 '{"primary": "from-green-600 to-teal-600", "secondary": "from-emerald-400 to-green-500", "accent": "#059669"}',
 '["Startups", "Marketing", "Finance", "Leadership"]');

-- Create admin user (password: admin123)
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@example.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWorz5mVd9vQ4J2C', 'super_admin');

-- Sample posts
INSERT INTO posts (domain_id, title, slug, content, excerpt, author, category, status, published_at) VALUES
(1, 'The Future of AI in 2024', 'future-of-ai-2024', 
 'Artificial Intelligence continues to evolve at an unprecedented pace...', 
 'Exploring the latest developments in AI technology and their implications for the future.',
 'Admin User', 'AI', 'published', NOW() - INTERVAL '2 days'),
(1, 'Building Scalable Web Apps', 'building-scalable-web-apps',
 'When building web applications that need to handle millions of users...',
 'Best practices for creating web applications that can scale to millions of users.',
 'Admin User', 'Web Dev', 'published', NOW() - INTERVAL '1 day'),
(2, 'Healthy Morning Routines', 'healthy-morning-routines',
 'Starting your day with intention can transform your entire life...',
 'Simple morning routines that can boost your energy and productivity.',
 'Admin User', 'Health', 'published', NOW() - INTERVAL '3 hours'),
(3, 'Startup Funding Strategies', 'startup-funding-strategies',
 'Securing funding for your startup is one of the biggest challenges...',
 'A comprehensive guide to different funding options for early-stage startups.',
 'Admin User', 'Startups', 'published', NOW() - INTERVAL '1 hour');
