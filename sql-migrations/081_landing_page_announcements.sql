-- Migration: Add announcements array column to landing_pages
-- This replaces the single announcement_text with an array of announcements
-- that can rotate every 5 seconds on the landing page

-- Add announcements column (JSONB array)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS announcements JSONB DEFAULT '[]'::jsonb;

-- Migrate existing announcement_text to announcements array
UPDATE landing_pages
SET announcements = jsonb_build_array(announcement_text)
WHERE announcement_text IS NOT NULL
  AND announcement_text != ''
  AND (announcements IS NULL OR announcements = '[]'::jsonb);

-- Add comment for documentation
COMMENT ON COLUMN landing_pages.announcements IS 'Array of announcement messages that rotate every 5 seconds on the banner';
