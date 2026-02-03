require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function deletePricingBlock() {
  console.log('🗑️  Deleting pricing block...\n')

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

  // Remove the pricing block and restore original order
  const updatedBlocks = (page.blocks || [])
    .filter(block => block.type !== 'pricing')
    .map(block => ({
      ...block,
      order: block.order - 1 // Restore original order
    }))

  console.log('Blocks after deletion:')
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

  console.log('\n✅ Pricing block deleted successfully!')
}

deletePricingBlock()
