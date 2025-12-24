-- Migration: Add hero_slides column to landing_pages
-- Supports carousel with multiple slides, each with background image/video and text alignment

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS hero_slides JSONB DEFAULT '[
  {"headline": "", "subheadline": "", "content": "", "background_url": "", "background_type": "image", "cta_text": "Shop Now", "cta_url": "#shop", "text_align": "center"}
]'::jsonb;

COMMENT ON COLUMN landing_pages.hero_slides IS 'Array of hero carousel slides with headline, subheadline, content, background_url, background_type, cta_text, cta_url, text_align';
