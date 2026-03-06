-- Add translations JSONB column for multi-language support (Urdu, etc.)
-- Stores: { "ur": { "title": "...", "description": "..." } }
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;
