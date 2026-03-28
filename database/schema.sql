-- Cheerly Live Up Database Schema
-- MySQL Database for Mental Health Platform

CREATE DATABASE IF NOT EXISTS cheerly_db;
USE cheerly_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    country VARCHAR(100),
    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    profile_picture_url VARCHAR(500),
        subscription_status ENUM('free', 'premium_monthly', 'premium_yearly') DEFAULT 'free',
    INDEX idx_email (email),
    INDEX idx_signup_date (signup_date)
);

-- Mood Entries Table
CREATE TABLE IF NOT EXISTS mood_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    mood VARCHAR(50) NOT NULL,
    note TEXT,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, entry_date),
    INDEX idx_mood (mood)
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    message_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    message_type ENUM('user', 'ai') NOT NULL,
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_timestamp (timestamp)
);

-- Daily Affirmations Table
CREATE TABLE IF NOT EXISTS affirmations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    affirmation_text TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Affirmations Log (tracking what users saw)
CREATE TABLE IF NOT EXISTS user_affirmations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    affirmation_id INT NOT NULL,
    viewed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (affirmation_id) REFERENCES affirmations(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, viewed_date)
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    daily_reminder_time TIME DEFAULT '09:00:00',
    data_sharing BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crisis Resources Table
CREATE TABLE IF NOT EXISTS crisis_resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    country VARCHAR(100) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    website_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Daily Schedule Table
CREATE TABLE IF NOT EXISTS daily_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    title VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, schedule_date),
    UNIQUE KEY unique_user_date (user_id, schedule_date)
);

-- Schedule Tasks Table
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    user_id INT NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    start_time TIME,
    end_time TIME,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    category VARCHAR(100),
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_minutes_before INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (schedule_id) REFERENCES daily_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_schedule (schedule_id),
    INDEX idx_user_date (user_id, start_time),
    INDEX idx_status (status)
);

-- Schedule Notifications Table
CREATE TABLE IF NOT EXISTS schedule_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_id INT,
    notification_type ENUM('task_reminder', 'daily_check_in', 'encouragement', 'schedule_summary') NOT NULL,
    notification_message TEXT NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES schedule_tasks(id) ON DELETE CASCADE,
    INDEX idx_user_scheduled (user_id, scheduled_time),
    INDEX idx_status (status)
);

-- Chat Check-ins Table (for human-like bot messages)
CREATE TABLE IF NOT EXISTS chat_checkins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    checkin_type ENUM('morning', 'afternoon', 'evening', 'task_reminder', 'encouragement') NOT NULL,
    message_sent TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_responded BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, sent_at)
);

-- Eco-Therapy Activity Logs Table
CREATE TABLE IF NOT EXISTS eco_therapy_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    duration_minutes INT,
    mood_after VARCHAR(50),
    notes TEXT,
    location VARCHAR(255),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, logged_at),
    INDEX idx_activity (activity_type)
);

-- Eco-Therapy Weekly Challenges Table
CREATE TABLE IF NOT EXISTS eco_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    week_key VARCHAR(20) NOT NULL,
    completed_days JSON,
    days_completed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_week (user_id, week_key),
    INDEX idx_user_week (user_id, week_key)
);

-- Insert Sample Affirmations
INSERT INTO affirmations (affirmation_text, category) VALUES
('You are stronger than you think, braver than you believe, and more capable than you imagine.', 'strength'),
('Every challenge you face is making you stronger. You are doing better than you think!', 'resilience'),
('You have the power to create the life you want. Take it one day at a time.', 'empowerment'),
('Your feelings are valid. It''s okay to not be okay sometimes.', 'validation'),
('You deserve love, happiness, and all good things. Your presence matters.', 'self-worth'),
('Progress, not perfection. Celebrate your small victories today.', 'growth'),
('You are worthy of taking up space and being heard.', 'self-worth'),
('Healing is not linear. Be patient and kind to yourself.', 'healing'),
('Your story is unique and valuable. Share it when you''re ready.', 'courage'),
('You are not alone in this journey. Support is always available.', 'support'),
('Like a tree, your roots run deep. You are grounded, strong, and growing every day.', 'nature'),
('Nature does not hurry, yet everything is accomplished. Trust your own timing.', 'nature'),
('You are part of this beautiful earth. Step outside and let nature remind you of your belonging.', 'nature'),
('The sun rises every morning without fail. Like the sun, your light will always return.', 'nature'),
('Even the tallest mountain was once beneath the ocean. Growth takes time — be patient with yourself.', 'nature'),
('Breathe in the freshness of the world around you. You are alive, and that is a gift.', 'nature'),
('Like a river, you can flow around obstacles. Your path is not blocked — it is being shaped.', 'nature'),
('The earth holds you. The sky watches over you. You belong in this world.', 'nature'),
('In nature, nothing is perfect and everything is perfect. Embrace your beautiful imperfection.', 'nature'),
('Every seed needs darkness before it blooms. Your struggles are part of your growth.', 'nature');

-- Insert Sample Crisis Resources
INSERT INTO crisis_resources (country, resource_name, phone_number, website_url, description) VALUES
('Kenya', 'Befrienders Kenya', '+254 722 178 177', 'https://www.befrienderskenya.org', '24/7 emotional support'),
('South Africa', 'SADAG Crisis Line', '0800 567 567', 'https://www.sadag.org', 'Mental health helpline'),
('Nigeria', 'Mental Health Foundation Nigeria', '+234 809 210 6493', 'https://mhfn.org.ng', 'Crisis support'),
('International', 'WHO Mental Health', '+41 22 791 21 11', 'https://www.who.int/health-topics/mental-health', 'Global resources');

-- Create indexes for better performance
CREATE INDEX idx_mood_date ON mood_entries(entry_date);
CREATE INDEX idx_active_users ON users(is_active);
