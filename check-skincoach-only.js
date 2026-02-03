const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSkinCoach() {
  console.log('Checking SkinCoach US/en landing page...\n')

  // Get SkinCoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.log('SkinCoach not found')
    return
  }

  console.log('SkinCoach ID:', bu.id)

  // Get landing page
  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('SkinCoach US/en Landing Page')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Hero Type:', page.hero_type)
  console.log('Is Active:', page.is_active)
  console.log('Total Slides:', page.hero_slides?.length || 0)
  console.log()

  if (page.hero_slides && page.hero_slides.length > 0) {
    console.log('CAROUSEL SLIDES:\n')

    page.hero_slides.forEach((slide, idx) => {
      const isCarouselSlide = slide.is_carousel !== false

      console.log(`Slide ${idx + 1}:`)
      console.log('  Will show in carousel:', isCarouselSlide ? 'YES' : 'NO (static banner)')
      console.log('  background_type:', slide.background_type || 'not set')
      console.log('  background_url:', slide.background_url ? (slide.background_url.substring(0, 60) + '...') : 'NONE')
      console.log('  original_filename:', slide.original_filename || 'not set')

      if (slide.background_url && slide.background_type !== 'video') {
        console.log('  ⚠️  HAS URL but type is NOT video! Type:', slide.background_type)
      }

      console.log()
    })

    // Show what will actually render
    const carouselSlides = page.hero_slides.filter(s => s.is_carousel !== false)
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`CAROUSEL WILL CYCLE THROUGH ${carouselSlides.length} SLIDES:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    carouselSlides.forEach((slide, idx) => {
      console.log(`Position ${idx + 1}: ${slide.background_type === 'video' ? '🎬 VIDEO' : '🖼️  IMAGE'} - ${slide.original_filename || 'no filename'}`)
    })
  }
}

checkSkinCoach()
