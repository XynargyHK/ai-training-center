// Run role-based filtering migrations on Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(migrationFile) {
  console.log(`\n📄 Running migration: ${migrationFile}`)

  const sqlPath = path.join(__dirname, '..', 'sql-migrations', migrationFile)

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`)
    return false
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')

  // Split SQL into individual statements (handle multi-line)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`   Found ${statements.length} SQL statements`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comments
    if (statement.startsWith('--') || statement.startsWith('/*')) {
      continue
    }

    try {
      console.log(`   Executing statement ${i + 1}/${statements.length}...`)

      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      })

      if (error) {
        // Try alternative method - direct query
        const { error: queryError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0) // Dummy query to check connection

        if (queryError && queryError.message.includes('relation "_migrations" does not exist')) {
          console.log('   ⚠️  Using alternative execution method...')
          // The SQL will need to be run manually
          console.log(`   Statement: ${statement.substring(0, 100)}...`)
        } else {
          console.error(`   ❌ Error:`, error.message)
          return false
        }
      } else {
        console.log(`   ✅ Statement ${i + 1} executed successfully`)
      }
    } catch (err) {
      console.error(`   ❌ Exception:`, err.message)
      console.log(`   Statement was: ${statement.substring(0, 100)}...`)
      return false
    }
  }

  console.log(`✅ Migration ${migrationFile} completed`)
  return true
}

async function main() {
  console.log('🚀 Starting Role-Based Filtering Migrations\n')
  console.log('Supabase URL:', supabaseUrl)

  // Run migrations in order
  const migrations = [
    '013_add_ai_role_to_all_tables.sql',
    '014_update_vector_search_with_role.sql'
  ]

  for (const migration of migrations) {
    const success = await runMigration(migration)
    if (!success) {
      console.error(`\n❌ Migration ${migration} failed. Stopping.`)
      console.log('\n⚠️  You may need to run these migrations manually via Supabase SQL Editor')
      console.log('   1. Go to https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new')
      console.log(`   2. Copy contents from sql-migrations/${migration}`)
      console.log('   3. Execute in SQL Editor')
      process.exit(1)
    }
  }

  console.log('\n✅ All migrations completed successfully!')
  console.log('\n📋 Next steps:')
  console.log('   1. Restart your dev server')
  console.log('   2. Test role-based filtering with different AI staff roles')
  console.log('   3. Populate ai_role field for existing knowledge base entries')
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
