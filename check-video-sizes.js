const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVideoSizes() {
  console.log('Checking video file sizes...\n')

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

  // Get landing page
  const { data: page } = await supabase
    .from('landing_pages')
    .select('hero_slides')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single()

  if (!page || !page.hero_slides) {
    console.log('No slides found')
    return
  }

  console.log('Checking video file sizes from storage...\n')

  for (let i = 0; i < page.hero_slides.length; i++) {
    const slide = page.hero_slides[i]

    if (slide.background_url && slide.background_type === 'video') {
      console.log(`Slide ${i + 1}: ${slide.original_filename || 'Unknown'}`)
      console.log(`URL: ${slide.background_url}`)

      // Try to fetch file metadata
      try {
        const response = await fetch(slide.background_url, { method: 'HEAD' })
        const contentLength = response.headers.get('content-length')

        if (contentLength) {
          const sizeInMB = (parseInt(contentLength) / 1024 / 1024).toFixed(2)
          console.log(`Size: ${sizeInMB} MB`)

          if (parseFloat(sizeInMB) > 10) {
            console.log('⚠️  WARNING: Video is very large! Should be under 5MB for fast loading')
          } else if (parseFloat(sizeInMB) > 5) {
            console.log('⚠️  Video is large. Consider compressing to under 5MB')
          } else {
            console.log('✓ Size is acceptable')
          }
        } else {
          console.log('Could not determine file size')
        }
      } catch (error) {
        console.log('Error fetching file:', error.message)
      }

      console.log()
    }
  }
}

checkVideoSizes()
