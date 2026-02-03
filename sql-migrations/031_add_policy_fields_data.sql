-- Migration 031: Add fields_data to kb_policies for structured policy forms

ALTER TABLE kb_policies
ADD COLUMN IF NOT EXISTS fields_data JSONB;

-- Add is_active column if not exists
ALTER TABLE kb_policies
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
