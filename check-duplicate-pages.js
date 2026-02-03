const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
  console.log('Checking for duplicate landing pages...\n')

  // Get ALL landing pages for US + en
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('id, business_unit_id, country, language_code, is_active, hero_type, created_at')
    .eq('country', 'US')
    .eq('language_code', 'en')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!pages || pages.length === 0) {
    console.log('No landing pages found')
    return
  }

  console.log(`Found ${pages.length} landing page(s) for US + English:\n`)

  pages.forEach((page, idx) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Landing Page #${idx + 1}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log('Database ID:', page.id)
    console.log('Business Unit ID:', page.business_unit_id)
    console.log('Country:', page.country)
    console.log('Language:', page.language_code)
    console.log('IS ACTIVE:', page.is_active ? 'YES' : 'NO')
    console.log('Hero Type:', page.hero_type)
    console.log('Created:', page.created_at)
    console.log()
  })

  const activePages = pages.filter(p => p.is_active)
  if (activePages.length > 1) {
    console.log('⚠️  WARNING: Multiple active pages found!')
    console.log('⚠️  The API expects only ONE active page per country + language')
    console.log('⚠️  This causes conflicts when loading the page')
    console.log('\nYou need to deactivate one of them.')
  }
}

checkDuplicates()
