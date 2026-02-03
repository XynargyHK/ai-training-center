-- Migration: Add publish status to landing_pages
-- Allows landing pages to be saved as drafts and published when ready

-- Add is_published column (defaults to false - draft mode)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add published_at timestamp
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN landing_pages.is_published IS 'Whether the landing page is live and visible to customers';
COMMENT ON COLUMN landing_pages.published_at IS 'Timestamp when the landing page was last published';
