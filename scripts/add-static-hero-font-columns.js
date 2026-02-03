const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('Adding static hero font columns to landing_pages table...')

  const queries = [
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline_font_size TEXT DEFAULT '3.75rem'",
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline_font_family TEXT DEFAULT 'Josefin Sans'",
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline_font_size TEXT DEFAULT '1.25rem'",
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline_font_family TEXT DEFAULT 'Josefin Sans'",
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content_font_size TEXT DEFAULT '1.125rem'",
    "ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content_font_family TEXT DEFAULT 'Cormorant Garamond'"
  ]

  for (const query of queries) {
    console.log(`\nRunning: ${query}`)
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: query })

    if (error) {
      console.error('❌ Error:', error.message)
      if (!error.message.includes('already exists')) {
        process.exit(1)
      }
    } else {
      console.log('✅ Success')
    }
  }

  console.log('\n✅ Migration completed successfully!')
  process.exit(0)
}

runMigration()
