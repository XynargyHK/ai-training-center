-- Add slug column to landing_pages for clean URL routing
-- e.g., /micro-infusion-system-face instead of /livechat?businessUnit=X&country=US&lang=en

ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique index: each slug must be unique (but NULLs are allowed)
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_slug_unique
  ON landing_pages(slug) WHERE slug IS NOT NULL;
