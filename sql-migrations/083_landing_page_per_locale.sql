-- Migration: Support multiple landing pages per business unit (one per country/language)
-- Each business unit can have different landing pages for different locales

-- First, drop the old unique constraint if it exists
ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_business_unit_id_key;

-- Create a unique constraint on business_unit_id + country + language_code
-- This allows multiple landing pages per business unit, one for each locale
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_locale_unique
ON landing_pages (business_unit_id, country, language_code);

-- Add comment for documentation
COMMENT ON TABLE landing_pages IS 'Landing pages for each business unit, with separate versions for each country/language combination';
