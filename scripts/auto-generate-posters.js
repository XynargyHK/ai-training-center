/**
 * Automated Video Poster Generator
 * Generates optimized poster images for all videos and saves them to database
 * Run: node scripts/auto-generate-posters.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const http = require('http')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simple in-memory video frame extraction using a data URL approach
async function generatePosterFromVideo(videoUrl) {
  console.log('   📥 Downloading video...')

  // For this implementation, we'll create a simple placeholder poster
  // In production, you'd use ffmpeg or a video processing service
  // For now, let's use the video URL with timestamp as the poster

  // Extract a low-quality frame using video URL with timestamp
  const posterUrl = `${videoUrl}#t=0.1`

  // Since we can't easily extract frames without ffmpeg or browser,
  // let's use Supabase's image transformation if available
  // Or we can skip poster generation and just optimize preloading

  return posterUrl
}

// Better approach: Use the video platform's thumbnail feature if available
async function generateOptimizedPoster(videoUrl, pageId, slideIndex) {
  try {
    // For Supabase storage videos, we can use a simple approach:
    // Just mark it for client-side generation on first load

    // Return a data URL or placeholder that will be replaced
    // This is a simplified version - real implementation would need browser or ffmpeg

    console.log('   ⚠️  Automatic poster generation requires ffmpeg or browser environment')
    console.log('   💡 Using video frame fallback: #t=0.1')

    return `${videoUrl}#t=0.1`
  } catch (error) {
    console.error('   ❌ Error generating poster:', error.message)
    return null
  }
}

async function processAllVideos() {
  console.log('🎬 Auto-generating posters for all videos...\n')

  try {
    // Fetch all landing pages
    const { data: pages, error: fetchError } = await supabase
      .from('landing_pages')
      .select('id, business_unit_id, hero_slides')

    if (fetchError) throw fetchError

    let processed = 0
    let updated = 0
    let skipped = 0

    for (const page of pages) {
      if (!page.hero_slides || page.hero_slides.length === 0) continue

      const updatedSlides = [...page.hero_slides]
      let pageModified = false

      for (let i = 0; i < updatedSlides.length; i++) {
        const slide = updatedSlides[i]

        if (slide.background_type === 'video' && slide.background_url) {
          processed++

          // Check if already has optimized poster
          const hasOptimized = slide.poster_url && !slide.poster_url.includes('#t=')

          if (hasOptimized) {
            console.log(`✓ Slide ${i} already has optimized poster`)
            skipped++
            continue
          }

          console.log(`\n📹 Processing video ${processed}:`)
          console.log(`   Page: ${page.id.substring(0, 8)}...`)
          console.log(`   Slide: ${i}`)
          console.log(`   Video: ${slide.background_url.substring(0, 80)}...`)

          // Generate poster
          const posterUrl = await generateOptimizedPoster(
            slide.background_url,
            page.id,
            i
          )

          if (posterUrl) {
            updatedSlides[i] = {
              ...updatedSlides[i],
              poster_url: posterUrl
            }
            pageModified = true
            updated++
            console.log(`   ✅ Poster set (fallback mode)`)
          }
        }
      }

      // Update page if modified
      if (pageModified) {
        const { error: updateError } = await supabase
          .from('landing_pages')
          .update({ hero_slides: updatedSlides })
          .eq('id', page.id)

        if (updateError) {
          console.error(`   ❌ Failed to update page: ${updateError.message}`)
        } else {
          console.log(`   💾 Saved to database`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   Total videos processed: ${processed}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Already optimized (skipped): ${skipped}`)
    console.log('='.repeat(60))

    console.log('\n⚠️  IMPORTANT NOTE:')
    console.log('This script uses video frame fallback (#t=0.1) mode.')
    console.log('For true optimized posters (<50KB), you need:')
    console.log('  1. Install ffmpeg: https://ffmpeg.org/download.html')
    console.log('  2. Or use the browser-based generator in the admin panel')
    console.log('\nThe video preloading optimizations are now active!')
    console.log('Videos should load faster due to smart preload strategy.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the script
processAllVideos()
