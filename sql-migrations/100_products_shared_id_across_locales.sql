-- Migration 100: Products share same ID across locales
--
-- GOAL: Same product ID across all locales (HK/en, HK/tw share the same ID)
-- This allows the pricing block to reference a product_id and the system
-- finds the correct translated version based on the user's language.
--
-- CHANGE: Primary key from (id) to (id, country, language_code)
-- Related tables (product_images, product_variants, etc.) remain unchanged -
-- they reference the product by id only and are shared across all locales.

-- Step 1: Drop the existing primary key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;

-- Step 2: Create composite primary key (id, country, language_code)
-- This allows the same id to exist for different locales
ALTER TABLE products ADD PRIMARY KEY (id, country, language_code);

-- Step 3: Drop old unique constraints that conflict
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_locale_handle_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_handle_key;

-- Step 4: Create new unique constraint for handle per locale
-- (handle must be unique within a business_unit + country + language combination)
CREATE UNIQUE INDEX IF NOT EXISTS products_business_unit_locale_handle_idx
  ON products (business_unit_id, country, language_code, handle)
  WHERE handle IS NOT NULL;

-- Step 5: Create index for efficient locale lookups by product id
CREATE INDEX IF NOT EXISTS idx_products_id_locale
  ON products (id, country, language_code);

-- Step 6: Ensure foreign key constraints on related tables still work
-- The FK on product_images, product_variants, etc. references products(id)
-- With the composite PK, we need to ensure these still work.
-- PostgreSQL allows FK to reference a subset of the PK if that subset is unique.
-- We need a unique constraint on just (id) - but we can't have that with duplicates.
--
-- SOLUTION: Related tables (images, variants) are SHARED across locales.
-- They reference the product by id, and the same images/variants apply to all locales.
-- The FK should reference any row with that id (which is valid for composite PKs).
--
-- However, standard FKs require the referenced columns to have a UNIQUE constraint.
-- Since we now have duplicate ids (one per locale), we need to handle this differently.
--
-- APPROACH: Remove FK constraints from related tables, rely on application logic.
-- Or: Keep related tables per-locale (each locale has its own images/variants).
--
-- For now, we'll keep the structure where each locale has its own related data,
-- which matches how create-locale currently works (it copies images/variants).

-- Note: The existing FK constraints reference products(id) which was the PK.
-- With composite PK, these FKs will fail on insert if the product has multiple locales.
-- We need to either:
-- A) Drop the FKs and rely on application logic
-- B) Change FKs to reference the full composite key (id, country, language_code)
-- C) Keep a separate unique index on (id) - but this prevents duplicate ids

-- DECISION: Option A - Drop FKs, rely on application logic
-- This is the simplest approach and matches many production systems.

-- Drop foreign key constraints from related tables
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE product_category_mapping DROP CONSTRAINT IF EXISTS product_category_mapping_product_id_fkey;
ALTER TABLE ai_generated_content DROP CONSTRAINT IF EXISTS ai_generated_content_product_id_fkey;
ALTER TABLE product_addon_matches DROP CONSTRAINT IF EXISTS product_addon_matches_product_id_fkey;
ALTER TABLE product_addon_matches DROP CONSTRAINT IF EXISTS product_addon_matches_addon_product_id_fkey;
ALTER TABLE product_skin_concern_mapping DROP CONSTRAINT IF EXISTS product_skin_concern_mapping_product_id_fkey;

-- Also handle any other tables that might reference products
ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_product_id_fkey;

-- Add comments to document the design decision
COMMENT ON TABLE products IS 'Products table with composite PK (id, country, language_code). Same product_id across locales for translations. Related tables reference by id only (shared across locales).';

COMMENT ON COLUMN products.id IS 'Product UUID - same ID used across all locale versions of the same product';
COMMENT ON COLUMN products.country IS 'Country code (e.g., US, HK, SG) - part of composite PK';
COMMENT ON COLUMN products.language_code IS 'Language code (e.g., en, tw, cn) - part of composite PK';
