const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBlocksStructure() {
  console.log('🔍 CHECKING BLOCKS STRUCTURE MISMATCH\n')
  console.log('=' .repeat(80))

  // Get SkinCoach landing page
  const { data: lp, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log('\n1️⃣ RAW DATABASE DATA')
  console.log('-'.repeat(80))
  console.log('Landing Page ID:', lp.id)
  console.log('Announcements exist:', !!lp.announcements)
  console.log('Announcements type:', typeof lp.announcements)
  console.log('Announcements value:', JSON.stringify(lp.announcements, null, 2))
  console.log('')
  console.log('Blocks exist:', !!lp.blocks)
  console.log('Blocks type:', typeof lp.blocks)
  console.log('Blocks is array:', Array.isArray(lp.blocks))
  console.log('Blocks length:', lp.blocks?.length || 0)

  console.log('\n2️⃣ BLOCKS RAW DATA')
  console.log('-'.repeat(80))
  if (lp.blocks) {
    console.log(JSON.stringify(lp.blocks, null, 2))
  } else {
    console.log('NULL or undefined')
  }

  console.log('\n3️⃣ BLOCKS VALIDATION')
  console.log('-'.repeat(80))

  if (!lp.blocks) {
    console.log('❌ blocks is null/undefined')
    console.log('   CAUSE: Column might store data differently')
  } else if (!Array.isArray(lp.blocks)) {
    console.log('❌ blocks is not an array!')
    console.log('   ACTUAL TYPE:', typeof lp.blocks)
    console.log('   VALUE:', lp.blocks)
  } else if (lp.blocks.length === 0) {
    console.log('⚠️  blocks is an empty array')
    console.log('   CAUSE: No blocks were saved to database')
  } else {
    console.log('✅ blocks is a valid array with', lp.blocks.length, 'items')

    lp.blocks.forEach((block, i) => {
      console.log(`\n   Block ${i + 1}:`)
      console.log('   - Has id:', !!block.id)
      console.log('   - Has type:', !!block.type)
      console.log('   - Has name:', !!block.name)
      console.log('   - Has data:', !!block.data)
      console.log('   - Has order:', block.order !== undefined)

      if (!block.id || !block.type) {
        console.log('   ❌ INVALID BLOCK STRUCTURE!')
      }
    })
  }

  console.log('\n4️⃣ FRONTEND EXPECTATION')
  console.log('-'.repeat(80))
  console.log('Frontend checks:')
  console.log('  landingData?.blocks:', lp.blocks !== null && lp.blocks !== undefined ? '✅' : '❌')
  console.log('  landingData.blocks.length > 0:', (lp.blocks?.length || 0) > 0 ? '✅' : '❌')

  const condition = lp.blocks && lp.blocks.length > 0
  console.log('\nConditional result:', condition)

  if (condition) {
    console.log('✅ Frontend SHOULD SHOW BlockRenderer')
  } else {
    console.log('❌ Frontend WILL SHOW fallback (old hardcoded content)')
  }

  console.log('\n5️⃣ CHECK OTHER FIELDS THAT WORK')
  console.log('-'.repeat(80))
  console.log('announcement_text:', lp.announcement_text || '(not set)')
  console.log('announcements array:', lp.announcements?.length || 0, 'items')
  console.log('hero_headline:', lp.hero_headline || '(not set)')

  if (lp.announcements && lp.announcements.length > 0) {
    console.log('\n✅ Announcements work!')
    console.log('   This proves database connection and fetching works')
    console.log('   Issue must be specific to blocks field')
  }

  console.log('\n' + '='.repeat(80))
}

checkBlocksStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
