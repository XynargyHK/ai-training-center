const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function removeTextImageBlocks() {
  console.log('🔍 Checking for TextImage blocks in landing pages...\n')

  // Fetch all landing pages with blocks
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('id, business_unit_id, blocks')
    .not('blocks', 'is', null)

  if (error) {
    console.error('Error fetching landing pages:', error)
    return
  }

  console.log(`Found ${pages.length} landing pages with blocks\n`)

  let updatedCount = 0
  let removedBlocksCount = 0

  for (const page of pages) {
    const blocks = page.blocks || []
    const textImageBlocks = blocks.filter(b => b.type === 'textimage')

    if (textImageBlocks.length > 0) {
      console.log(`\n📄 Landing Page ID: ${page.id}`)
      console.log(`   Business Unit: ${page.business_unit_id}`)
      console.log(`   Found ${textImageBlocks.length} TextImage block(s)`)

      // Remove textimage blocks
      const cleanedBlocks = blocks.filter(b => b.type !== 'textimage')

      console.log(`   → Removing ${textImageBlocks.length} TextImage block(s)`)
      console.log(`   → Remaining blocks: ${cleanedBlocks.length}`)

      // Update the landing page
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ blocks: cleanedBlocks })
        .eq('id', page.id)

      if (updateError) {
        console.error(`   ❌ Error updating landing page:`, updateError)
      } else {
        console.log(`   ✅ Successfully removed TextImage blocks`)
        updatedCount++
        removedBlocksCount += textImageBlocks.length
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Cleanup complete!`)
  console.log(`   Updated ${updatedCount} landing page(s)`)
  console.log(`   Removed ${removedBlocksCount} TextImage block(s)`)
  console.log('='.repeat(60))
}

removeTextImageBlocks().catch(console.error)
