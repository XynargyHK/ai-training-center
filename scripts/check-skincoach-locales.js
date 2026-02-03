require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLocales() {
  try {
    // Get skincoach business unit ID
    const { data: bu } = await supabase
      .from('business_units')
      .select('id')
      .eq('slug', 'skincoach')
      .single()

    if (!bu) {
      console.log('Skincoach business unit not found')
      return
    }

    console.log('Skincoach business_unit_id:', bu.id)

    // Get all landing pages for skincoach
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('id, country, language_code, slug, blocks')
      .eq('business_unit_id', bu.id)
      .order('country')
      .order('language_code')

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('\nAvailable landing pages:')
    pages?.forEach(page => {
      console.log(`  ${page.country}/${page.language_code} (slug: ${page.slug || '(none)'}) - ${page.blocks?.length || 0} blocks`)

      // Show first few block names and anchor IDs
      page.blocks?.slice(0, 3).forEach((block, idx) => {
        const anchorId = block.data?.anchor_id
        const autoAnchor = block.name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
        console.log(`    Block ${idx}: "${block.name}" -> anchor_id: ${anchorId || '(auto: ' + autoAnchor + ')'}`)
      })
    })

  } catch (err) {
    console.error('Error:', err)
  }
}

checkLocales()
