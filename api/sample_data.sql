-- Sample data for testing the multi-blog platform

-- Insert sample domains
INSERT INTO domains (hostname, name, theme_config, categories) VALUES
('techblog.example.com', 'Tech Blog', '{"theme": "dark", "primary_color": "#007acc"}', '["Technology", "Programming", "AI", "Web Development"]'),
('foodblog.example.com', 'Food Adventures', '{"theme": "light", "primary_color": "#ff6b35"}', '["Recipes", "Reviews", "Travel", "Cooking Tips"]'),
('travelblog.example.com', 'Wanderlust Chronicles', '{"theme": "nature", "primary_color": "#2d5d31"}', '["Travel", "Photography", "Culture", "Adventure"]');

-- Insert sample users
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@example.com', 'Super Admin', '$2b$10$rOiMbkqEhUc7BxB7N2ZkzOK8jE4zF3tA8LdKvC2pQ7eH9gS5wX1nC', 'super_admin'),
('tech.editor@example.com', 'Alex Johnson', '$2b$10$rOiMbkqEhUc7BxB7N2ZkzOK8jE4zF3tA8LdKvC2pQ7eH9gS5wX1nC', 'user'),
('food.writer@example.com', 'Sarah Chen', '$2b$10$rOiMbkqEhUc7BxB7N2ZkzOK8jE4zF3tA8LdKvC2pQ7eH9gS5wX1nC', 'user'),
('travel.blogger@example.com', 'Mike Rodriguez', '$2b$10$rOiMbkqEhUc7BxB7N2ZkzOK8jE4zF3tA8LdKvC2pQ7eH9gS5wX1nC', 'user');

-- Insert user domain permissions
INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES
-- Tech blog permissions
(2, 1, 'editor'),  -- Alex as editor on tech blog
(3, 1, 'viewer'),  -- Sarah as viewer on tech blog

-- Food blog permissions  
(3, 2, 'admin'),   -- Sarah as admin on food blog
(2, 2, 'viewer'),  -- Alex as viewer on food blog

-- Travel blog permissions
(4, 3, 'editor'),  -- Mike as editor on travel blog
(2, 3, 'viewer'),  -- Alex as viewer on travel blog
(3, 3, 'viewer');  -- Sarah as viewer on travel blog

-- Insert sample posts
INSERT INTO posts (domain_id, title, content, author, category, slug, status, created_at) VALUES
-- Tech Blog Posts
(1, 'Getting Started with Rust Web Development', 'Rust has been gaining tremendous popularity in web development...', 'Alex Johnson', 'Programming', 'getting-started-rust-web-development', 'published', NOW() - INTERVAL '5 days'),
(1, 'Building REST APIs with Axum Framework', 'Axum is a modern, fast web framework for Rust that makes building APIs a breeze...', 'Alex Johnson', 'Web Development', 'building-rest-apis-axum-framework', 'published', NOW() - INTERVAL '3 days'),
(1, 'Machine Learning in Rust: A Practical Guide', 'While Python dominates the ML space, Rust is emerging as a powerful alternative...', 'Alex Johnson', 'AI', 'machine-learning-rust-practical-guide', 'draft', NOW() - INTERVAL '1 day'),

-- Food Blog Posts
(2, 'Perfect Pasta Carbonara Recipe', 'Discover the secrets to making authentic Italian carbonara at home...', 'Sarah Chen', 'Recipes', 'perfect-pasta-carbonara-recipe', 'published', NOW() - INTERVAL '7 days'),
(2, 'Tokyo Food Scene: Hidden Gems', 'My culinary adventure through Tokyo''s lesser-known restaurants...', 'Sarah Chen', 'Travel', 'tokyo-food-scene-hidden-gems', 'published', NOW() - INTERVAL '4 days'),
(2, 'Essential Kitchen Tools for Home Cooks', 'A comprehensive guide to building your kitchen arsenal...', 'Sarah Chen', 'Cooking Tips', 'essential-kitchen-tools-home-cooks', 'published', NOW() - INTERVAL '2 days'),

-- Travel Blog Posts
(3, 'Backpacking Through Southeast Asia: Complete Guide', 'Everything you need to know for an amazing Southeast Asian adventure...', 'Mike Rodriguez', 'Travel', 'backpacking-southeast-asia-complete-guide', 'published', NOW() - INTERVAL '6 days'),
(3, 'Photography Tips for Travel Enthusiasts', 'Capture stunning photos on your next adventure with these pro tips...', 'Mike Rodriguez', 'Photography', 'photography-tips-travel-enthusiasts', 'published', NOW() - INTERVAL '2 days'),
(3, 'Cultural Etiquette: Respecting Local Customs', 'How to be a respectful traveler and immerse yourself in local culture...', 'Mike Rodriguez', 'Culture', 'cultural-etiquette-respecting-local-customs', 'draft', NOW() - INTERVAL '1 day');

-- Insert sample analytics events
INSERT INTO analytics_events (domain_id, event_type, path, ip_address, user_agent, referrer, post_id, metadata, created_at) VALUES
-- Tech blog analytics
(1, 'page_view', '/', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://google.com', NULL, '{}', NOW() - INTERVAL '2 hours'),
(1, 'post_view', '/posts/getting-started-rust-web-development', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://techblog.example.com', 1, '{}', NOW() - INTERVAL '2 hours'),
(1, 'search', '/search', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NULL, NULL, '{"query": "rust tutorial"}', NOW() - INTERVAL '1 hour'),
(1, 'post_view', '/posts/building-rest-apis-axum-framework', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'https://reddit.com', 2, '{}', NOW() - INTERVAL '30 minutes'),

-- Food blog analytics  
(2, 'page_view', '/', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://pinterest.com', NULL, '{}', NOW() - INTERVAL '3 hours'),
(2, 'post_view', '/posts/perfect-pasta-carbonara-recipe', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://foodblog.example.com', 4, '{}', NOW() - INTERVAL '3 hours'),
(2, 'post_view', '/posts/tokyo-food-scene-hidden-gems', '10.0.0.51', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'https://instagram.com', 5, '{}', NOW() - INTERVAL '1 hour'),

-- Travel blog analytics
(3, 'page_view', '/', '172.16.0.10', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'https://facebook.com', NULL, '{}', NOW() - INTERVAL '4 hours'),
(3, 'post_view', '/posts/backpacking-southeast-asia-complete-guide', '172.16.0.10', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'https://travelblog.example.com', 7, '{}', NOW() - INTERVAL '4 hours'),
(3, 'search', '/search', '172.16.0.11', 'Mozilla/5.0 (Android 11; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0', NULL, NULL, '{"query": "travel photography"}', NOW() - INTERVAL '2 hours');
