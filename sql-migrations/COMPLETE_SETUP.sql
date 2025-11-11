-- ========================================
-- COMPLETE SUPABASE SETUP
-- ========================================
-- Copy this ENTIRE file and run it ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new
--
-- This will:
-- 1. Enable automatic SQL execution (RPC function)
-- 2. Create/upgrade knowledge_base table
-- 3. Create products table with Excel schema
-- 4. Enable all automatic features
-- ========================================

-- ========================================
-- PART 1: Enable Automatic SQL Execution
-- ========================================

CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

SELECT 'Step 1/3: RPC function created ✅' AS status;

-- ========================================
-- PART 2: Upgrade Knowledge Base Table
-- ========================================

-- Add new columns for file handling and dynamic data
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS media_files JSONB;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.0;

-- Create index for file tracking
CREATE INDEX IF NOT EXISTS idx_knowledge_base_file_name ON knowledge_base(file_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source_type ON knowledge_base(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);

SELECT 'Step 2/3: Knowledge base upgraded ✅' AS status;

-- ========================================
-- PART 3: Create Products Table
-- ========================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  -- Product information from Excel (14 columns)
  product_name TEXT,
  tagline TEXT,
  ingredients TEXT,
  hero_benefit_summary TEXT,
  key_actives TEXT,
  face_benefits TEXT,
  body_benefit TEXT,
  hairscalp_benefits TEXT,
  eye_benefits TEXT,
  clinical_highlight TEXT,
  trade_name TEXT,
  cost_2ml DECIMAL(10,2),
  retail_2ml TEXT,
  retail_30ml TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_trade_name ON products(trade_name);

SELECT 'Step 3/3: Products table created ✅' AS status;

-- ========================================
-- SETUP COMPLETE
-- ========================================

SELECT
  '🎉 SETUP COMPLETE! All tables and functions are ready.' AS message,
  'Run: node scripts/import-products-data.js' AS next_step;
