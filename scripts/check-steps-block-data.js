const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStepsBlockData() {
  console.log('Checking Steps Block data...\n')

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
    const stepsBlocks = blocks.filter(b => b.type === 'steps')

    if (stepsBlocks.length > 0) {
      console.log(`\n=== Landing Page: ${page.business_unit_id} ===`)

      stepsBlocks.forEach((block, idx) => {
        console.log(`\nSteps Block ${idx + 1}: "${block.name}"`)
        console.log('Steps data:')

        const steps = block.data?.steps || []
        steps.forEach((step, stepIdx) => {
          console.log(`\n  Step ${stepIdx + 1}:`)
          console.log(`    text_font_family: ${step.text_font_family || 'NOT SET'}`)
          console.log(`    text_font_size: ${step.text_font_size || 'NOT SET'}`)
          console.log(`    text_color: ${step.text_color || 'NOT SET'}`)
          console.log(`    text_bold: ${step.text_bold || false}`)
          console.log(`    text_italic: ${step.text_italic || false}`)
          console.log(`    text_align: ${step.text_align || 'NOT SET'}`)
          console.log(`    text_content: ${step.text_content?.substring(0, 50) || 'EMPTY'}...`)
        })
      })
    }
  }
}

checkStepsBlockData()
