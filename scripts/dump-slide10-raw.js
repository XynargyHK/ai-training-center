const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function dumpSlide10() {
  const { data: pages } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (!pages) {
    console.log('No landing page found')
    return
  }

  const slide10 = pages.hero_slides[9]

  console.log('=== RAW SLIDE 10 DATA ===\n')
  console.log(JSON.stringify(slide10, null, 2))
}

dumpSlide10()
