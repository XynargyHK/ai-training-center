import { NextRequest, NextResponse } from 'next/server'
import { saveKnowledge } from '@/lib/supabase-storage'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

const MAX_PAGES = 5       // max pages to crawl per site (keep under Railway timeout)
const MAX_IMAGES = 10     // max images to save per site
const PAGE_TIMEOUT = 8000 // 8s per page fetch

// Parse URLs and image URLs from sitemap XML (handles CDATA and sitemap index)
function parseSitemapXml(xml: string, hostname: string, skipPatterns: RegExp[]): { pageUrls: string[], imageUrls: string[] } {
  // Strip CDATA wrappers so regex works uniformly
  const clean = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')

  const pageUrls: string[] = []
  const imageUrls: string[] = []

  // Extract page <loc> URLs
  const locRegex = /<loc>\s*([^\s<]+)\s*<\/loc>/gi
  let match: RegExpExecArray | null
  while ((match = locRegex.exec(clean)) !== null) {
    const url = match[1].trim()
    try {
      const parsed = new URL(url)
      if (parsed.hostname !== hostname) continue
      if (url.endsWith('.xml')) continue // sub-sitemaps handled separately
      if (skipPatterns.some(p => p.test(parsed.pathname))) continue
      pageUrls.push(url)
    } catch { /* skip */ }
  }

  // Extract <image:loc> URLs — WordPress/AIOSEO sitemaps include all images here
  const imgLocRegex = /<image:loc>\s*([^\s<]+)\s*<\/image:loc>/gi
  while ((match = imgLocRegex.exec(clean)) !== null) {
    const url = match[1].trim()
    if (url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)) {
      imageUrls.push(url)
    }
  }

  return { pageUrls, imageUrls }
}

