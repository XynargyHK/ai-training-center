-- Migration 093: Add published_data column
-- Stores a permanent copy of the content at publish time.
-- Draft edits go to the row fields. Live page reads from published_data.
-- When admin clicks Publish, current content is copied into published_data.

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS published_data JSONB DEFAULT NULL;

-- Backfill: For pages already marked as published, copy their current content
-- so the live page keeps working after this migration.
UPDATE landing_pages
SET published_data = (
  to_jsonb(landing_pages.*)
  - 'id'
  - 'business_unit_id'
  - 'country'
  - 'language_code'
  - 'currency'
  - 'currency_symbol'
  - 'is_active'
  - 'is_published'
  - 'published_at'
  - 'published_data'
  - 'created_at'
  - 'updated_at'
)
WHERE is_published = true;
