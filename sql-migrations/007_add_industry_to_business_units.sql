-- ============================================================================
-- Migration 007: Add industry column to business_units table
-- ============================================================================

-- Add industry column if it doesn't exist
ALTER TABLE business_units
ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'General';

-- Update existing rows to have default value
UPDATE business_units
SET industry = 'General'
WHERE industry IS NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '✅ Added industry column to business_units table' AS status;
