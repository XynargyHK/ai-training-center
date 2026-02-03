const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLandingPage() {
  console.log('🔍 Checking SkinCoach landing page...\n')

  // Get SkinCoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name, slug')
    .eq('name', 'SkinCoach')
    .single()

  if (!bu) {
    console.log('❌ SkinCoach business unit not found')
    return
  }

  console.log(`✅ Business Unit: ${bu.name} (${bu.id})`)
  console.log(`   Slug: ${bu.slug}\n`)

  // Get landing page
  const { data: lp } = await supabase
    .from('landing_pages')
    .select('id, country, language_code, is_active, is_published, blocks')
    .eq('business_unit_id', bu.id)

  if (!lp || lp.length === 0) {
    console.log('❌ No landing pages found')
    return
  }

  console.log(`📄 Found ${lp.length} landing page(s):\n`)

  lp.forEach((page, i) => {
    console.log(`   ${i + 1}. ID: ${page.id}`)
    console.log(`      Country: ${page.country}`)
    console.log(`      Language: ${page.language_code}`)
    console.log(`      Active: ${page.is_active ? '✅' : '❌'}`)
    console.log(`      Published: ${page.is_published ? '✅' : '❌'}`)
    console.log(`      Blocks: ${page.blocks ? page.blocks.length : 0}`)

    if (page.blocks && page.blocks.length > 0) {
      console.log(`      Block types:`)
      page.blocks.forEach((block, j) => {
        console.log(`         - ${block.type}: "${block.name}"`)
      })
    }
    console.log('')
  })

  // Test the API endpoint
  console.log('\n🌐 Testing API endpoint...')
  console.log(`   URL: /api/landing-page?businessUnit=skincoach\n`)

  const { data: apiTest } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .eq('is_active', true)
    .single()

  if (apiTest) {
    console.log('✅ API would return landing page:')
    console.log(`   ID: ${apiTest.id}`)
    console.log(`   Blocks: ${apiTest.blocks ? apiTest.blocks.length : 0}`)
  } else {
    console.log('❌ API would NOT return any landing page')
    console.log('   Reason: No page with country=US, language=en, is_active=true')
  }
}

checkLandingPage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
