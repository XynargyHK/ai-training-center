-- Migration 095: Add locale support to products
-- Adds country and language_code columns to products table
-- Mirrors the landing_pages pattern for per-locale content

-- Step 1: Add locale columns with defaults so existing rows get US/en
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';

-- Step 2: Ensure all existing products have the default locale
UPDATE products SET country = 'US' WHERE country IS NULL;
UPDATE products SET language_code = 'en' WHERE language_code IS NULL;

-- Step 3: Drop old unique constraint on (business_unit_id, handle)
-- Try all possible naming conventions
DO $$
BEGIN
  BEGIN
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_handle_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_id_handle_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_handle_business_unit_id_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP INDEX IF EXISTS products_business_unit_handle_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP INDEX IF EXISTS products_business_unit_id_handle_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP INDEX IF EXISTS idx_products_business_unit_handle;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Step 4: Create new unique constraint including locale
ALTER TABLE products
  ADD CONSTRAINT products_business_unit_locale_handle_key
  UNIQUE (business_unit_id, country, language_code, handle);

-- Step 5: Add index for locale-based queries
CREATE INDEX IF NOT EXISTS idx_products_business_unit_locale
  ON products (business_unit_id, country, language_code);
