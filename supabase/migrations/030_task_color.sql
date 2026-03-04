-- Add color column to tasks for card color customization
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color text;
