-- ============================================
-- PostgreSQL setup for NullTrace Project
-- ============================================

-- 1️⃣ Create the main project database
CREATE DATABASE nulltrace;

-- Switch to the new database
\c nulltrace

-- 2️⃣ Create the feedback table
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_email TEXT,
    message TEXT,
    sentiment TEXT,
    rating INT,
    hash TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Done ✅
