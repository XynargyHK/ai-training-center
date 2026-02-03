import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Generate optimized poster image from video
 * POST /api/video-poster
 * Body: { videoUrl: string, targetSize?: number }
 * Returns: { posterUrl: string, size: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { videoUrl, targetSize = 50000 } = await request.json() // 50KB default

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      )
    }

    // Extract filename from video URL
    const videoFilename = videoUrl.split('/').pop()?.split('?')[0] || 'video'
    const posterFilename = videoFilename.replace(/\.(mp4|webm|mov)$/i, '-poster.jpg')

    // Check if poster already exists in storage
    const { data: existingFiles } = await supabase.storage
      .from('videos')
      .list('posters', {
        search: posterFilename
      })

    if (existingFiles && existingFiles.length > 0) {
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(`posters/${posterFilename}`)

      return NextResponse.json({
        posterUrl: publicUrlData.publicUrl,
        size: existingFiles[0].metadata?.size || 0,
        cached: true
      })
    }

    // Download video to extract frame
    // Note: For production, you might want to use a video processing service
    // or implement frame extraction using a library like fluent-ffmpeg

    return NextResponse.json(
      {
        error: 'Video frame extraction requires ffmpeg or a video processing service. Please use the client-side extraction method in the admin panel.',
        videoUrl,
        posterFilename
      },
      { status: 501 }
    )

  } catch (error) {
    console.error('Error generating poster:', error)
    return NextResponse.json(
      { error: 'Failed to generate poster image' },
      { status: 500 }
    )
  }
}

/**
 * Get all videos that need poster generation
 * GET /api/video-poster?check=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.searchParams
    const check = searchParams.get('check') === 'true'

    if (!check) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get all landing pages with video slides
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('id, business_unit_id, hero_slides')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract all video URLs
    const videosNeedingPosters: Array<{
      pageId: string
      businessUnit: string
      slideIndex: number
      videoUrl: string
      currentPoster: string | null
    }> = []

    pages?.forEach(page => {
      page.hero_slides?.forEach((slide: any, index: number) => {
        if (slide.background_type === 'video' && slide.background_url) {
          // Check if using optimized poster or just video fragment
          const isOptimized = slide.poster_url && !slide.poster_url.includes('#t=')

          videosNeedingPosters.push({
            pageId: page.id,
            businessUnit: page.business_unit_id,
            slideIndex: index,
            videoUrl: slide.background_url,
            currentPoster: slide.poster_url || null
          })
        }
      })
    })

    return NextResponse.json({
      total: videosNeedingPosters.length,
      videos: videosNeedingPosters
    })

  } catch (error) {
    console.error('Error checking videos:', error)
    return NextResponse.json(
      { error: 'Failed to check videos' },
      { status: 500 }
    )
  }
}
