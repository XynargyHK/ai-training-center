-- Migration 030: E-commerce Bundling System
-- Creates tables for categories, pricing tiers, product add-ons, bundles, and cart

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_kb_categories_business_unit ON kb_categories(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);

-- ============================================
-- 2. PRICING TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit_id, name)
);

CREATE INDEX IF NOT EXISTS idx_kb_pricing_tiers_business_unit ON kb_pricing_tiers(business_unit_id);

-- ============================================
-- 3. ALTER KB_PRODUCTS - Add product_type and tier
-- ============================================
-- Add product_type column (base product or add-on/booster)
ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'base' CHECK (product_type IN ('base', 'addon'));

-- Add min_tier_id for tier restrictions on add-ons
ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS min_tier_id UUID REFERENCES kb_pricing_tiers(id) ON DELETE SET NULL;

-- Add compare_at_price for showing discounts
ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);

-- Add stock tracking
ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false;

ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add display order
ALTER TABLE kb_products
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_kb_products_type ON kb_products(product_type);
CREATE INDEX IF NOT EXISTS idx_kb_products_tier ON kb_products(min_tier_id);

-- ============================================
-- 4. PRODUCT-CATEGORY MAPPING (Step 1 Matrix)
-- ============================================
CREATE TABLE IF NOT EXISTS kb_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES kb_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES kb_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_product_categories_product ON kb_product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_kb_product_categories_category ON kb_product_categories(category_id);

