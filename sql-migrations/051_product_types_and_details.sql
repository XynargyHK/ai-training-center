-- Migration: Add product_types table and update products with full detail fields
-- This creates a proper hierarchy: Category -> Type -> Product
-- Add-ons (like Boosters) are product types that can be linked to other products

-- 1. Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  description TEXT,
  is_addon BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(business_unit_id, handle)
);

-- 2. Add product_type_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL;

-- 3. Add all detail fields to products table (TEXT for full content, no truncation)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_benefit TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS key_actives TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS face_benefits TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS body_benefits TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hair_benefits TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS eye_benefits TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS clinical_studies TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);

-- 4. Create product_addons table to link add-on products to main products
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, addon_product_id)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_types_business_unit ON product_types(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_types_category ON product_types(category_id);
CREATE INDEX IF NOT EXISTS idx_product_types_is_addon ON product_types(is_addon);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_product ON product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon ON product_addons(addon_product_id);

-- 6. Enable RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for product_types
CREATE POLICY "product_types_select_policy" ON product_types FOR SELECT USING (true);
CREATE POLICY "product_types_insert_policy" ON product_types FOR INSERT WITH CHECK (true);
CREATE POLICY "product_types_update_policy" ON product_types FOR UPDATE USING (true);
CREATE POLICY "product_types_delete_policy" ON product_types FOR DELETE USING (true);

-- 8. RLS Policies for product_addons
CREATE POLICY "product_addons_select_policy" ON product_addons FOR SELECT USING (true);
CREATE POLICY "product_addons_insert_policy" ON product_addons FOR INSERT WITH CHECK (true);
CREATE POLICY "product_addons_update_policy" ON product_addons FOR UPDATE USING (true);
CREATE POLICY "product_addons_delete_policy" ON product_addons FOR DELETE USING (true);
