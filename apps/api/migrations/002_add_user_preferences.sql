-- Migration: 002_add_user_preferences.sql
-- Add preferences column to users table for storing user preferences as JSONB

ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- Create index for preferences queries
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Update existing users to have empty preferences object
UPDATE users SET preferences = '{}' WHERE preferences IS NULL;
