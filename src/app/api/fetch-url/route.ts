import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url, category } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      )
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check if it's a YouTube URL
    const isYouTube = validUrl.hostname.includes('youtube.com') || validUrl.hostname.includes('youtu.be')

    let content = ''
    let title = ''
    let keywords: string[] = []

    if (isYouTube) {
      // Handle YouTube video
      const videoId = extractYouTubeVideoId(url)
      if (!videoId) {
        return NextResponse.json(
          { error: 'Could not extract YouTube video ID' },
          { status: 400 }
        )
      }

      try {
        // Fetch video information using oEmbed API (no API key required)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const oembedResponse = await fetch(oembedUrl)

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json()
          title = oembedData.title || 'YouTube Video'
          content = `YouTube Video: ${title}\n\n`
          content += `Author: ${oembedData.author_name || 'Unknown'}\n`
          content += `URL: ${url}\n\n`
          content += `Video ID: ${videoId}\n\n`
          content += `Note: This is a YouTube video. To access the full content, visit the URL above.`

          keywords = ['youtube', 'video', videoId, oembedData.author_name || '']
        } else {
          // Fallback if oEmbed fails
          title = `YouTube Video ${videoId}`
          content = `YouTube Video\nURL: ${url}\nVideo ID: ${videoId}\n\nNote: This is a YouTube video. To access the full content, visit the URL above.`
          keywords = ['youtube', 'video', videoId]
        }
      } catch (error) {
        console.error('Error fetching YouTube data:', error)
        title = `YouTube Video ${videoId}`
        content = `YouTube Video\nURL: ${url}\nVideo ID: ${videoId}\n\nNote: This is a YouTube video. To access the full content, visit the URL above.`
        keywords = ['youtube', 'video', videoId]
      }
    } else {
      // Handle regular web page
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch URL: ${response.statusText}` },
            { status: response.status }
          )
        }

        const html = await response.text()

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        title = titleMatch ? titleMatch[1].trim() : validUrl.hostname

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
        const description = descMatch ? descMatch[1] : ''

        // Extract meta keywords
        const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
        const metaKeywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : []

        // Remove script and style tags
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()

        // Limit content length
        if (textContent.length > 10000) {
          textContent = textContent.substring(0, 10000) + '...'
        }

        content = `Title: ${title}\n\n`
        if (description) {
          content += `Description: ${description}\n\n`
        }
        content += `URL: ${url}\n\n`
        content += `Content:\n${textContent}`

        keywords = [validUrl.hostname, ...metaKeywords].filter(k => k)
      } catch (error) {
        console.error('Error fetching web page:', error)
        return NextResponse.json(
          { error: 'Failed to fetch and parse web page' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Date.now().toString(),
        url,
        title,
        content,
        keywords,
        category: category || 'Web Content',
        isYouTube,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('URL fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to process URL' },
      { status: 500 }
    )
  }
}

function extractYouTubeVideoId(url: string): string | null {
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export async function GET() {
  return NextResponse.json({
    message: 'URL fetch API is ready',
    supportedTypes: ['Web pages', 'YouTube videos'],
    note: 'POST a JSON body with { url: "https://...", category: "..." }'
  })
}
