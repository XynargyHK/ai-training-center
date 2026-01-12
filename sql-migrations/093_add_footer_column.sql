ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS footer JSONB DEFAULT '{}'::jsonb;