-- ============================================
-- 5. PRODUCT-ADDON MAPPING (Step 2 Assignment)
-- ============================================
CREATE TABLE IF NOT EXISTS kb_product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES kb_products(id) ON DELETE CASCADE,
    addon_product_id UUID NOT NULL REFERENCES kb_products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, addon_product_id),
    CHECK (product_id != addon_product_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_product_addons_product ON kb_product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_kb_product_addons_addon ON kb_product_addons(addon_product_id);

-- ============================================
-- 6. BUNDLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    bundle_type TEXT NOT NULL DEFAULT 'fixed' CHECK (bundle_type IN ('fixed', 'build_your_own')),

    -- Pricing
    fixed_price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2),

    -- Tier restriction (optional)
    pricing_tier_id UUID REFERENCES kb_pricing_tiers(id) ON DELETE SET NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- Images/media
    image_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_bundles_business_unit ON kb_bundles(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_bundles_type ON kb_bundles(bundle_type);
CREATE INDEX IF NOT EXISTS idx_kb_bundles_tier ON kb_bundles(pricing_tier_id);

-- ============================================
-- 7. BUNDLE SLOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_bundle_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES kb_bundles(id) ON DELETE CASCADE,

    -- For fixed bundles: specific product
    product_id UUID REFERENCES kb_products(id) ON DELETE CASCADE,

    -- For BYO bundles: slot definition
    slot_name TEXT,
    slot_description TEXT,
    is_required BOOLEAN DEFAULT true,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,

    -- Allowed products/categories for BYO slots
    allowed_category_ids UUID[],
    allowed_product_ids UUID[],

    -- Quantity and pricing
    quantity INTEGER DEFAULT 1,
    slot_discount_type TEXT CHECK (slot_discount_type IN ('percentage', 'fixed_amount')),
    slot_discount_value DECIMAL(10,2),

    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_bundle_slots_bundle ON kb_bundle_slots(bundle_id);
CREATE INDEX IF NOT EXISTS idx_kb_bundle_slots_product ON kb_bundle_slots(product_id);

-- ============================================
-- 8. SHOPPING CART TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    session_id TEXT,
    user_id UUID,

    -- Cart status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'expired')),

    -- Totals (calculated)
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_total DECIMAL(10,2) DEFAULT 0,
    tax_total DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    currency TEXT DEFAULT 'USD',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_kb_carts_business_unit ON kb_carts(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_carts_session ON kb_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_carts_user ON kb_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_carts_status ON kb_carts(status);

-- ============================================
-- 9. CART ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES kb_carts(id) ON DELETE CASCADE,

    -- Item type
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'bundle')),
    product_id UUID REFERENCES kb_products(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES kb_bundles(id) ON DELETE CASCADE,

    -- Quantity and pricing
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,

    -- For BYO bundles: store selected products per slot
    bundle_selections JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (
        (item_type = 'product' AND product_id IS NOT NULL AND bundle_id IS NULL) OR
        (item_type = 'bundle' AND bundle_id IS NOT NULL AND product_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_kb_cart_items_cart ON kb_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_kb_cart_items_product ON kb_cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_kb_cart_items_bundle ON kb_cart_items(bundle_id);

-- ============================================
-- 10. CART ITEM ADD-ONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kb_cart_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_item_id UUID NOT NULL REFERENCES kb_cart_items(id) ON DELETE CASCADE,
    addon_product_id UUID NOT NULL REFERENCES kb_products(id) ON DELETE CASCADE,

    -- Which product in the cart item this addon is for (for bundles)
    for_product_id UUID REFERENCES kb_products(id) ON DELETE CASCADE,

    -- Pricing
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_cart_item_addons_item ON kb_cart_item_addons(cart_item_id);
CREATE INDEX IF NOT EXISTS idx_kb_cart_item_addons_addon ON kb_cart_item_addons(addon_product_id);

-- ============================================
-- 11. RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_bundle_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_cart_item_addons ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "Service role full access on kb_categories" ON kb_categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_pricing_tiers" ON kb_pricing_tiers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_product_categories" ON kb_product_categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_product_addons" ON kb_product_addons
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_bundles" ON kb_bundles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_bundle_slots" ON kb_bundle_slots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_carts" ON kb_carts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_cart_items" ON kb_cart_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on kb_cart_item_addons" ON kb_cart_item_addons
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 12. HELPER FUNCTIONS
-- ============================================

-- Function to get compatible addons for a product based on shared categories
CREATE OR REPLACE FUNCTION get_compatible_addons(p_product_id UUID, p_tier_id UUID DEFAULT NULL)
RETURNS TABLE (
    addon_id UUID,
    addon_name TEXT,
    addon_price DECIMAL(10,2),
    is_assigned BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id as addon_id,
        a.name as addon_name,
        a.price as addon_price,
        EXISTS(
            SELECT 1 FROM kb_product_addons pa
            WHERE pa.product_id = p_product_id AND pa.addon_product_id = a.id
        ) as is_assigned
    FROM kb_products a
    WHERE a.product_type = 'addon'
    AND a.is_active = true
    AND (a.min_tier_id IS NULL OR p_tier_id IS NULL OR a.min_tier_id <= p_tier_id)
    AND EXISTS (
        -- Addon shares at least one category with the product
        SELECT 1 FROM kb_product_categories pc1
        JOIN kb_product_categories pc2 ON pc1.category_id = pc2.category_id
        WHERE pc1.product_id = p_product_id
        AND pc2.product_id = a.id
    )
    ORDER BY a.display_order, a.name;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cart totals
CREATE OR REPLACE FUNCTION calculate_cart_totals(p_cart_id UUID)
RETURNS void AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_discount_total DECIMAL(10,2);
BEGIN
    -- Calculate subtotal from cart items
    SELECT
        COALESCE(SUM(ci.line_total), 0),
        COALESCE(SUM(ci.discount_amount * ci.quantity), 0)
    INTO v_subtotal, v_discount_total
    FROM kb_cart_items ci
    WHERE ci.cart_id = p_cart_id;

    -- Add addon totals
    SELECT
        v_subtotal + COALESCE(SUM(cia.line_total), 0)
    INTO v_subtotal
    FROM kb_cart_item_addons cia
    JOIN kb_cart_items ci ON ci.id = cia.cart_item_id
    WHERE ci.cart_id = p_cart_id;

    -- Update cart
    UPDATE kb_carts
    SET
        subtotal = v_subtotal,
        discount_total = v_discount_total,
        total = v_subtotal - v_discount_total,
        updated_at = NOW()
    WHERE id = p_cart_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. SEED DEFAULT PRICING TIERS (Optional)
-- ============================================
-- These are example tiers - each business unit will define their own
-- INSERT INTO kb_pricing_tiers (business_unit_id, name, description, display_order)
-- VALUES
--     ('your-business-unit-id', 'Basic', 'Entry level pricing', 1),
--     ('your-business-unit-id', 'Premium', 'Mid-tier pricing', 2),
--     ('your-business-unit-id', 'Luxury', 'High-end pricing', 3);
