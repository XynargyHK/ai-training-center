-- ============================================================================
-- AUTO-MIGRATION: Upgrade Knowledge Base Table
-- This file is automatically applied by the system
-- ============================================================================

-- Add new columns to knowledge_base (safe - won't fail if exists)
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS media_files JSONB;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_file_id UUID;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS import_batch_id UUID;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS effective_until TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  detected_columns TEXT[],
  column_mappings JSONB,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  row_count INTEGER,
  entries_generated INTEGER,
  status TEXT DEFAULT 'active',
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kb_raw_data ON knowledge_base USING GIN (raw_data);
CREATE INDEX IF NOT EXISTS idx_kb_status ON knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_kb_source_file ON knowledge_base(source_file_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_business_unit ON uploaded_files(business_unit_id);

-- Success
SELECT 'Migration 001 applied successfully' AS result;