// Try to fetch and parse sitemap — handles sitemap index and CDATA
async function getSitemapData(baseUrl: string): Promise<{ pageUrls: string[], imageUrls: string[] }> {
  const base = new URL(baseUrl)
  const hostname = base.hostname
  const origin = base.origin
  const sitemapCandidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap/sitemap.xml`]
  const skipPatterns = [/\.(pdf|zip|doc|xls|css|js|ico|txt)$/i,
    /\/(wp-admin|admin|login|logout|register|feed|rss)/i]

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const res = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const xml = await res.text()

      // Detect sitemap index (contains sub-sitemap .xml links)
      const cleanXml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      const subSitemapRegex = /<loc>\s*(https?:[^\s<]+\.xml)\s*<\/loc>/gi
      const subSitemaps: string[] = []
      let m: RegExpExecArray | null
      while ((m = subSitemapRegex.exec(cleanXml)) !== null) subSitemaps.push(m[1].trim())

      if (subSitemaps.length > 0) {
        // It's a sitemap index — fetch each sub-sitemap
        const allPageUrls: string[] = []
        const allImageUrls: string[] = []

        await Promise.allSettled(subSitemaps.map(async (subUrl) => {
          try {
            const subRes = await fetch(subUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) })
            if (!subRes.ok) return
            const subXml = await subRes.text()
            const { pageUrls, imageUrls } = parseSitemapXml(subXml, hostname, skipPatterns)
            allPageUrls.push(...pageUrls)
            allImageUrls.push(...imageUrls)
          } catch { /* skip */ }
        }))

        if (allPageUrls.length > 0 || allImageUrls.length > 0) {
          console.log(`[scrape-url] Sitemap index: ${allPageUrls.length} pages, ${allImageUrls.length} images`)
          return { pageUrls: allPageUrls, imageUrls: allImageUrls }
        }
      } else {
        // Regular sitemap
        const { pageUrls, imageUrls } = parseSitemapXml(xml, hostname, skipPatterns)
        if (pageUrls.length > 0 || imageUrls.length > 0) {
          console.log(`[scrape-url] Sitemap: ${pageUrls.length} pages, ${imageUrls.length} images`)
          return { pageUrls, imageUrls }
        }
      }
    } catch { /* try next */ }
  }

  return { pageUrls: [], imageUrls: [] }
}

// Resolve slug or UUID to UUID for storage folder
async function resolveToUUID(slugOrId: string): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) return slugOrId
  const { data } = await supabase.from('business_units').select('id').eq('slug', slugOrId).single()
  return data?.id || slugOrId
}

// Ask Gemini Vision to generate a descriptive filename for an image
async function generateImageName(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent([
      { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
      'Generate a descriptive filename (no extension) for this image using 3-5 words with hyphens. ' +
      'Be specific about the actual visual content (e.g. "red-rose-face-cream-jar", ' +
      '"woman-applying-facial-serum", "product-ingredients-chart"). ' +
      'Return only the filename, nothing else.'
    ])
    return result.response.text()
      .trim().toLowerCase()
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'webpage-image'
  } catch {
    return 'webpage-image'
  }
}

// Extract internal links from HTML (same domain only)
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const seen = new Set<string>()
  const links: string[] = []

  const hrefRegex = /href=["']([^"'#?]+)["']/gi
  let match: RegExpExecArray | null

  // Skip these path patterns (non-content pages)
  const skipPatterns = [/\.(pdf|zip|doc|xls|png|jpg|jpeg|gif|svg|css|js|ico|xml|txt)$/i,
    /\/(wp-admin|admin|login|logout|register|cart|checkout|account|feed|rss)/i]

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1].trim()
    if (!href) continue
    try {
      const absolute = href.startsWith('http') ? new URL(href) : new URL(href, base)
      // Same domain only
      if (absolute.hostname !== base.hostname) continue
      // Skip non-content paths
      const path = absolute.pathname
      if (skipPatterns.some(p => p.test(path))) continue
      // Normalize: remove trailing slash
      const normalized = absolute.origin + path.replace(/\/$/, '') || '/'
      if (!seen.has(normalized)) {
        seen.add(normalized)
        links.push(normalized)
      }
    } catch {
      // skip malformed
    }
  }

  return links
}

// Extract image URLs from HTML, resolved to absolute URLs
function extractImageUrls(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const seen = new Set<string>()
  const urls: string[] = []

  const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue
    try {
      const absolute = src.startsWith('http') ? src : new URL(src, base).toString()
      if (!seen.has(absolute)) { seen.add(absolute); urls.push(absolute) }
    } catch { /* skip */ }
  }

  // Also pick up srcset first entry
  const srcsetRegex = /srcset=["']([^"']+)["']/gi
  while ((match = srcsetRegex.exec(html)) !== null) {
    const first = match[1].split(',')[0].trim().split(/\s+/)[0]
    if (!first || first.startsWith('data:')) continue
    try {
      const absolute = first.startsWith('http') ? first : new URL(first, base).toString()
      if (!seen.has(absolute)) { seen.add(absolute); urls.push(absolute) }
    } catch { /* skip */ }
  }

  return urls
}

// Fetch a single HTML page
async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(PAGE_TIMEOUT),
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html')) return null
    return await res.text()
  } catch {
    return null
  }
}

// Fetch an image and return buffer + mimeType, or null if not suitable
async function fetchImage(url: string, refererOrigin?: string): Promise<{ buffer: Buffer; mimeType: string; ext: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
        'Referer': refererOrigin || new URL(url).origin,
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.log(`[scrape-url] fetchImage HTTP ${res.status} for: ${url}`)
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    let mimeType = ''; let ext = ''

    if (contentType.includes('jpeg') || contentType.includes('jpg')) { mimeType = 'image/jpeg'; ext = 'jpg' }
    else if (contentType.includes('png')) { mimeType = 'image/png'; ext = 'png' }
    else if (contentType.includes('webp')) { mimeType = 'image/webp'; ext = 'webp' }
    else if (contentType.includes('gif')) { mimeType = 'image/gif'; ext = 'gif' }
    else {
      const u = url.toLowerCase().split('?')[0]
      if (u.endsWith('.jpg') || u.endsWith('.jpeg')) { mimeType = 'image/jpeg'; ext = 'jpg' }
      else if (u.endsWith('.png')) { mimeType = 'image/png'; ext = 'png' }
      else if (u.endsWith('.webp')) { mimeType = 'image/webp'; ext = 'webp' }
      else return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 5000) {
      console.log(`[scrape-url] fetchImage too small (${buffer.length}b) for: ${url}`)
      return null
    }
    return { buffer, mimeType, ext }
  } catch {
    return null
  }
}

// Strip HTML and decode entities
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ').trim()
}

// Extract text content from a page HTML
function extractPageText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  let text = ''
  const mainMatch = clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  if (mainMatch) text = stripHtml(mainMatch[1] || '')

  if (!text || text.length < 100) {
    const bodyMatch = clean.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
    text = stripHtml(bodyMatch ? bodyMatch[1] : clean)
  }

  if (text.length > 20000) text = text.substring(0, 20000) + '...'
  return { title, text }
}

export async function POST(request: NextRequest) {
  try {
    const { url, businessUnitId } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 })
    }

    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 })
    }

    const storageFolder = await resolveToUUID(businessUnitId || 'default')

    // === CRAWL THE SITE ===
    const visited = new Set<string>()

    // Try sitemap first — also extracts <image:loc> URLs directly from WordPress sitemaps
    const { pageUrls: sitemapPageUrls, imageUrls: sitemapImageUrls } = await getSitemapData(validUrl.toString())
    const queue: string[] = sitemapPageUrls.length > 0
      ? [validUrl.toString(), ...sitemapPageUrls.filter(u => u !== validUrl.toString())]
      : [validUrl.toString()]

    console.log(`[scrape-url] Starting crawl: ${queue.length} URLs in queue (sitemap: ${sitemapPageUrls.length} pages, ${sitemapImageUrls.length} images)`)
    const allImageUrls = new Set<string>(sitemapImageUrls) // pre-seed with sitemap images
    let pagesScraped = 0
    let firstTitle = ''
    let firstContentLength = 0

    while (queue.length > 0 && pagesScraped < MAX_PAGES) {
      // Process up to 3 pages concurrently
      const batch = queue.splice(0, 3)
      const pageResults = await Promise.allSettled(
        batch.map(async (pageUrl) => {
          if (visited.has(pageUrl)) return null
          visited.add(pageUrl)

          const html = await fetchPage(pageUrl)
          if (!html) return null

          const { title, text } = extractPageText(html)
          if (text.length < 30) return null

          // Save this page's text to knowledge base (wrapped so failures don't abort image collection)
          const pageTitle = title || new URL(pageUrl).pathname || validUrl.hostname
          try {
            await saveKnowledge({
              topic: pageTitle,
              content: `URL: ${pageUrl}\n\n${text}`,
              category: 'Website Content',
              keywords: [validUrl.hostname, 'website', 'scraped'],
              confidence: 0.8
            }, businessUnitId)
          } catch (saveErr) {
            console.warn(`[scrape-url] saveKnowledge failed for ${pageUrl}:`, saveErr)
          }

          // Collect image URLs from this page
          const pageImages = extractImageUrls(html, pageUrl)
          pageImages.forEach(img => allImageUrls.add(img))

          // Find new internal links to crawl
          const links = extractInternalLinks(html, pageUrl)
          links.forEach(link => {
            if (!visited.has(link) && !queue.includes(link)) {
              queue.push(link)
            }
          })

          return { title: pageTitle, contentLength: text.length }
        })
      )

      for (const r of pageResults) {
        if (r.status === 'fulfilled' && r.value) {
          if (pagesScraped === 0) {
            firstTitle = r.value.title
            firstContentLength = r.value.contentLength
          }
          pagesScraped++
        }
      }
    }

    // === DOWNLOAD & SAVE IMAGES ===
    const imageUrlList = Array.from(allImageUrls).slice(0, MAX_IMAGES)
    const savedImages: { name: string; url: string }[] = []

    for (let i = 0; i < imageUrlList.length; i += 3) {
      const batch = imageUrlList.slice(i, i + 3)
      const results = await Promise.allSettled(
        batch.map(async (imgUrl, idx) => {
          const img = await fetchImage(imgUrl, validUrl.origin)
          if (!img) {
            console.log(`[scrape-url] fetchImage returned null for: ${imgUrl}`)
            return null
          }

          console.log(`[scrape-url] Uploading image: ${imgUrl} (${img.buffer.length} bytes, ${img.mimeType})`)
          // Use URL filename directly — skip Gemini naming to avoid timeout
          const urlBaseName = imgUrl.split('/').pop()?.split('?')[0]?.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40) || 'image'
          const baseName = urlBaseName || 'image'
          const suffix = Math.random().toString(36).slice(2, 8)
          const srcPrefix = validUrl.hostname.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 25)
          const uniqueName = `${srcPrefix}__${baseName}-${suffix}.${img.ext}`
          const uploadPath = `${storageFolder}/${uniqueName}`

          const { error } = await supabase.storage
            .from('media-library')
            .upload(uploadPath, img.buffer, { contentType: img.mimeType, upsert: false })

          if (error) {
            console.error(`[scrape-url] Supabase upload error for ${uniqueName}:`, error)
            throw error
          }

          const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(uploadPath)
          return { name: uniqueName, url: urlData.publicUrl }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) savedImages.push(r.value)
      }

      if (i + 3 < imageUrlList.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`[scrape-url] Done: ${pagesScraped} pages, ${savedImages.length} images saved`)
    return NextResponse.json({
      success: true,
      title: firstTitle || validUrl.hostname,
      contentLength: firstContentLength,
      pagesScraped,
      sitemapFound: sitemapPageUrls.length > 0 || sitemapImageUrls.length > 0,
      imageCount: savedImages.length,
      images: savedImages
    })

  } catch (error: any) {
    console.error('URL scrape error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to scrape URL' }, { status: 500 })
  }
}
