const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addStaticHeroColumns() {
  console.log('🚀 Adding static hero columns to landing_pages table...')

  const queries = [
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'carousel'`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_bg TEXT`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_align TEXT DEFAULT 'center'`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_headline TEXT`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_subheadline TEXT`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_content TEXT`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_cta_text TEXT`,
    `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS hero_static_cta_url TEXT`
  ]

  for (const query of queries) {
    console.log(`\n📝 Running: ${query}`)
    const { error } = await supabase.rpc('exec_sql', { sql: query })

    if (error) {
      console.error('❌ Error:', error)
    } else {
      console.log('✅ Success')
    }
  }

  console.log('\n✅ All columns added successfully!')
}

addStaticHeroColumns().catch(console.error)
