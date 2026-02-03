require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function deleteSlide10() {
  console.log('🗑️  Deleting slide 10 from hero banner...\n')

  // Get current hero_slides
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('hero_slides')
    .eq('id', LANDING_PAGE_ID)
    .single()

  if (fetchError) {
    console.error('Error fetching page:', fetchError)
    return
  }

  const slides = page.hero_slides || []
  console.log(`Current slides: ${slides.length}`)

  if (slides.length < 10) {
    console.log('❌ No slide 10 found!')
    return
  }

  // Show slide 10 info
  const slide10 = slides[9]
  console.log('\nSlide 10 (to be deleted):')
  console.log(`  - Headline: ${slide10.headline}`)
  console.log(`  - is_price_banner: ${slide10.is_price_banner}`)
  console.log(`  - is_carousel: ${slide10.is_carousel}`)

  // Remove slide 10 (index 9)
  const updatedSlides = slides.filter((_, index) => index !== 9)

  console.log(`\nNew slides count: ${updatedSlides.length}`)

  // Update the landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ hero_slides: updatedSlides })
    .eq('id', LANDING_PAGE_ID)

  if (updateError) {
    console.error('Error updating page:', updateError)
    return
  }

  console.log('\n✅ Slide 10 deleted successfully!')
  console.log('   The price banner is now only available as an independent block below FAQ')
}

deleteSlide10()
