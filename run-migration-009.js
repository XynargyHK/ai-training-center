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
  },
  db: {
    schema: 'public'
  }
})

async function runMigration() {
  console.log('🚀 Running migration 009 - Proper RLS Policies...\n')

  const migrationPath = path.join(__dirname, 'sql-migrations', '009_proper_rls_policies.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Execute the entire migration as one query
  const { data, error } = await supabase.rpc('exec', { sql })

  if (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run this migration manually in your Supabase dashboard:')
    console.log('URL: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new')
    console.log('\nOr use the SQL Editor with this content:')
    console.log(sql)
    process.exit(1)
  }

  console.log('✅ Migration 009 completed successfully!')
  console.log('\n📖 Architecture:')
  console.log('   - RLS is enabled on all tables')
  console.log('   - Anon users can SELECT (read) only')
  console.log('   - All writes go through API routes with service key')
  console.log('\n🔄 Please refresh your browser')
}

runMigration().catch(err => {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
})
