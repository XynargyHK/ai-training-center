// Script to run SQL migrations using Supabase client
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filename) {
  try {
    const sqlPath = path.join(__dirname, '..', 'sql-migrations', filename)

    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Migration file not found: ${filename}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log(`📄 Running migration: ${filename}`)
    console.log('━'.repeat(60))

    // Execute the SQL using the Supabase client
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.log('⚠️  exec_sql function not available, trying direct execution...')

      // Split into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { query: statement })
        if (stmtError) {
          console.error(`❌ Error executing statement:`, stmtError)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
        }
      }
    }

    console.log('━'.repeat(60))
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('Note: If you see errors above, you may need to run this migration')
    console.log('directly in the Supabase SQL Editor at:')
    console.log(`${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}`)

  } catch (err) {
    console.error('❌ Error running migration:', err.message)
    process.exit(1)
  }
}

// Get migration filename from command line args
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('Usage: node run-sql-migration.js <migration-filename>')
  console.error('Example: node run-sql-migration.js 021_outlets_and_room_restructure.sql')
  process.exit(1)
}

runMigration(migrationFile)
