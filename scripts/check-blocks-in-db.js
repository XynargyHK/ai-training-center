const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBlocks() {
  console.log('Checking blocks in database...\n')

  // Get skincoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, slug, name')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.log('❌ SkinCoach business unit not found')
    return
  }

  console.log(`✓ Found business unit: ${bu.name} (${bu.id})`)

  // Get landing page
  const { data: lp, error } = await supabase
    .from('landing_pages')
    .select('id, country, language_code, blocks, hero_static_headline')
    .eq('business_unit_id', bu.id)
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!lp) {
    console.log('❌ No landing page found')
    return
  }

  console.log(`\n✓ Landing Page: ${lp.country}-${lp.language_code}`)
  console.log('  Hero headline:', lp.hero_static_headline || '(none)')
  console.log('  Blocks in DB:', lp.blocks ? JSON.stringify(lp.blocks, null, 2) : '(none)')

  if (lp.blocks && Array.isArray(lp.blocks)) {
    console.log(`\n📦 Found ${lp.blocks.length} blocks:`)
    lp.blocks.forEach((block, idx) => {
      console.log(`\n  Block ${idx}:`)
      console.log(`    Type: ${block.type}`)
      console.log(`    Name: ${block.name}`)
      if (block.type === 'textimage') {
        console.log(`    Data:`, JSON.stringify(block.data, null, 6))
      }
    })
  } else {
    console.log('\n❌ No blocks array found or blocks is null')
  }
}

checkBlocks().catch(console.error)
