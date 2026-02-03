const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixSlide10Fonts() {
  console.log('Fixing Slide 10 font settings...\n')

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (!page) {
    console.log('No landing page found')
    return
  }

  const slides = page.hero_slides || []
  const slide10 = slides[9]

  if (!slide10) {
    console.log('Slide 10 not found')
    return
  }

  console.log('Current Slide 10 features font settings:')
  console.log(`  content_font_family: ${slide10.content_font_family || 'NOT SET'}`)
  console.log(`  content_font_size: ${slide10.content_font_size || 'NOT SET'}`)
  console.log('')

  // Set the font settings
  slides[9] = {
    ...slide10,
    content_font_family: 'Cormorant Garamond',
    content_font_size: '1.125rem' // 18px
  }

  console.log('Setting to:')
  console.log(`  content_font_family: Cormorant Garamond`)
  console.log(`  content_font_size: 1.125rem (18px)`)
  console.log('')

  const { error } = await supabase
    .from('landing_pages')
    .update({ hero_slides: slides })
    .eq('id', page.id)

  if (error) {
    console.error('Error updating:', error)
  } else {
    console.log('✓ Updated successfully!')
    console.log('\nVerifying...')

    const { data: updated } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', page.id)
      .single()

    const updatedSlide10 = updated.hero_slides[9]
    console.log(`  content_font_family: ${updatedSlide10.content_font_family || 'NOT SET'}`)
    console.log(`  content_font_size: ${updatedSlide10.content_font_size || 'NOT SET'}`)
  }
}

fixSlide10Fonts()
