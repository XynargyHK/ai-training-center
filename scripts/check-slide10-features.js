const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSlide10() {
  console.log('Checking Slide 10 Features...\n')

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

    if (slides.length >= 10) {
      const slide10 = slides[9] // Index 9 = Slide 10

      console.log(`=== Landing Page: ${page.business_unit_id} ===\n`)
      console.log('Slide 10 (Static Banner with Features):\n')
      console.log('Headline:', slide10.headline)
      console.log('Subheadline:', slide10.subheadline)
      console.log('\nFeatures:')
      const features = slide10.features || []
      features.forEach((feature, i) => {
        console.log(`  ${i + 1}. ${feature}`)
      })
      console.log('\nContent (Features) Font Settings:')
      console.log(`  Font Family: ${slide10.content_font_family || 'NOT SET'}`)
      console.log(`  Font Size: ${slide10.content_font_size || 'NOT SET'}`)
      console.log(`  Font Color: ${slide10.content_color || 'NOT SET'}`)
      console.log(`  Bold: ${slide10.content_bold || false}`)
      console.log(`  Italic: ${slide10.content_italic || false}`)
    }
  }
}

checkSlide10()
