require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCarouselSlides() {
  console.log('🔍 Checking carousel slides...\n')

  // First, get all columns from landing_pages
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (pages && pages.length > 0) {
    console.log('Available columns in landing_pages:', Object.keys(pages[0]))
    console.log('\n')
  }

  // Now fetch all landing pages with hero_slides
  const { data: allPages, error: error2 } = await supabase
    .from('landing_pages')
    .select('id, business_unit_id, hero_slides')

  if (error2) {
    console.error('Error fetching pages:', error2)
    return
  }

  allPages.forEach((page, idx) => {
    console.log(`${idx + 1}. Landing Page ID: ${page.id}`)
    console.log(`   Business Unit: ${page.business_unit_id}`)

    if (page.hero_slides && Array.isArray(page.hero_slides) && page.hero_slides.length > 0) {
      console.log(`   Hero Slides (${page.hero_slides.length}):`)
      page.hero_slides.forEach((slide, slideIdx) => {
        console.log(`     Slide ${slideIdx + 1}:`)
        console.log(`       - Headline: ${slide.headline || 'N/A'}`)
        console.log(`       - Subheadline: ${slide.subheadline || 'N/A'}`)
        console.log(`       - Image: ${slide.image_url ? 'Yes' : 'No'}`)
        console.log(`       - Video: ${slide.video_url ? 'Yes' : 'No'}`)
        if (slide.cta_text) console.log(`       - CTA: ${slide.cta_text}`)
      })
    } else {
      console.log('   No hero slides')
    }
    console.log('')
  })
}

checkCarouselSlides()
