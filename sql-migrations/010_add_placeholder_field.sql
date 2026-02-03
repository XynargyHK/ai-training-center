-- Add is_placeholder field to knowledge_base table
-- This field marks entries that need manual content addition (e.g., PowerPoint files, image-based PDFs)

ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN knowledge_base.is_placeholder IS 'Indicates if this entry is a placeholder that needs manual content addition';

-- Create index for faster queries filtering by placeholder status
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_placeholder
ON knowledge_base(is_placeholder)
WHERE is_placeholder = true;
