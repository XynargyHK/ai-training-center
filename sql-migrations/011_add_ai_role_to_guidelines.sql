-- Add AI role field to guidelines table for role-specific guidelines
-- Roles: 'coach', 'sales', 'customer-service', 'scientist'

ALTER TABLE guidelines
ADD COLUMN IF NOT EXISTS ai_role VARCHAR(50);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_guidelines_role ON guidelines(business_unit_id, ai_role);

-- Add comments for documentation
COMMENT ON COLUMN guidelines.ai_role IS 'AI Staff role: coach, sales, customer-service, scientist';

-- Optional: Create audit table for tracking guideline changes
CREATE TABLE IF NOT EXISTS guideline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_id UUID REFERENCES guidelines(id) ON DELETE CASCADE,
  old_content TEXT,
  new_content TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guideline_history_guideline_id ON guideline_history(guideline_id);

COMMENT ON TABLE guideline_history IS 'Audit trail for guideline changes to debug AI behavior changes';
