const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkHeroVideo() {
  console.log('Checking hero banner video data...\n')

  // Get business unit ID first
  const { data: businessUnits } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('name', 'skincoach')
    .single()

  if (!businessUnits) {
    console.log('Business unit not found, checking all landing pages...')
  }

  // Get landing page data
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('*')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!pages || pages.length === 0) {
    console.log('No landing page found')
    return
  }

  console.log(`Found ${pages.length} landing page(s)\n`)

  pages.forEach((page, pageIdx) => {
    console.log(`\n=== Landing Page ${pageIdx + 1} ===`)
    console.log('ID:', page.id)
    console.log('Country:', page.country)
    console.log('Language:', page.language_code)
    console.log('IS_ACTIVE:', page.is_active)
    console.log('Hero type:', page.hero_type)
    console.log('Total slides:', page.hero_slides?.length || 0)
    console.log('\nHero slides:')

    if (page.hero_slides) {
      page.hero_slides.forEach((slide, idx) => {
        console.log(`\nSlide ${idx + 1}:`)
        console.log('  is_carousel:', slide.is_carousel === false ? 'false (STATIC BANNER)' : (slide.is_carousel === true ? 'true (CAROUSEL)' : 'undefined (CAROUSEL)'))
        console.log('  background_url:', slide.background_url ? slide.background_url.substring(0, 80) + '...' : 'none')
        console.log('  background_type:', slide.background_type)
        console.log('  original_filename:', slide.original_filename || 'not set')

        if (slide.background_url && slide.background_url.includes('.mp4')) {
          console.log('  ⚠️  URL contains .mp4 but background_type is:', slide.background_type)
        }
      })
    }
  })
}

checkHeroVideo()
