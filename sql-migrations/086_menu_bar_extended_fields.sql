-- Migration: Add extended menu bar fields to landing_pages
-- Adds logo position and right-side utility options

-- Add logo_position column (left or center)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'left';

-- Add right-side utility toggles
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT true;

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS show_account BOOLEAN DEFAULT true;

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS show_cart BOOLEAN DEFAULT true;

-- Add utility URLs
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS account_url TEXT DEFAULT '/account';

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS cart_url TEXT DEFAULT '/cart';

-- Add comments for documentation
COMMENT ON COLUMN landing_pages.logo_position IS 'Logo position: left or center. Affects mobile layout behavior.';
COMMENT ON COLUMN landing_pages.show_search IS 'Show search bar in menu bar right side';
COMMENT ON COLUMN landing_pages.show_account IS 'Show My Account link in menu bar right side';
COMMENT ON COLUMN landing_pages.show_cart IS 'Show Shopping Cart icon in menu bar right side';
COMMENT ON COLUMN landing_pages.account_url IS 'URL for My Account link';
COMMENT ON COLUMN landing_pages.cart_url IS 'URL for Shopping Cart link';
