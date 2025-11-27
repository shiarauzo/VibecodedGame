-- Migration script to add name column to users table
-- Run this SQL in your database to add the name column

ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

