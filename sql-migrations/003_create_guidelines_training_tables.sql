-- ============================================================================
-- Migration 003: Create Guidelines and Training Data Tables
-- This migrates guidelines and training_data from JSON files to Supabase
-- ============================================================================

-- Create guidelines table
CREATE TABLE IF NOT EXISTS guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  -- Original fields from JSON
  original_id TEXT, -- Store original ID from JSON for reference
  category TEXT NOT NULL, -- faq, canned, roleplay, general
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guidelines
CREATE INDEX IF NOT EXISTS idx_guidelines_business_unit ON guidelines(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_guidelines_category ON guidelines(category);
CREATE INDEX IF NOT EXISTS idx_guidelines_original_id ON guidelines(original_id);

-- Create training_data table
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  -- Original fields from JSON
  original_id TEXT, -- Store original ID from JSON for reference
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[], -- Array of keywords
  variations TEXT[], -- Array of question variations
  tone TEXT DEFAULT 'professional', -- professional, friendly, expert, casual
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for training_data
CREATE INDEX IF NOT EXISTS idx_training_data_business_unit ON training_data(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_training_data_category ON training_data(category);
CREATE INDEX IF NOT EXISTS idx_training_data_active ON training_data(active);
CREATE INDEX IF NOT EXISTS idx_training_data_keywords ON training_data USING GIN(keywords);

-- Add RLS (Row Level Security) policies
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service_role full access
CREATE POLICY "Service role can do everything on guidelines" ON guidelines
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on training_data" ON training_data
  FOR ALL USING (true);

-- Policy: Allow authenticated users to read
CREATE POLICY "Users can read guidelines" ON guidelines
  FOR SELECT USING (true);

CREATE POLICY "Users can read training_data" ON training_data
  FOR SELECT USING (true);

SELECT 'Guidelines and Training Data tables created successfully! ✅' AS status;
