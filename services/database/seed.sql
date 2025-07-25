-- Seed script for multi-blog platform
-- This script populates the database with sample data for development and testing

-- Sample domains
INSERT INTO domains (hostname, name, theme_config, categories) VALUES
('tech.localhost', 'TechInsights', 
 '{"primary": "from-blue-600 to-purple-600", "secondary": "from-cyan-400 to-blue-500", "accent": "#3b82f6"}',
 '["AI", "Web Dev", "Mobile", "Cloud"]'),
('lifestyle.localhost', 'LifeStyle Hub',
 '{"primary": "from-pink-500 to-rose-500", "secondary": "from-orange-400 to-pink-500", "accent": "#ec4899"}',
 '["Health", "Travel", "Food", "Fashion"]'),
('business.localhost', 'BizWorks',
 '{"primary": "from-green-600 to-teal-600", "secondary": "from-emerald-400 to-green-500", "accent": "#059669"}',
 '["Startups", "Marketing", "Finance", "Leadership"]'),
('food.localhost', 'FoodieWorld',
 '{"primary": "from-orange-500 to-red-500", "secondary": "from-yellow-400 to-orange-500", "accent": "#f97316"}',
 '["Recipes", "Reviews", "Cooking Tips", "Nutrition"]');

-- Sample users with proper password hashes
-- Password for john@example.com (platform_admin): admin123
-- Password for others: password123
INSERT INTO users (id, email, name, password_hash, role, preferences, created_at) VALUES 
(1, 'john@example.com', 'John Doe', '$2b$12$2yWFsq7ab4zjB0l.E/8.DOUaUczs0gbkNRatdcaUuzQpYTwsU7KqW', 'platform_admin', 
 '{"theme": "dark", "notifications": true, "timezone": "UTC"}', '2024-01-15T10:30:00Z'),
(2, 'jane@example.com', 'Jane Smith', '$2b$12$BW3vAVHbaezSGB4hLzI0AujzbeyN2xVi0UhI.dhJK5PN.im0bjnHe', 'domain_user',
 '{"theme": "light", "notifications": false, "timezone": "America/New_York"}', '2024-02-20T14:15:00Z'),
(3, 'mike@example.com', 'Mike Johnson', '$2b$12$BW3vAVHbaezSGB4hLzI0AujzbeyN2xVi0UhI.dhJK5PN.im0bjnHe', 'domain_user',
 '{"theme": "auto", "notifications": true, "timezone": "Europe/London"}', '2024-03-10T09:45:00Z'),
(4, 'sarah@example.com', 'Sarah Wilson', '$2b$12$BW3vAVHbaezSGB4hLzI0AujzbeyN2xVi0UhI.dhJK5PN.im0bjnHe', 'domain_user',
 '{"theme": "light", "notifications": true, "timezone": "America/Los_Angeles"}', '2024-04-05T16:20:00Z'),
(5, 'alex@example.com', 'Alex Chen', '$2b$12$BW3vAVHbaezSGB4hLzI0AujzbeyN2xVi0UhI.dhJK5PN.im0bjnHe', 'domain_user',
 '{"theme": "dark", "notifications": false, "timezone": "Asia/Tokyo"}', '2024-05-12T11:30:00Z');

-- Set the sequence to continue from where we left off
SELECT setval('users_id_seq', 5, true);

-- Sample domain permissions (matching expected frontend data)
INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES 
-- Jane Smith permissions
(2, 1, 'admin'),     -- Tech Blog: admin
(2, 2, 'editor'),    -- Lifestyle Blog: editor  
(2, 3, 'viewer'),    -- Business Blog: viewer
(2, 4, 'viewer'),    -- Food Blog: viewer

-- Mike Johnson permissions  
(3, 1, 'editor'),    -- Tech Blog: editor
(3, 3, 'admin'),     -- Business Blog: admin
(3, 4, 'editor'),    -- Food Blog: editor

-- Sarah Wilson permissions
(4, 2, 'admin'),     -- Lifestyle Blog: admin
(4, 4, 'viewer'),    -- Food Blog: viewer

-- Alex Chen permissions
(5, 1, 'viewer'),    -- Tech Blog: viewer
(5, 2, 'editor'),    -- Lifestyle Blog: editor
(5, 3, 'editor');    -- Business Blog: editor

-- Sample posts
INSERT INTO posts (domain_id, title, slug, content, excerpt, author, category, status, read_time, published_at) VALUES
-- Tech Blog Posts
(1, 'The Future of AI in 2024', 'future-of-ai-2024', 
 'Artificial Intelligence continues to evolve at an unprecedented pace. From large language models to computer vision breakthroughs, 2024 has been a landmark year for AI development. In this post, we explore the key trends shaping the AI landscape and what developers need to know to stay ahead of the curve.',
 'Exploring the latest developments in AI technology and their implications for the future.',
 'Jane Smith', 'AI', 'published', 5, NOW() - INTERVAL '2 days'),

