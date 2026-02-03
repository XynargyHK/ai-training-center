-- Migration: Create product_bundles table for SkinCoach bundle management
-- Date: 2024-12-03
-- Features: Fixed bundles, subscription bundles, discount by % or $

-- Create product_bundles table
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,

  -- Bundle type
  bundle_type TEXT NOT NULL DEFAULT 'fixed' CHECK (bundle_type IN ('fixed', 'subscription')),

  -- Products in bundle (stored as JSONB array)
  -- Format: [{"product_id": "uuid", "quantity": 1}, ...]
  products JSONB NOT NULL DEFAULT '[]',

  -- Pricing
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  savings DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Subscription options
  subscription_duration TEXT CHECK (subscription_duration IN ('1_month', '3_month', '6_month', '12_month')),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique handle per business unit
  UNIQUE(business_unit_id, handle)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_bundles_business_unit ON product_bundles(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_handle ON product_bundles(handle);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON product_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_product_bundles_featured ON product_bundles(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_bundles_type ON product_bundles(bundle_type);

-- Enable RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active bundles"
  ON product_bundles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can do anything with bundles"
  ON product_bundles
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE product_bundles IS 'Product bundles for e-commerce with discount and subscription support';
