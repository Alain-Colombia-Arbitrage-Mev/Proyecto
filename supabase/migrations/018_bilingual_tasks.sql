-- Add English translation fields for bilingual task support (ES/EN)
-- Primary fields (title, description) remain as Spanish. English versions are optional.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_en text;
