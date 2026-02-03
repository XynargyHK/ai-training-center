// Script to run migration 027 using exec_sql function
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '..', 'sql-migrations', '027_create_profile_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📄 Running migration 027: Create Profile Tables')
    console.log('━'.repeat(60))

    // Try using exec_sql function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ exec_sql failed:', error.message)
      console.log('')
      console.log('Please run this migration manually in Supabase SQL Editor:')
      console.log(`${supabaseUrl}/project/_/sql/new`)
      console.log('')
      console.log('Copy the contents of: sql-migrations/027_create_profile_tables.sql')
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

runMigration()
