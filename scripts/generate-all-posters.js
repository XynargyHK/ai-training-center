require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Batch script to check all videos and identify which need poster generation
 * Run: node scripts/generate-all-posters.js
 */
async function checkAllVideos() {
  console.log('🎬 Checking all videos for poster optimization...\n')

  // Get all landing pages
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('id, business_unit_id, hero_slides')

  if (error) {
    console.error('❌ Error fetching pages:', error)
    return
  }

  let totalVideos = 0
  let needsOptimization = 0
  let alreadyOptimized = 0

  const videosList = []

  pages.forEach(page => {
    if (!page.hero_slides || page.hero_slides.length === 0) return

    page.hero_slides.forEach((slide, index) => {
      if (slide.background_type === 'video' && slide.background_url) {
        totalVideos++

        // Check if using optimized poster
        const hasPoster = slide.poster_url && slide.poster_url.trim() !== ''
        const isOptimized = hasPoster && !slide.poster_url.includes('#t=')

        if (isOptimized) {
          alreadyOptimized++
        } else {
          needsOptimization++
          videosList.push({
            pageId: page.id,
            businessUnit: page.business_unit_id,
            slideIndex: index,
            videoUrl: slide.background_url,
            currentPoster: slide.poster_url || 'none'
          })
        }
      }
    })
  })

  console.log('📊 Summary:')
  console.log(`   Total videos: ${totalVideos}`)
  console.log(`   ✅ Already optimized: ${alreadyOptimized}`)
  console.log(`   ⚠️  Need optimization: ${needsOptimization}`)
  console.log('')

  if (needsOptimization > 0) {
    console.log('📋 Videos needing poster optimization:\n')
    videosList.forEach((video, i) => {
      console.log(`${i + 1}. Page: ${video.pageId} (${video.businessUnit})`)
      console.log(`   Slide: ${video.slideIndex}`)
      console.log(`   Video: ${video.videoUrl.substring(0, 80)}...`)
      console.log(`   Current poster: ${video.currentPoster}`)
      console.log('')
    })

    console.log('💡 Next Steps:')
    console.log('   1. Go to Admin Panel → Landing Page Editor')
    console.log('   2. For each slide with a video, click "Generate Poster"')
    console.log('   3. The system will create an optimized <50KB poster image')
    console.log('')
    console.log('   Or use the bulk generation feature (coming soon!)')
  } else {
    console.log('✅ All videos have optimized posters!')
  }
}

checkAllVideos()
