-- Add static hero columns to landing_pages table
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'carousel';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_bg TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_align TEXT DEFAULT 'center';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_cta_text TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_cta_url TEXT;

-- Add font customization columns for static hero
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline_font_size TEXT DEFAULT '3.75rem';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline_font_family TEXT DEFAULT 'Josefin Sans';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline_font_size TEXT DEFAULT '1.25rem';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline_font_family TEXT DEFAULT 'Josefin Sans';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content_font_size TEXT DEFAULT '1.125rem';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content_font_family TEXT DEFAULT 'Cormorant Garamond';
