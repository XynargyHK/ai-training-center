require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function movePricingBelowFAQ() {
  console.log('🔄 Moving pricing block below FAQ...\n')

  // Get current blocks
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('blocks')
    .eq('id', LANDING_PAGE_ID)
    .single()

  if (fetchError) {
    console.error('Error fetching page:', fetchError)
    return
  }

  console.log('Current blocks:')
  page.blocks.forEach((block, idx) => {
    console.log(`  ${idx + 1}. ${block.name} (${block.type}) - order: ${block.order}`)
  })

  // Find pricing block and FAQ block
  const pricingBlockIndex = page.blocks.findIndex(b => b.type === 'pricing')
  const faqBlockIndex = page.blocks.findIndex(b => b.type === 'accordion')

  if (pricingBlockIndex === -1) {
    console.log('\n❌ No pricing block found!')
    return
  }

  if (faqBlockIndex === -1) {
    console.log('\n❌ No FAQ block found!')
    return
  }

  // Reorder: testimonials(0), FAQ(1), pricing(2), how it works(3), key ingredients(4)
  const updatedBlocks = [...page.blocks]

  // Assign new orders
  updatedBlocks.forEach((block) => {
    if (block.type === 'testimonials') {
      block.order = 0
    } else if (block.type === 'accordion') {
      block.order = 1
    } else if (block.type === 'pricing') {
      block.order = 2
    } else if (block.name === 'How it works') {
      block.order = 3
    } else if (block.name === 'key ingredients') {
      block.order = 4
    }
  })

  // Sort by order
  updatedBlocks.sort((a, b) => a.order - b.order)

  console.log('\nNew blocks order:')
  updatedBlocks.forEach((block, idx) => {
    console.log(`  ${idx + 1}. ${block.name} (${block.type}) - order: ${block.order}`)
  })

  // Update the landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ blocks: updatedBlocks })
    .eq('id', LANDING_PAGE_ID)

  if (updateError) {
    console.error('Error updating page:', updateError)
    return
  }

  console.log('\n✅ Pricing block moved below FAQ!')
}

movePricingBelowFAQ()
