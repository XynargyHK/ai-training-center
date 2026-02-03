-- Product Taxonomy Reset
-- Industry-standard 4-layer model: Categories → Types → Attributes → Tags
-- This replaces the old skin_concerns/booster_concern_mapping approach

-- ============================================
-- LAYER 1: CATEGORIES (Hierarchical Navigation)
-- ============================================

-- Template categories (default categories for each industry)
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business unit categories (actual categories used)
-- Already exists as product_categories, just add template reference
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS template_category_id UUID REFERENCES template_categories(id);

-- ============================================
-- LAYER 2: PRODUCT TYPES (What the product IS)
-- ============================================

-- Template product types (default types for each industry)
CREATE TABLE IF NOT EXISTS template_product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    description TEXT,
    is_addon BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- product_types table already exists, add template reference
ALTER TABLE product_types
ADD COLUMN IF NOT EXISTS template_type_id UUID REFERENCES template_product_types(id);

-- ============================================
-- LAYER 3: ATTRIBUTES (Filterable Features)
-- ============================================

-- Template attributes (default attributes/concerns for each industry)
CREATE TABLE IF NOT EXISTS template_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- "Skin Concerns", "Dietary Needs", etc.
    handle TEXT NOT NULL,                  -- "skin_concerns", "dietary_needs"
    attribute_type TEXT NOT NULL,          -- 'concern', 'feature', 'constraint', 'preference'
    input_type TEXT DEFAULT 'multi_select', -- 'single_select', 'multi_select', 'range', 'boolean'
    description TEXT,
    is_filterable BOOLEAN DEFAULT TRUE,    -- Show in filters/quiz
    is_required BOOLEAN DEFAULT FALSE,     -- Required for products
    is_category_linked BOOLEAN DEFAULT FALSE, -- Options belong to specific categories (e.g., skin concerns)
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template attribute options (the possible values)
CREATE TABLE IF NOT EXISTS template_attribute_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID REFERENCES template_attributes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL, -- For category-linked options (e.g., Face→Wrinkles)
    name TEXT NOT NULL,                    -- "Acne", "Aging", "Vegan", etc.
    handle TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business unit attributes (actual attributes used)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id TEXT NOT NULL,
    template_attribute_id UUID REFERENCES template_attributes(id),
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    attribute_type TEXT NOT NULL,          -- 'concern', 'feature', 'constraint', 'preference'
    input_type TEXT DEFAULT 'multi_select',
    description TEXT,
    is_filterable BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    is_category_linked BOOLEAN DEFAULT FALSE, -- Options belong to specific categories
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit_id, handle)
);

-- Business unit attribute options
CREATE TABLE IF NOT EXISTS product_attribute_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL, -- For category-linked options
    template_option_id UUID REFERENCES template_attribute_options(id),
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product attribute values (links products to their attribute options)
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
    option_id UUID REFERENCES product_attribute_options(id) ON DELETE CASCADE,
    -- For addon effectiveness scoring (like booster_concern_mapping)
    effectiveness_rating INTEGER DEFAULT 3 CHECK (effectiveness_rating BETWEEN 1 AND 5),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, option_id)
);

-- ============================================
-- LAYER 4: TAGS (Marketing Labels)
-- ============================================

-- Template tags
CREATE TABLE IF NOT EXISTS template_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    tag_type TEXT DEFAULT 'general',       -- 'general', 'promotion', 'badge', 'collection'
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business unit tags
CREATE TABLE IF NOT EXISTS product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id TEXT NOT NULL,
    template_tag_id UUID REFERENCES template_tags(id),
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    tag_type TEXT DEFAULT 'general',
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit_id, handle)
);

-- Product tag assignments
CREATE TABLE IF NOT EXISTS product_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, tag_id)
);

-- ============================================
-- ADDON COMPATIBILITY (Which products work together)
-- ============================================

-- Template addon rules (which types can be addons for which)
CREATE TABLE IF NOT EXISTS template_addon_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
    base_type_id UUID REFERENCES template_product_types(id) ON DELETE CASCADE,
    addon_type_id UUID REFERENCES template_product_types(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE,
    max_addons INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER PROFILE ATTRIBUTES (Quiz answers)
-- ============================================

-- Customer attribute values (replaces customer_concerns)
CREATE TABLE IF NOT EXISTS customer_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
    option_id UUID REFERENCES product_attribute_options(id) ON DELETE CASCADE,
    severity INTEGER DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
    is_priority BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, option_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_template_categories_template ON template_categories(template_id);
CREATE INDEX IF NOT EXISTS idx_template_product_types_template ON template_product_types(template_id);
CREATE INDEX IF NOT EXISTS idx_template_attributes_template ON template_attributes(template_id);
CREATE INDEX IF NOT EXISTS idx_template_attribute_options_attr ON template_attribute_options(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_bu ON product_attributes(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_options_attr ON product_attribute_options(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_option ON product_attribute_values(option_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_bu ON product_tags(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_product ON product_tag_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_attribute_values_profile ON customer_attribute_values(profile_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_addon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_attribute_values ENABLE ROW LEVEL SECURITY;

-- Public read for templates
CREATE POLICY "Template categories public read" ON template_categories FOR SELECT USING (true);
CREATE POLICY "Template product types public read" ON template_product_types FOR SELECT USING (true);
CREATE POLICY "Template attributes public read" ON template_attributes FOR SELECT USING (true);
CREATE POLICY "Template attribute options public read" ON template_attribute_options FOR SELECT USING (true);
CREATE POLICY "Template addon rules public read" ON template_addon_rules FOR SELECT USING (true);
CREATE POLICY "Template tags public read" ON template_tags FOR SELECT USING (true);

-- Service role full access for templates
CREATE POLICY "Template categories service" ON template_categories FOR ALL USING (true);
CREATE POLICY "Template product types service" ON template_product_types FOR ALL USING (true);
CREATE POLICY "Template attributes service" ON template_attributes FOR ALL USING (true);
CREATE POLICY "Template attribute options service" ON template_attribute_options FOR ALL USING (true);
CREATE POLICY "Template addon rules service" ON template_addon_rules FOR ALL USING (true);
CREATE POLICY "Template tags service" ON template_tags FOR ALL USING (true);

-- Business unit data policies
CREATE POLICY "Product attributes public read" ON product_attributes FOR SELECT USING (true);
CREATE POLICY "Product attributes service" ON product_attributes FOR ALL USING (true);
CREATE POLICY "Product attribute options public read" ON product_attribute_options FOR SELECT USING (true);
CREATE POLICY "Product attribute options service" ON product_attribute_options FOR ALL USING (true);
CREATE POLICY "Product attribute values public read" ON product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Product attribute values service" ON product_attribute_values FOR ALL USING (true);
CREATE POLICY "Product tags public read" ON product_tags FOR SELECT USING (true);
CREATE POLICY "Product tags service" ON product_tags FOR ALL USING (true);
CREATE POLICY "Product tag assignments public read" ON product_tag_assignments FOR SELECT USING (true);
CREATE POLICY "Product tag assignments service" ON product_tag_assignments FOR ALL USING (true);
CREATE POLICY "Customer attribute values public read" ON customer_attribute_values FOR SELECT USING (true);
CREATE POLICY "Customer attribute values service" ON customer_attribute_values FOR ALL USING (true);
