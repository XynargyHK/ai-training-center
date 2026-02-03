-- Migration: Add Country Column to FAQ Library
-- Purpose: Make FAQs country-specific to match landing_pages structure
-- Date: 2026-02-02

-- Step 1: Add country column to faq_library
ALTER TABLE faq_library
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'HK';

-- Step 2: Set country for existing rows based on business_unit
-- Assume existing FAQs are for HK (default)
UPDATE faq_library
SET country = 'HK'
WHERE country IS NULL;

-- Step 3: Add constraint for valid countries
ALTER TABLE faq_library
ADD CONSTRAINT faq_library_country_check CHECK (country IN ('HK', 'US', 'TW', 'CN', 'VN'));

-- Step 4: Drop old unique constraint (reference_id + language + business_unit)
DROP INDEX IF EXISTS faq_library_reference_language_unique;

-- Step 5: Create new unique constraint (reference_id + country + language + business_unit)
CREATE UNIQUE INDEX faq_library_reference_country_language_unique
ON faq_library(reference_id, country, language, business_unit_id);

-- Step 6: Create index for performance (country + language + business_unit)
CREATE INDEX IF NOT EXISTS faq_library_country_language_business_unit_idx
ON faq_library(country, language, business_unit_id);

-- Step 7: Add helpful comment
COMMENT ON COLUMN faq_library.country IS 'Country code: HK, US, TW, CN, VN - links FAQs to specific countries';

-- Verification query (commented out - uncomment to verify after migration)
-- SELECT country, language, COUNT(*) as count
-- FROM faq_library
-- GROUP BY country, language
-- ORDER BY country, language;
