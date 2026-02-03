import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SKINCOACH_HOSTS = ['skincoach.ai', 'www.skincoach.ai']
const PASS_THROUGH_PREFIXES = ['/livechat', '/api', '/_next', '/favicon.ico']

const COUNTRY_MAP: Record<string, { country: string; lang: string }> = {
  hk: { country: 'HK', lang: 'en' },
  us: { country: 'US', lang: 'en' },
}

const DEFAULT_PATH = 'hk'
const LANDING_PAGE = 'micro-infusion-system-face'

function buildLandingUrl(request: NextRequest, countryPath: string): URL {
  const params = COUNTRY_MAP[countryPath]
  const url = request.nextUrl.clone()
  url.pathname = '/livechat'
  url.search = `?businessUnit=skincoach&country=${params.country}&lang=${params.lang}&page=${LANDING_PAGE}`
  return url
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() ?? null
}

async function detectCountryPath(request: NextRequest): Promise<string> {
  const ip = getClientIp(request)
  if (!ip || ip === '127.0.0.1' || ip === '::1') return DEFAULT_PATH

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      const code = data.countryCode as string
      if (code === 'US') return 'us'
      if (code === 'HK') return 'hk'
    }
  } catch {
    // timeout or network error — fall back to default
  }
  return DEFAULT_PATH
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''

  if (!SKINCOACH_HOSTS.includes(hostname)) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Allow pass-through for specific prefixes
  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Allow verification files (Bing XML, Google HTML, sitemap, robots)
  if (pathname.match(/\.(xml|html|txt)$/)) {
    return NextResponse.next()
  }

  // Handle /hk or /us paths
  const pathMatch = pathname.match(/^\/(hk|us)(\/.*)?$/i)
  if (pathMatch) {
    const countryPath = pathMatch[1].toLowerCase()
    if (COUNTRY_MAP[countryPath]) {
      return NextResponse.redirect(buildLandingUrl(request, countryPath), 308)
    }
  }

  // Bare domain — geo-detect and redirect
  if (pathname === '/' || pathname === '') {
    const countryPath = await detectCountryPath(request)
    return NextResponse.redirect(buildLandingUrl(request, countryPath), 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
