require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function convertSlide10ToBlock() {
  console.log('🔄 Converting Slide 10 to pricing block...\n')

  // Get current blocks and hero_slides
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('blocks, hero_slides')
    .eq('id', LANDING_PAGE_ID)
    .single()

  if (fetchError) {
    console.error('Error fetching page:', fetchError)
    return
  }

  // Get slide 10 (index 9)
  const slide10 = page.hero_slides[9]
  console.log('Slide 10 data:', JSON.stringify(slide10, null, 2))

  // Create new pricing block with EXACT same data from slide 10
  const newPricingBlock = {
    id: crypto.randomUUID(),
    type: 'pricing',
    name: slide10.headline || 'Micro Infusion System',
    order: 0,
    data: { ...slide10 } // Copy ALL fields from slide 10
  }

  // Update all existing block orders (increment by 1)
  const updatedBlocks = (page.blocks || []).map(block => ({
    ...block,
    order: block.order + 1
  }))

  // Add new block at the beginning
  const allBlocks = [newPricingBlock, ...updatedBlocks]

  console.log('\nNew blocks structure:')
  allBlocks.forEach((block, idx) => {
    console.log(`  ${idx + 1}. ${block.name} (${block.type}) - order: ${block.order}`)
  })

  // Update the landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ blocks: allBlocks })
    .eq('id', LANDING_PAGE_ID)

  if (updateError) {
    console.error('Error updating page:', updateError)
    return
  }

  console.log('\n✅ Successfully converted Slide 10 to pricing block!')
  console.log('   Block is now at order 0 (above testimonials)')
}

convertSlide10ToBlock()
