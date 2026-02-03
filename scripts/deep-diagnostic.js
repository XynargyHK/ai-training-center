const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deepDiagnostic() {
  console.log('🔍 DEEP DIAGNOSTIC - Railway Landing Page Issue\n')
  console.log('=' .repeat(80))

  // 1. Check Database Connection
  console.log('\n1️⃣ DATABASE CONNECTION')
  console.log('-'.repeat(80))
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

  // 2. Find SkinCoach Business Unit
  console.log('\n2️⃣ BUSINESS UNIT LOOKUP')
  console.log('-'.repeat(80))

  const { data: bu, error: buError } = await supabase
    .from('business_units')
    .select('*')
    .eq('name', 'SkinCoach')
    .single()

  if (buError) {
    console.log('❌ Error finding SkinCoach:', buError.message)
    return
  }

  console.log('✅ SkinCoach found:')
  console.log('   ID:', bu.id)
  console.log('   Name:', bu.name)
  console.log('   Slug:', bu.slug)

  // 3. Check Landing Pages Table
  console.log('\n3️⃣ LANDING PAGES FOR SKINCOACH')
  console.log('-'.repeat(80))

  const { data: allPages, error: allPagesError } = await supabase
    .from('landing_pages')
    .select('id, country, language_code, is_active, is_published, blocks, created_at, updated_at')
    .eq('business_unit_id', bu.id)

  if (allPagesError) {
    console.log('❌ Error fetching landing pages:', allPagesError.message)
    return
  }

  console.log(`Found ${allPages.length} landing page(s):`)
  allPages.forEach((page, i) => {
    console.log(`\n   Page ${i + 1}:`)
    console.log('   ID:', page.id)
    console.log('   Country:', page.country)
    console.log('   Language:', page.language_code)
    console.log('   Active:', page.is_active ? '✅' : '❌')
    console.log('   Published:', page.is_published ? '✅' : '❌')
    console.log('   Blocks:', page.blocks ? page.blocks.length : 0)
    console.log('   Created:', new Date(page.created_at).toLocaleString())
    console.log('   Updated:', new Date(page.updated_at).toLocaleString())

    if (page.blocks && page.blocks.length > 0) {
      console.log('   Block details:')
      page.blocks.forEach((block, j) => {
        console.log(`      ${j + 1}. Type: ${block.type}`)
        console.log(`         Name: ${block.name}`)
        console.log(`         ID: ${block.id}`)
        if (block.type === 'accordion' && block.data?.items) {
          console.log(`         FAQ Items: ${block.data.items.length}`)
        }
        if (block.type === 'testimonials' && block.data?.testimonials) {
          console.log(`         Testimonials: ${block.data.testimonials.length}`)
        }
      })
    } else {
      console.log('   ⚠️  NO BLOCKS!')
    }
  })

  // 4. Simulate API Query (exactly what the app does)
  console.log('\n4️⃣ SIMULATE API QUERY (US, en, active=true)')
  console.log('-'.repeat(80))

  const { data: apiResult, error: apiError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .eq('is_active', true)
    .single()

  if (apiError) {
    if (apiError.code === 'PGRST116') {
      console.log('❌ NO MATCHING LANDING PAGE FOUND!')
      console.log('   The API would return landingPage: null')
      console.log('\n   Possible reasons:')
      console.log('   - No page with country=US')
      console.log('   - No page with language_code=en')
      console.log('   - No page with is_active=true')
    } else {
      console.log('❌ API Error:', apiError.message)
    }
    return
  }

  console.log('✅ API would return this landing page:')
  console.log('   ID:', apiResult.id)
  console.log('   Blocks:', apiResult.blocks ? apiResult.blocks.length : 0)

  if (apiResult.blocks && apiResult.blocks.length > 0) {
    console.log('   ✅ Blocks exist and would be sent to frontend')
    apiResult.blocks.forEach((block, i) => {
      console.log(`      ${i + 1}. ${block.type}: "${block.name}"`)
    })
  } else {
    console.log('   ❌ NO BLOCKS - Frontend would show fallback content!')
  }

  // 5. Check for other locales
  console.log('\n5️⃣ OTHER LOCALES FOR SKINCOACH')
  console.log('-'.repeat(80))

  const { data: otherLocales } = await supabase
    .from('landing_pages')
    .select('country, language_code, is_active, blocks')
    .eq('business_unit_id', bu.id)
    .neq('country', 'US')

  if (otherLocales && otherLocales.length > 0) {
    console.log(`Found ${otherLocales.length} other locale(s):`)
    otherLocales.forEach(locale => {
      console.log(`   ${locale.country}-${locale.language_code}: ${locale.is_active ? 'Active' : 'Inactive'}, ${locale.blocks?.length || 0} blocks`)
    })
  } else {
    console.log('   No other locales found (only US-en exists)')
  }

  // 6. Summary
  console.log('\n6️⃣ DIAGNOSIS SUMMARY')
  console.log('='.repeat(80))

  if (!apiResult.blocks || apiResult.blocks.length === 0) {
    console.log('❌ ROOT CAUSE: Landing page has NO BLOCKS in database')
    console.log('\n   WHY THIS HAPPENS:')
    console.log('   - Admin saved data but blocks were empty')
    console.log('   - Blocks were deleted or not committed to database')
    console.log('   - Database query returned wrong page')
    console.log('\n   SOLUTION:')
    console.log('   - Go to admin interface (Knowledge Base > Landing Page)')
    console.log('   - Add blocks again')
    console.log('   - Click Save')
    console.log('   - Verify blocks appear in database')
  } else if (apiResult.is_active === false) {
    console.log('❌ ROOT CAUSE: Landing page is_active = false')
    console.log('\n   SOLUTION: Set is_active to true in database')
  } else {
    console.log('✅ Database is CORRECT!')
    console.log(`   - Has ${apiResult.blocks.length} blocks`)
    console.log('   - is_active = true')
    console.log('   - Should work on Railway')
    console.log('\n   IF RAILWAY STILL SHOWS OLD CONTENT:')
    console.log('   - Railway environment variables might be wrong')
    console.log('   - Railway might be using a different database')
    console.log('   - Frontend code might not be using API data')
    console.log('   - Browser cache on Railway preview')
  }

  console.log('\n' + '='.repeat(80))
}

deepDiagnostic()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ DIAGNOSTIC FAILED:', error)
    process.exit(1)
  })
