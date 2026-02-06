-- Migration 101: Add tracking fields and link orders to auth users
--
-- Adds shipping tracking info and links orders to Supabase auth users

-- Add user_id to link orders to authenticated users (Supabase auth.users)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add tracking fields for shipping
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Update status field to use our new flow: processing -> shipped -> delivered
-- Default to 'processing' for new orders (payment already completed)
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'processing';

-- Add index for user_id lookups (My Account order history)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Add index for status lookups (admin filtering)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add comments
COMMENT ON COLUMN orders.user_id IS 'Links to Supabase auth.users for logged-in customers';
COMMENT ON COLUMN orders.shipping_carrier IS 'Shipping carrier name (e.g., FedEx, DHL, UPS)';
COMMENT ON COLUMN orders.tracking_number IS 'Shipping tracking number';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date';
COMMENT ON COLUMN orders.shipped_at IS 'When the order was shipped';
COMMENT ON COLUMN orders.delivered_at IS 'When the order was delivered';
