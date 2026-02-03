-- Add sections column to landing_pages table for dynamic content sections
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;
