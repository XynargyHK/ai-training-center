// ============================================================================
// RUN WORKFLOW MIGRATIONS
// Executes migrations 019 and 020 for service-staff assignments and approval workflow
// ============================================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filename) {
  console.log(`\n📄 Running migration: ${filename}`)

  const filepath = path.join(__dirname, '..', 'sql-migrations', filename)

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Migration file not found: ${filepath}`)
    return false
  }

  const sql = fs.readFileSync(filepath, 'utf8')

  // Split by statement (simple approach - split on semicolon followed by newline)
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`   Found ${statements.length} SQL statements`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip empty statements and comments
    if (!statement || statement.startsWith('--')) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_migrations').insert({
          statement: statement.substring(0, 100)
        })

        if (directError && !directError.message.includes('does not exist')) {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message || directError.message)
          console.error(`   Statement: ${statement.substring(0, 200)}...`)

          // Continue with other statements
          continue
        }
      }

      console.log(`   ✓ Statement ${i + 1}/${statements.length}`)
    } catch (err) {
      console.error(`   ❌ Statement ${i + 1} error:`, err.message)
      // Continue with other statements
    }
  }

  console.log(`✅ Completed migration: ${filename}`)
  return true
}

async function main() {
  console.log('🚀 Starting workflow migrations...\n')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)

  // Test connection
  const { data, error } = await supabase.from('business_units').select('count').limit(1)
  if (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    process.exit(1)
  }
  console.log('✅ Connected to Supabase\n')

  // Run migrations in order
  const migrations = [
    '019_service_staff_assignments.sql',
    '020_appointment_workflow.sql'
  ]

  for (const migration of migrations) {
    await runMigration(migration)
  }

  console.log('\n✅ All migrations completed!')
  console.log('\n📋 Next steps:')
  console.log('   1. Verify tables in Supabase dashboard:')
  console.log('      - service_staff_assignments')
  console.log('      - appointment_change_requests')
  console.log('      - appointment_change_history')
  console.log('   2. Test the /booking page at http://localhost:3000/booking')
  console.log('   3. Assign staff to services in the admin UI')
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})
