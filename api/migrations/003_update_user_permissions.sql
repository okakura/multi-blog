-- Migration: 003_update_user_permissions.sql
-- Update user roles to match frontend expectations
UPDATE users SET role = 'platform_admin' WHERE role = 'super_admin';
UPDATE users SET role = 'domain_user' WHERE role = 'user';

-- Clear any existing users and add sample data that matches frontend mock
DELETE FROM user_domain_permissions;
DELETE FROM users;

-- Insert sample users (matching frontend mock data)
INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES 
(1, 'john@example.com', 'John Doe', '$2b$12$placeholder_hash_for_password', 'platform_admin', '2024-01-15T10:30:00Z'),
(2, 'jane@example.com', 'Jane Smith', '$2b$12$placeholder_hash_for_password', 'domain_user', '2024-02-20T14:15:00Z'),
(3, 'mike@example.com', 'Mike Johnson', '$2b$12$placeholder_hash_for_password', 'domain_user', '2024-03-10T09:45:00Z'),
(4, 'sarah@example.com', 'Sarah Wilson', '$2b$12$placeholder_hash_for_password', 'domain_user', '2024-04-05T16:20:00Z'),
(5, 'alex@example.com', 'Alex Chen', '$2b$12$placeholder_hash_for_password', 'domain_user', '2024-05-12T11:30:00Z');

-- Set the sequence to continue from where we left off
SELECT setval('users_id_seq', 5, true);

-- Insert sample domain permissions (matching frontend mock data)
-- Assuming domains 1-4 exist (Tech, Lifestyle, Business, Food)
INSERT INTO user_domain_permissions (user_id, domain_id, role) VALUES 
-- Jane Smith permissions
(2, 1, 'admin'),     -- Tech Blog: admin
(2, 2, 'editor'),    -- Lifestyle Blog: editor  
(2, 3, 'viewer'),    -- Business Blog: viewer
(2, 4, 'viewer'),    -- Food Blog: none (we'll handle 'none' as no record)

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

-- Add some basic admin credentials for testing
-- Password is 'admin123' hashed with bcrypt
UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewtsEtd1pzKyPqKe' WHERE email = 'john@example.com';
-- Password is 'password123' for others  
UPDATE users SET password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email IN ('jane@example.com', 'mike@example.com', 'sarah@example.com', 'alex@example.com');
