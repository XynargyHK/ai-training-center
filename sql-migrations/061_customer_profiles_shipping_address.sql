-- ============================================
-- Migration 061: Add shipping_address to customer_profiles
-- ============================================
-- Stores customer shipping address for checkout pre-fill

ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS shipping_address JSONB;

COMMENT ON COLUMN customer_profiles.shipping_address IS 'Customer shipping address as JSON: {address, city, state, postal_code, country}';
