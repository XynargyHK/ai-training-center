const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixStep1Alignment() {
  console.log('Fixing Step 1 alignment...\n')

  // Get landing pages with blocks
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
    let hasChanges = false

    blocks.forEach(block => {
      if (block.type === 'steps' && block.data?.steps) {
        block.data.steps.forEach((step, index) => {
          // If text_align is undefined, set it to 'left'
          if (!step.text_align) {
            console.log(`Setting text_align='left' for Step ${index + 1} in block "${block.name}"`)
            step.text_align = 'left'
            hasChanges = true
          }
        })
      }
    })

    if (hasChanges) {
      console.log(`\nUpdating landing page ${page.business_unit_id}...`)
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ blocks })
        .eq('id', page.id)

      if (updateError) {
        console.error('Error updating:', updateError)
      } else {
        console.log('✓ Updated successfully')
      }
    }
  }

  console.log('\nDone!')
}

fixStep1Alignment()
