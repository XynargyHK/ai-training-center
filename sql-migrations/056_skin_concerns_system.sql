-- ============================================
-- Migration 056: Skin Concerns System
-- ============================================
-- Creates a concern-based system for mapping customer pain points to boosters
-- This replaces the function-based system with a more customer-centric approach

-- 1. Create skin_concerns table
-- Each concern belongs to exactly ONE category (face, eye, body, scalp)
CREATE TABLE IF NOT EXISTS skin_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  handle VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('face', 'eye', 'body', 'scalp')),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id, handle)
);

-- 2. Create booster_concern_mapping table
-- Maps which boosters address which concerns, with effectiveness rating
CREATE TABLE IF NOT EXISTS booster_concern_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  concern_id UUID NOT NULL REFERENCES skin_concerns(id) ON DELETE CASCADE,
  effectiveness_rating INT DEFAULT 3 CHECK (effectiveness_rating BETWEEN 1 AND 5),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, concern_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_skin_concerns_business_unit ON skin_concerns(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_skin_concerns_category ON skin_concerns(category);
CREATE INDEX IF NOT EXISTS idx_skin_concerns_handle ON skin_concerns(handle);
CREATE INDEX IF NOT EXISTS idx_booster_concern_mapping_product ON booster_concern_mapping(product_id);
CREATE INDEX IF NOT EXISTS idx_booster_concern_mapping_concern ON booster_concern_mapping(concern_id);

-- 4. Add RLS policies
ALTER TABLE skin_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE booster_concern_mapping ENABLE ROW LEVEL SECURITY;

-- Policies for skin_concerns
CREATE POLICY "Allow public read access to skin_concerns"
  ON skin_concerns FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to skin_concerns"
  ON skin_concerns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to skin_concerns"
  ON skin_concerns FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete to skin_concerns"
  ON skin_concerns FOR DELETE
  USING (true);

-- Policies for booster_concern_mapping
CREATE POLICY "Allow public read access to booster_concern_mapping"
  ON booster_concern_mapping FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to booster_concern_mapping"
  ON booster_concern_mapping FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to booster_concern_mapping"
  ON booster_concern_mapping FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete to booster_concern_mapping"
  ON booster_concern_mapping FOR DELETE
  USING (true);

-- 5. Comments for documentation
COMMENT ON TABLE skin_concerns IS 'Master list of skin concerns/pain points that customers may have';
COMMENT ON COLUMN skin_concerns.category IS 'Body area: face, eye, body, or scalp';
COMMENT ON COLUMN skin_concerns.handle IS 'URL-friendly identifier';

COMMENT ON TABLE booster_concern_mapping IS 'Maps which boosters address which skin concerns';
COMMENT ON COLUMN booster_concern_mapping.effectiveness_rating IS 'How effective the booster is for this concern (1-5 stars)';
COMMENT ON COLUMN booster_concern_mapping.is_primary IS 'Whether this is a primary concern the booster targets';
