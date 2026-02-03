const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBusinessUnits() {
  console.log('Checking business units...\n')

  // Get business units
  const { data: units, error } = await supabase
    .from('business_units')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${units.length} business unit(s):\n`)

  for (const unit of units) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Name:', unit.name)
    console.log('ID:', unit.id)
    console.log('Slug:', unit.slug || 'none')

    // Get landing pages for this unit
    const { data: pages } = await supabase
      .from('landing_pages')
      .select('country, language_code, hero_type, is_active')
      .eq('business_unit_id', unit.id)

    if (pages && pages.length > 0) {
      console.log('\nLanding Pages:')
      pages.forEach(p => {
        console.log(`  - ${p.country}/${p.language_code}: ${p.hero_type} (active: ${p.is_active})`)
      })
    } else {
      console.log('\nNo landing pages')
    }
    console.log()
  }
}

checkBusinessUnits()
