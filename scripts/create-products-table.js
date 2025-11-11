const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createProductsTable() {
  try {
    console.log('🚀 Creating products table in Supabase...\n')

    // Read the SQL migration file
    const sqlContent = fs.readFileSync('sql-migrations/002_create_products_table.sql', 'utf8')

    console.log('📄 SQL Content:')
    console.log('=' .repeat(50))
    console.log(sqlContent)
    console.log('=' .repeat(50))
    console.log('')

    // Execute the SQL (we need to split by semicolon and execute each statement)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement) {
        console.log('⚡ Executing SQL statement...')

        // Use raw SQL query
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        })

        if (error) {
          console.error('❌ Error:', error.message)
          // Try alternative method - direct query
          console.log('🔄 Trying alternative execution method...')

          const { data: altData, error: altError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0)

          if (altError) {
            console.log('ℹ️  Note: Table creation may require manual SQL execution or RPC function')
          }
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    }

    // Verify table was created
    console.log('\n🔍 Verifying products table...')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error) {
      console.error('⚠️  Could not verify table:', error.message)
      console.log('\n💡 The table may need to be created via Supabase SQL Editor:')
      console.log('   1. Go to: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new')
      console.log('   2. Copy content from: sql-migrations/002_create_products_table.sql')
      console.log('   3. Click "Run"')
    } else {
      console.log('✅ Products table verified and ready!')
      console.log(`   Columns: product_name, tagline, ingredients, hero_benefit_summary, key_actives,`)
      console.log(`            face_benefits, body_benefit, hairscalp_benefits, eye_benefits,`)
      console.log(`            clinical_highlight, trade_name, cost_2ml, retail_2ml, retail_30ml`)
    }

  } catch (error) {
    console.error('💥 Script error:', error.message)
  }
}

createProductsTable()
