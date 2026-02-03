-- Migration: Dynamic Product Templates System
-- Allows businesses to choose from 21 industry templates or create custom fields
-- Also supports URL import for extracting fields from reference websites

-- 1. Create product_templates table (21 industry templates)
CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create template_fields table (predefined fields per template)
CREATE TABLE IF NOT EXISTS template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
  field_key VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, rich_text, number, boolean, select, multi_select, date, url, image
  field_options JSONB, -- for select/multi_select: [{value, label}], for number: {min, max, step}
  display_section VARCHAR(50) DEFAULT 'main', -- main, accordion, tab, sidebar
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create business_unit_product_config table (links BU to template + custom fields)
CREATE TABLE IF NOT EXISTS business_unit_product_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL,
  reference_url TEXT, -- URL used to extract fields
  custom_config JSONB DEFAULT '{}', -- any template overrides
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id)
);

-- 4. Create product_field_definitions table (custom fields per business unit)
CREATE TABLE IF NOT EXISTS product_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  field_key VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  field_options JSONB,
  display_section VARCHAR(50) DEFAULT 'main',
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  is_from_template BOOLEAN DEFAULT FALSE, -- true if copied from template
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id, field_key)
);

-- 5. Create product_custom_values table (stores actual values for custom fields)
CREATE TABLE IF NOT EXISTS product_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES product_field_definitions(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number DECIMAL,
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, field_definition_id)
);

-- 6. Add comprehensive pricing fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2); -- original/strikethrough price
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2); -- for profit calculation
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2);

-- 7. Add inventory fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- 8. Add display fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'; -- ["new", "sale", "bestseller", "limited"]

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_bu_product_config_bu ON business_unit_product_config(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_field_defs_bu ON product_field_definitions(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_values_product ON product_custom_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_values_field ON product_custom_values(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE track_inventory = TRUE;

-- 10. Enable RLS
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_unit_product_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_custom_values ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies (public read, authenticated write)
CREATE POLICY "product_templates_select" ON product_templates FOR SELECT USING (true);
CREATE POLICY "product_templates_all" ON product_templates FOR ALL USING (true);

CREATE POLICY "template_fields_select" ON template_fields FOR SELECT USING (true);
CREATE POLICY "template_fields_all" ON template_fields FOR ALL USING (true);

CREATE POLICY "bu_product_config_select" ON business_unit_product_config FOR SELECT USING (true);
CREATE POLICY "bu_product_config_all" ON business_unit_product_config FOR ALL USING (true);

CREATE POLICY "product_field_defs_select" ON product_field_definitions FOR SELECT USING (true);
CREATE POLICY "product_field_defs_all" ON product_field_definitions FOR ALL USING (true);

CREATE POLICY "product_custom_values_select" ON product_custom_values FOR SELECT USING (true);
CREATE POLICY "product_custom_values_all" ON product_custom_values FOR ALL USING (true);
