-- Migration: Add menu bar fields to landing_pages
-- Allows customization of the navigation menu

-- Add menu_items column (JSONB array of menu items)
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[
  {"label": "Home", "url": "#", "enabled": true},
  {"label": "Shop", "url": "#shop", "enabled": true},
  {"label": "About", "url": "#about", "enabled": false},
  {"label": "Contact", "url": "#contact", "enabled": false}
]'::jsonb;

-- Add logo_url column
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add logo_text column
ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS logo_text TEXT;

-- Add comments for documentation
COMMENT ON COLUMN landing_pages.menu_items IS 'Array of menu items with label, url, and enabled properties';
COMMENT ON COLUMN landing_pages.logo_url IS 'URL of the logo image (optional)';
COMMENT ON COLUMN landing_pages.logo_text IS 'Text to display as logo if no image (brand name)';
