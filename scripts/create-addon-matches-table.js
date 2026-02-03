const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTable() {
  console.log('Creating product_addon_matches table...')

  // Try creating the table via direct SQL using Supabase's method
  // We need to run this SQL in Supabase dashboard or use migrations

  const sql = `
    CREATE TABLE IF NOT EXISTS product_addon_matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      addon_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, addon_product_id),
      CHECK (product_id != addon_product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_product_addon_matches_product ON product_addon_matches(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_addon_matches_addon ON product_addon_matches(addon_product_id);
  `

  console.log('\n=== RUN THIS SQL IN SUPABASE DASHBOARD ===\n')
  console.log(sql)
  console.log('\n=========================================\n')

  // Test if table exists by trying to select from it
  const { error: testError } = await supabase
    .from('product_addon_matches')
    .select('id')
    .limit(1)

  if (testError) {
    console.log('Table does not exist yet. Please run the SQL above in Supabase dashboard.')
  } else {
    console.log('Table already exists!')
  }
}

createTable()
