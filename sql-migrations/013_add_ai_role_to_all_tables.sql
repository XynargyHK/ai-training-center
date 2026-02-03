-- Add AI role field to all knowledge tables for role-specific filtering
-- This allows each AI staff role to access only relevant information

-- Add ai_role to knowledge_base table
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS ai_role VARCHAR(50);

-- Add ai_role to training_data table
ALTER TABLE training_data
ADD COLUMN IF NOT EXISTS ai_role VARCHAR(50);

-- Add ai_role to faqs table
ALTER TABLE faqs
ADD COLUMN IF NOT EXISTS ai_role VARCHAR(50);

-- Create indexes for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_role ON knowledge_base(business_unit_id, ai_role);
CREATE INDEX IF NOT EXISTS idx_training_data_role ON training_data(business_unit_id, ai_role);
CREATE INDEX IF NOT EXISTS idx_faqs_role ON faqs(business_unit_id, ai_role);

-- Add comments explaining the field
COMMENT ON COLUMN knowledge_base.ai_role IS 'AI Staff role: coach, sales, customer-service, scientist, or NULL for all roles';
COMMENT ON COLUMN training_data.ai_role IS 'AI Staff role: coach, sales, customer-service, scientist, or NULL for all roles';
COMMENT ON COLUMN faqs.ai_role IS 'AI Staff role: coach, sales, customer-service, scientist, or NULL for all roles';

-- Note: NULL ai_role means the entry is accessible to ALL roles (general knowledge)
