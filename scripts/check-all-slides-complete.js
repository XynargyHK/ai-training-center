const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllSlides() {
  console.log('Checking ALL hero slides data...\n')

  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching landing pages:', error)
    return
  }

  for (const page of pages) {
    const slides = page.hero_slides || []

    console.log(`=== Landing Page: ${page.business_unit_id} ===`)
    console.log(`Total slides: ${slides.length}\n`)

    slides.forEach((slide, index) => {
      console.log(`--- Slide ${index + 1} ---`)
      console.log(`Headline: ${slide.headline || 'NOT SET'}`)
      console.log(`Is Carousel: ${slide.is_carousel}`)
      console.log(`Is Price Banner: ${slide.is_price_banner || false}`)

      if (slide.features && slide.features.length > 0) {
        console.log(`\nFeatures (${slide.features.length}):`)
        slide.features.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))

        console.log(`\nFeatures Font Settings:`)
        console.log(`  content_font_family: ${slide.content_font_family || 'NOT SET'}`)
        console.log(`  content_font_size: ${slide.content_font_size || 'NOT SET'}`)
        console.log(`  content_color: ${slide.content_color || 'NOT SET'}`)
        console.log(`  content_bold: ${slide.content_bold || false}`)
        console.log(`  content_italic: ${slide.content_italic || false}`)
      }

      console.log('')
    })
  }
}

checkAllSlides()
