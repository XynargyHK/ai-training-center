-- Add enable_social_login flag to landing_pages table
ALTER TABLE landing_pages
  ADD COLUMN IF NOT EXISTS enable_social_login BOOLEAN DEFAULT false;

-- Also add to landing_page_locales if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'landing_page_locales') THEN
    ALTER TABLE landing_page_locales
      ADD COLUMN IF NOT EXISTS enable_social_login BOOLEAN DEFAULT false;
  END IF;
END $$;
