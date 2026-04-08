const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: BU } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'brezcode')
    .single()

  if (!BU) return

  const { data: pages } = await supabase
    .from('landing_pages')
    .select('id, slug, country, language_code, blocks, is_active')
    .eq('business_unit_id', BU.id)

  console.log('--- ALL PAGES ---')
  pages.forEach(p => {
    console.log(`ID: ${p.id}, Slug: ${p.slug}, Locale: ${p.country}/${p.language_code}, Active: ${p.is_active}, Blocks: ${p.blocks?.length || 0}`)
  })
}

checkData()
