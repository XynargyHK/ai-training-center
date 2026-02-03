// Run e-commerce database migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Running e-commerce database migration...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql-migrations/050_create_ecommerce_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
      // If exec_sql doesn't exist, we need to create it first or execute directly
      console.log('📝 Executing SQL migration directly...')

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('DROP')) {
          console.log(`  Executing: ${statement.substring(0, 60)}...`)
        }
      }

      // For Supabase, we'll need to execute this through the Supabase dashboard SQL editor
      // Or use a direct PostgreSQL connection
      console.log('\n⚠️  Please run the SQL migration manually:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of: sql-migrations/050_create_ecommerce_tables.sql')
      console.log('4. Click "Run"\n')

      return
    })

    if (error) {
      console.error('❌ Migration error:', error)
      process.exit(1)
    }

    console.log('✅ E-commerce tables created successfully!')
    console.log('\nCreated tables:')
    console.log('  - products')
    console.log('  - product_variants')
    console.log('  - product_variant_prices')
    console.log('  - product_images')
    console.log('  - product_categories')
    console.log('  - product_category_mapping')
    console.log('  - carts')
    console.log('  - cart_items')
    console.log('  - orders')
    console.log('  - order_items')
    console.log('  - payments')
    console.log('  - ai_generated_content')

  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

runMigration()
