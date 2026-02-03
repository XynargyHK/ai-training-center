require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBlocks() {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, blocks')
    .eq('id', '7cb58d30-65a3-4fcc-8fa5-e263855b6a55')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Landing Page Blocks:')
  if (data.blocks && Array.isArray(data.blocks)) {
    data.blocks.forEach((block, idx) => {
      console.log(`  ${idx + 1}. ${block.name} (${block.type}) - order: ${block.order}`)
    })
  } else {
    console.log('  No blocks found')
  }
}

checkBlocks()
