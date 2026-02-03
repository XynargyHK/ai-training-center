const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStepsComplete() {
  console.log('Checking complete Steps data...\n')

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
      console.log(`=== Landing Page: ${page.business_unit_id} ===\n`)

      stepsBlocks.forEach((block, idx) => {
        console.log(`Steps Block ${idx + 1}: "${block.name}"`)
        console.log(JSON.stringify(block.data, null, 2))
      })
    }
  }
}

checkStepsComplete()
