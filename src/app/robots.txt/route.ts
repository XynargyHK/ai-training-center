import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `# Allow all search engines to crawl the site
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://skincoach.ai/sitemap.xml
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
