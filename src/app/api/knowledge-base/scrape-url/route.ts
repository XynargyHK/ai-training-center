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

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
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

    // Remove script and style tags
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // Remove HTML tags and extract text
    let text = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()

    // Limit content length
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '...'
    }

    if (!text || text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Could not extract meaningful content from the URL' },
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
