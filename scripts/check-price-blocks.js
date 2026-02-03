const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPriceBlocks() {
  console.log('Checking Price Block features...\n')

  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching landing pages:', error)
    return
  }

  for (const page of pages) {
    const blocks = page.blocks || []
    const priceBlocks = blocks.filter(b => b.type === 'pricing')

    if (priceBlocks.length > 0) {
      console.log(`=== Landing Page: ${page.business_unit_id} ===\n`)

      priceBlocks.forEach((block, idx) => {
        console.log(`Pricing Block ${idx + 1}: "${block.name}"`)
        console.log('\nFeatures:')
        const features = block.data?.features || []
        features.forEach((feature, i) => {
          console.log(`  ${i + 1}. ${feature}`)
        })
        console.log('\nFeatures Font Settings:')
        console.log(`  Font Family: ${block.data?.features_font_family || 'NOT SET'}`)
        console.log(`  Font Size: ${block.data?.features_font_size || 'NOT SET'}`)
        console.log(`  Font Color: ${block.data?.features_color || 'NOT SET'}`)
        console.log('\n---\n')
      })
    }
  }
}

checkPriceBlocks()
