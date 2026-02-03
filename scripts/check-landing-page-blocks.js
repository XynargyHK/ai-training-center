const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBlocks() {
  console.log('🔍 Checking landing page blocks...\n')

  // Fetch all landing pages with blocks
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('id, business_unit_id, country, language_code, blocks')

  if (error) {
    console.error('Error fetching landing pages:', error)
    return
  }

  console.log(`Found ${pages.length} total landing pages\n`)

  pages.forEach((page, idx) => {
    console.log(`\n${idx + 1}. Landing Page ID: ${page.id}`)
    console.log(`   Business Unit: ${page.business_unit_id}`)
    console.log(`   Locale: ${page.country}/${page.language_code}`)

    if (page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0) {
      console.log(`   Blocks (${page.blocks.length}):`)
      page.blocks.forEach((block, bidx) => {
        console.log(`     ${bidx + 1}. ${block.type} - "${block.name}" (order: ${block.order})`)
      })
    } else {
      console.log(`   Blocks: None`)
    }
  })
}

checkBlocks().catch(console.error)
