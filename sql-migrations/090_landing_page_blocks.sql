-- ============================================================================
-- Add Blocks Column to Landing Pages
-- This migration adds support for modular block system to landing pages
-- ============================================================================

-- Add blocks column to landing_pages table
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;

-- Add index for blocks column for better query performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_blocks ON landing_pages USING gin(blocks);

-- Add comment to explain the column
COMMENT ON COLUMN landing_pages.blocks IS 'Array of modular blocks that make up the landing page. Each block has: id, type, name, order, and type-specific data';
