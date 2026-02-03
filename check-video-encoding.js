const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVideoEncoding() {
  console.log('Checking video encoding and streaming support...\n')

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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('VIDEO OPTIMIZATION RECOMMENDATIONS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Your videos load slowly on Railway because they may not be')
  console.log('optimized for web streaming. Here\'s what you need:\n')

  console.log('1. VIDEO CODEC: H.264 (most compatible)')
  console.log('2. CONTAINER: MP4 with "faststart" flag')
  console.log('3. RESOLUTION: 1920x1080 or lower')
  console.log('4. BITRATE: 1-2 Mbps for hero videos')
  console.log('5. MOOV ATOM: Must be at the start of file (for streaming)\n')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Your current videos:\n')

  for (let i = 0; i < page.hero_slides.length; i++) {
    const slide = page.hero_slides[i]

    if (slide.background_url && slide.background_type === 'video') {
      console.log(`${i + 1}. ${slide.original_filename || 'Unknown'}`)

      try {
        const response = await fetch(slide.background_url, { method: 'HEAD' })
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        const sizeInMB = (parseInt(contentLength) / 1024 / 1024).toFixed(2)

        console.log(`   Size: ${sizeInMB} MB`)
        console.log(`   Content-Type: ${contentType}`)

        // Check if it's a standard MP4
        if (contentType !== 'video/mp4') {
          console.log('   ⚠️  Should be video/mp4')
        }

        // Check size
        if (parseFloat(sizeInMB) > 2) {
          console.log('   ⚠️  Consider reducing to under 2MB')
        }

      } catch (error) {
        console.log('   Error checking:', error.message)
      }
      console.log()
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('HOW TO OPTIMIZE YOUR VIDEOS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Option 1: Use HandBrake (Free, GUI tool)')
  console.log('  1. Download from: https://handbrake.fr/')
  console.log('  2. Open your video file')
  console.log('  3. Select "Fast 1080p30" preset')
  console.log('  4. Go to Video tab, set Quality to 22-24')
  console.log('  5. Click "Start Encode"\n')

  console.log('Option 2: Use FFmpeg (Command line)')
  console.log('  ffmpeg -i input.mp4 -c:v libx264 -crf 23 \\')
  console.log('    -preset fast -movflags +faststart \\')
  console.log('    -vf "scale=1920:-2" -an output.mp4\n')

  console.log('Option 3: Use online tool')
  console.log('  - CloudConvert: https://cloudconvert.com/')
  console.log('  - FreeConvert: https://www.freeconvert.com/\n')

  console.log('After re-encoding, re-upload the optimized videos through')
  console.log('the Landing Page Editor.\n')
}

checkVideoEncoding()
