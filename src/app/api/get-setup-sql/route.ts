import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns the exact SQL needed to set up the database
 * Visit: http://localhost:3000/api/get-setup-sql
 */
export async function GET(request: NextRequest) {
  const sql = `-- ========================================
-- COMPLETE SUPABASE SETUP - COPY AND RUN THIS SQL
-- ========================================
-- Go to: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new
-- Copy everything below and click "Run"
-- ========================================

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

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

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_trade_name ON products(trade_name);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow service role full access
CREATE POLICY "Service role has full access" ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT 'Setup complete! Run: node scripts/import-products-data.js' AS next_step;`

  return new NextResponse(sql, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Copy the SQL from GET /api/get-setup-sql',
    instructions: [
      '1. Visit: http://localhost:3000/api/get-setup-sql',
      '2. Copy all the SQL',
      '3. Go to: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new',
      '4. Paste and click Run',
      '5. Run: node scripts/import-products-data.js'
    ]
  })
}
