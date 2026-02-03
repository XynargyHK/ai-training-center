-- Migration: Add localization columns to landing_pages
-- Adds country, language_code, currency, and currency_symbol columns

-- Add country column (ISO 3166-1 alpha-2 code)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';

-- Add language_code column (e.g., 'en', 'zh-CN', 'ja')
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';

-- Add currency column (ISO 4217 code)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add currency_symbol column
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '$';

-- Add comments for documentation
COMMENT ON COLUMN landing_pages.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, JP)';
COMMENT ON COLUMN landing_pages.language_code IS 'Language code (e.g., en, zh-CN, ja, ko)';
COMMENT ON COLUMN landing_pages.currency IS 'ISO 4217 currency code (e.g., USD, EUR, JPY)';
COMMENT ON COLUMN landing_pages.currency_symbol IS 'Currency symbol for display (e.g., $, €, ¥)';
