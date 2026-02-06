-- Migration 100: Products share same ID across locales
--
-- GOAL: Same product ID across all locales (HK/en, HK/tw share the same ID)
-- This allows the pricing block to reference a product_id and the system
-- finds the correct translated version based on the user's language.
--
-- CHANGE: Primary key from (id) to (id, country, language_code)
-- Related tables (product_images, product_variants, etc.) remain unchanged -
-- they reference the product by id only and are shared across all locales.

-- Step 1: Drop ALL foreign key constraints that reference products(id)
-- Must do this BEFORE changing the primary key
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE product_category_mapping DROP CONSTRAINT IF EXISTS product_category_mapping_product_id_fkey;
ALTER TABLE ai_generated_content DROP CONSTRAINT IF EXISTS ai_generated_content_product_id_fkey;
ALTER TABLE product_addons DROP CONSTRAINT IF EXISTS product_addons_product_id_fkey;
ALTER TABLE product_addons DROP CONSTRAINT IF EXISTS product_addons_addon_product_id_fkey;
ALTER TABLE product_custom_values DROP CONSTRAINT IF EXISTS product_custom_values_product_id_fkey;
ALTER TABLE product_addon_matches DROP CONSTRAINT IF EXISTS product_addon_matches_product_id_fkey;
ALTER TABLE product_addon_matches DROP CONSTRAINT IF EXISTS product_addon_matches_addon_product_id_fkey;
ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_product_id_fkey;
ALTER TABLE product_tag_assignments DROP CONSTRAINT IF EXISTS product_tag_assignments_product_id_fkey;
ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_product_id_fkey;
ALTER TABLE product_skin_concern_mapping DROP CONSTRAINT IF EXISTS product_skin_concern_mapping_product_id_fkey;

-- Step 2: Drop the existing primary key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;

-- Step 3: Create composite primary key (id, country, language_code)
-- This allows the same id to exist for different locales
ALTER TABLE products ADD PRIMARY KEY (id, country, language_code);

-- Step 4: Drop old unique constraints that conflict
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_locale_handle_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_business_unit_handle_key;

-- Step 5: Create new unique constraint for handle per locale
-- (handle must be unique within a business_unit + country + language combination)
CREATE UNIQUE INDEX IF NOT EXISTS products_business_unit_locale_handle_idx
  ON products (business_unit_id, country, language_code, handle)
  WHERE handle IS NOT NULL;

-- Step 6: Create index for efficient locale lookups by product id
CREATE INDEX IF NOT EXISTS idx_products_id_locale
  ON products (id, country, language_code);

-- Add comments to document the design decision
COMMENT ON TABLE products IS 'Products table with composite PK (id, country, language_code). Same product_id across locales for translations. Related tables reference by id only (shared across locales).';

COMMENT ON COLUMN products.id IS 'Product UUID - same ID used across all locale versions of the same product';
COMMENT ON COLUMN products.country IS 'Country code (e.g., US, HK, SG) - part of composite PK';
COMMENT ON COLUMN products.language_code IS 'Language code (e.g., en, tw, cn) - part of composite PK';
