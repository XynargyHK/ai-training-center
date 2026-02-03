-- Product Add-on Matches table
-- Stores which add-ons are compatible/matched with which base products

CREATE TABLE IF NOT EXISTS product_addon_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, addon_product_id),
  CHECK (product_id != addon_product_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_addon_matches_product ON product_addon_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addon_matches_addon ON product_addon_matches(addon_product_id);

-- Comment
COMMENT ON TABLE product_addon_matches IS 'Stores which add-on products are compatible with which base products';
