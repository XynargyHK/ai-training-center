-- Migration: Support multiple landing pages per locale (different slugs)
-- This allows one business unit to have / (home), /how-to-use, /manual, etc. per locale

-- Drop the old unique index that restricted to one page per locale
DROP INDEX IF EXISTS landing_pages_locale_unique;

-- Create a new unique index that includes the slug
-- This means (BU + Country + Language + Slug) must be unique
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_locale_slug_unique
ON landing_pages (business_unit_id, country, language_code, slug);

-- Add comment
COMMENT ON INDEX landing_pages_locale_slug_unique IS 'Allows multiple landing pages per locale, differentiated by slug';
