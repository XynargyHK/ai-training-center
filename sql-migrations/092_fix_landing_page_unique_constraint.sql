-- Fix: Drop the old unique index on business_unit_id only
-- This was blocking multiple landing pages per business unit (different locales)

-- Drop the old index that only allowed ONE landing page per business unit
DROP INDEX IF EXISTS landing_pages_business_unit_unique;

-- Ensure the locale-based unique index exists (from migration 083)
-- This allows ONE landing page per business_unit + country + language combination
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_locale_unique
ON landing_pages (business_unit_id, country, language_code);

-- Update comment
COMMENT ON TABLE landing_pages IS 'Landing pages for each business unit, with separate versions for each country/language combination (e.g., US/en, HK/en, HK/zh)';
