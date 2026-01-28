import { NextRequest, NextResponse } from 'next/server'
import { saveKnowledge } from '@/lib/supabase-storage'

export async function POST(request: NextRequest) {
  try {
    const { url, businessUnitId } = await request.json()

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'No URL provided' },
        { status: 400 }
      )
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the webpage with a realistic browser User-Agent
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : validUrl.hostname

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ''

    // Helper to strip tags and decode entities
    const stripHtml = (s: string) =>
      s.replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/\s+/g, ' ')
        .trim()

    // Remove script, style, noscript, svg, and comments
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // Try extracting from semantic content elements first
    let text = ''
    const mainMatch = cleanHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
                      cleanHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
                      cleanHtml.match(/<div[^>]*(?:role=["']main["']|id=["']content["']|class=["'][^"']*content[^"']*["'])[^>]*>([\s\S]*?)<\/div>/i)

    if (mainMatch) {
      text = stripHtml(mainMatch[1] || mainMatch[2] || '')
    }

    // Fallback: use full body text
    if (!text || text.length < 100) {
      const bodyMatch = cleanHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
      text = stripHtml(bodyMatch ? bodyMatch[1] : cleanHtml)
    }

    // Limit content length
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '...'
    }

    if (!text || text.length < 30) {
      return NextResponse.json(
        { success: false, error: 'Could not extract meaningful content from the URL. The page may require JavaScript to render.' },
        { status: 400 }
      )
    }

    // Build content with metadata
    const content = `Title: ${title}\n\n${description ? `Description: ${description}\n\n` : ''}URL: ${validUrl.toString()}\n\n${text}`

    // Save to knowledge base
    await saveKnowledge({
      topic: title,
      content: content,
      category: 'Website Content',
      keywords: [validUrl.hostname, 'website', 'scraped'],
      confidence: 0.8
    }, businessUnitId)

    return NextResponse.json({
      success: true,
      title: title,
      contentLength: text.length
    })

  } catch (error: any) {
    console.error('URL scrape error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to scrape URL' },
      { status: 500 }
    )
  }
}