(1, 'Building Scalable Web Apps with Rust', 'building-scalable-web-apps-rust',
 'Rust has emerged as a powerful language for building high-performance web applications. With its memory safety guarantees and zero-cost abstractions, Rust offers unique advantages for backend development. This comprehensive guide covers everything from setting up your first Rust web server to deploying production-ready applications.',
 'A comprehensive guide to building high-performance web applications with Rust.',
 'Mike Johnson', 'Web Dev', 'published', 8, NOW() - INTERVAL '1 day'),

(1, 'Cloud Native Development Best Practices', 'cloud-native-development',
 'Cloud native development has transformed how we build and deploy applications. This post covers the essential patterns and practices for developing applications that fully leverage cloud capabilities.',
 'Essential patterns for building applications that leverage cloud capabilities.',
 'Jane Smith', 'Cloud', 'published', 6, NOW() - INTERVAL '3 hours'),

-- Lifestyle Blog Posts
(2, 'Healthy Morning Routines That Actually Work', 'healthy-morning-routines',
 'Starting your day with intention can transform your entire life. After researching dozens of studies and interviewing productivity experts, we''ve compiled the most effective morning routines that you can actually stick to. These aren''t just theoretical concepts - they''re practical strategies that busy people use every day.',
 'Simple morning routines that can boost your energy and productivity throughout the day.',
 'Sarah Wilson', 'Health', 'published', 7, NOW() - INTERVAL '5 hours'),

(2, 'Minimalist Travel: Pack Light, Travel Far', 'minimalist-travel-guide',
 'Discover the art of traveling with just a carry-on bag. This guide covers everything from choosing versatile clothing to essential travel gear that won''t weigh you down.',
 'Learn how to travel comfortably with minimal luggage and maximum freedom.',
 'Alex Chen', 'Travel', 'published', 9, NOW() - INTERVAL '1 day'),

-- Business Blog Posts
(3, 'Startup Funding Strategies for 2024', 'startup-funding-strategies-2024',
 'Securing funding for your startup is one of the biggest challenges entrepreneurs face. The funding landscape has evolved significantly in recent years, with new options emerging while traditional routes become more competitive. This comprehensive guide breaks down every funding option available to startups in 2024.',
 'A comprehensive guide to different funding options for early-stage startups in today''s market.',
 'Mike Johnson', 'Startups', 'published', 12, NOW() - INTERVAL '6 hours'),

(3, 'Building High-Performance Teams Remotely', 'remote-team-building',
 'Remote work is here to stay, but building strong team culture from a distance requires intentional strategies and tools.',
 'Proven strategies for creating strong team culture in distributed organizations.',
 'John Doe', 'Leadership', 'published', 10, NOW() - INTERVAL '2 days'),

-- Food Blog Posts
(4, 'The Science of Perfect Pasta', 'science-perfect-pasta',
 'Cooking pasta seems simple, but there''s actual science behind achieving the perfect texture and flavor. From water temperature to salt ratios, every detail matters.',
 'Discover the scientific principles behind cooking restaurant-quality pasta at home.',
 'Sarah Wilson', 'Cooking Tips', 'published', 6, NOW() - INTERVAL '4 hours'),

(4, 'Farm-to-Table: Finding Local Ingredients', 'farm-to-table-local-ingredients',
 'Supporting local farmers while creating delicious meals starts with knowing where to look and what to ask for.',
 'A guide to sourcing fresh, local ingredients for your kitchen.',
 'Alex Chen', 'Nutrition', 'published', 8, NOW() - INTERVAL '1 day');

-- Sample user sessions (for analytics demonstration)
INSERT INTO user_sessions (session_id, ip_address, user_agent, domain_name, started_at, last_activity_at, page_views, device_type, browser, os, referrer) VALUES
(gen_random_uuid(), '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'tech.localhost', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 5, 'desktop', 'Chrome', 'macOS', 'https://google.com'),
(gen_random_uuid(), '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'lifestyle.localhost', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 3, 'mobile', 'Safari', 'iOS', 'https://twitter.com'),
(gen_random_uuid(), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'business.localhost', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', 7, 'desktop', 'Edge', 'Windows', 'https://linkedin.com');

-- Sample analytics events
INSERT INTO analytics_events (session_id, domain_id, post_id, event_type, path, metadata) 
SELECT 
    us.id,
    d.id,
    p.id,
    'post_view',
    '/posts/' || p.slug,
    json_build_object('read_time', p.read_time, 'category', p.category)
FROM user_sessions us
CROSS JOIN domains d
CROSS JOIN posts p
WHERE us.domain_name = d.hostname
AND p.domain_id = d.id
LIMIT 20;
