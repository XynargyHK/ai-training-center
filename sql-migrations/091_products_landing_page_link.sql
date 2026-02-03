-- ============================================================================
-- PRODUCTS - LANDING PAGE LINK
-- Add fields to connect products with dedicated landing pages
-- ============================================================================

-- Add landing page fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_landing_page BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS landing_page_reference_url TEXT;

-- Add product_id to landing_pages table to link them
-- Note: A product can have ONE dedicated landing page
-- But a landing page can only be for ONE product (1:1 relationship)
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_has_landing_page ON products(has_landing_page) WHERE has_landing_page = true;
CREATE INDEX IF NOT EXISTS idx_landing_pages_product_id ON landing_pages(product_id) WHERE product_id IS NOT NULL;

-- Note: We keep the business_unit_id in landing_pages for general business unit landing pages
-- When product_id IS NULL, it's a general business unit landing page
-- When product_id IS NOT NULL, it's a dedicated product landing page
