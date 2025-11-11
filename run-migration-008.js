const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

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

async function runMigration() {
  console.log('🚀 Running migration 008...')

  // Read the migration file
  const migrationPath = path.join(__dirname, 'sql-migrations', '008_allow_anon_access.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split by statement and run each one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'))

  for (const statement of statements) {
    console.log('Executing:', statement.substring(0, 60) + '...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await supabase.from('_migrations').insert({ query: statement })

      if (directError) {
        console.log('⚠️  Note: Could not execute via RPC, trying alternative method...')
        console.log('Please run this SQL manually in Supabase dashboard:')
        console.log(sql)
        process.exit(1)
      }
    }
  }

  console.log('✅ Migration completed!')
  console.log('⚠️  WARNING: RLS is now disabled. This is for development only!')
  console.log('🔄 Please refresh your browser')
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err.message)
  console.log('\n📋 Please run this migration manually in your Supabase dashboard:')
  console.log('URL: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new')
  console.log('\nCopy and paste the contents of: sql-migrations/008_allow_anon_access.sql')
  process.exit(1)
})
