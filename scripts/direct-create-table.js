const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createTableDirectly() {
  try {
    console.log('🚀 Creating products table directly via Supabase API...\n')

    const createTableSQL = `
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

      CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
      CREATE INDEX IF NOT EXISTS idx_products_trade_name ON products(trade_name);
    `

    // Use Supabase REST API directly to execute SQL
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`

    console.log('📡 Sending SQL via REST API...')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql_query: createTableSQL
      })
    })

    if (!response.ok) {
      // RPC function might not exist, try alternative method
      console.log('⚠️  RPC function not available, using alternative method...\n')

      // Use pg connection via REST API
      const projectRef = 'utqxzbnbqwuxwonxhryn'
      const sqlUrl = `https://${projectRef}.supabase.co/rest/v1/`

      // Execute SQL statements one by one
      const statements = createTableSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))

      for (const statement of statements) {
        console.log('⚡ Executing:', statement.substring(0, 50) + '...')

        // Use the query endpoint
        const execResponse = await fetch(`${sqlUrl}`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: statement
          })
        })

        if (!execResponse.ok) {
          const error = await execResponse.text()
          console.log(`   ⚠️  ${error}`)
        } else {
          console.log('   ✅ Success')
        }
      }
    } else {
      console.log('✅ SQL executed via RPC function')
    }

    // Verify table was created
    console.log('\n🔍 Verifying products table...')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(0)

    if (error) {
      console.error('❌ Table verification failed:', error.message)
      console.log('\nℹ️  Table creation requires PostgreSQL access.')
      console.log('Please run: sql-migrations/COMPLETE_SETUP.sql in Supabase SQL Editor')
      return false
    }

    console.log('✅ Products table verified and ready!\n')
    return true

  } catch (error) {
    console.error('💥 Error:', error.message)
    return false
  }
}

createTableDirectly().then(success => {
  if (success) {
    console.log('🎉 Table created successfully!')
    console.log('\n📋 Next step: Run import script')
    console.log('   node scripts/import-products-data.js')
  } else {
    console.log('\n💡 Alternative: Run SQL manually in Supabase dashboard')
  }
})
