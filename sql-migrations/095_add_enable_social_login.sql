-- Add enable_social_login column to landing_pages table
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS enable_social_login BOOLEAN DEFAULT true;

-- Enable social login for all existing landing pages
UPDATE landing_pages
SET enable_social_login = true
WHERE enable_social_login IS NULL;
