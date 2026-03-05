import { NextRequest, NextResponse } from 'next/server'

const SKINCOACH_HOSTS = ['skincoach.ai', 'www.skincoach.ai']
const PASS_THROUGH_PREFIXES = ['/livechat', '/api', '/_next', '/favicon.ico', '/auth']

const COUNTRY_MAP: Record<string, { country: string; lang: string }> = {
  us: { country: 'US', lang: 'en' },
  hk: { country: 'HK', lang: 'tw' },
  sg: { country: 'SG', lang: 'en' },
}

const DEFAULT_COUNTRY = 'us'

// Domain-to-business-unit mapping for multi-tenant landing pages
// Add new domains here as new businesses are created
const LANDING_DOMAINS: Record<string, string> = {
  'brezcode.com': 'brezcode',
  'www.brezcode.com': 'brezcode',
  'xynargy.hk': 'xynargy',
  'www.xynargy.hk': 'xynargy',
}

// Detect if request is from a bot/crawler
function isBot(userAgent: string): boolean {
  const botPatterns = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkShare',
    'W3C_Validator',
    'whatsapp',
    'crawler',
    'spider',
    'bot',
  ]
  const ua = userAgent.toLowerCase()
  return botPatterns.some(pattern => ua.includes(pattern))
}

// Get client IP address
function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() ?? null
}

// Detect country from IP address
async function detectCountryFromIP(request: NextRequest): Promise<string> {
  const ip = getClientIp(request)
  if (!ip || ip === '127.0.0.1' || ip === '::1') return DEFAULT_COUNTRY

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      const code = data.countryCode as string
      if (code === 'US') return 'us'
      if (code === 'HK') return 'hk'
      if (code === 'SG') return 'sg'
    }
  } catch {
    // timeout or network error — fall back to default
  }
  return DEFAULT_COUNTRY
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''
  const { pathname } = request.nextUrl

  // === MULTI-TENANT LANDING PAGE ROUTING ===
  // Handles brezcode.com and future business domains
  const mappedBusinessUnit = LANDING_DOMAINS[hostname]
  if (mappedBusinessUnit) {
    // Allow pass-through for app routes, static files, etc.
    if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }
    if (pathname.match(/\.(xml|html|txt|ico|png|jpg|svg)\/?$/)) {
      return NextResponse.next()
    }

    // Handle country paths: /us, /hk, /sg → rewrite with business unit
    const pathMatch = pathname.match(/^\/(us|hk|sg)(\/.*)?$/i)
    if (pathMatch) {
      const countryPath = pathMatch[1].toLowerCase()
      if (COUNTRY_MAP[countryPath]) {
        const url = request.nextUrl.clone()
        url.searchParams.set('_bu', mappedBusinessUnit)
        const response = NextResponse.rewrite(url)
        response.cookies.set('preferred_country', countryPath, {
          maxAge: 60 * 60 * 24 * 365,
          path: '/',
          sameSite: 'lax',
        })
        return response
      }
    }

    // Handle root path: / → redirect to detected country
    if (pathname === '/' || pathname === '') {
      const savedCountry = request.cookies.get('preferred_country')?.value
      if (savedCountry && COUNTRY_MAP[savedCountry]) {
        const url = request.nextUrl.clone()
        url.pathname = `/${savedCountry}`
        return NextResponse.redirect(url, 302)
      }

      const detectedCountry = await detectCountryFromIP(request)
      const url = request.nextUrl.clone()
      url.pathname = `/${detectedCountry}`
      return NextResponse.redirect(url, 302)
    }

    return NextResponse.next()
  }

  // === SKINCOACH.AI HANDLING (COMPLETELY UNCHANGED BELOW) ===

  // Only apply to SkinCoach domains
  if (!SKINCOACH_HOSTS.includes(hostname)) {
    return NextResponse.next()
  }
  const userAgent = request.headers.get('user-agent') || ''

  // Allow pass-through for specific prefixes
  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Allow verification files (Bing XML, Google HTML, sitemap, robots)
  if (pathname.match(/\.(xml|html|txt)\/?$/)) {
    return NextResponse.next()
  }

  // Also allow specific verification file paths explicitly
  if (pathname === '/BingSiteAuth.xml' || pathname === '/google8fd8bdc3ca926a97.html' || pathname.startsWith('/google') && pathname.includes('.html')) {
    return NextResponse.next()
  }

  // Handle country-specific paths: /us, /hk, /sg
  // Just set cookie and let the routes handle themselves
  const pathMatch = pathname.match(/^\/(us|hk|sg)(\/.*)?$/i)
  if (pathMatch) {
    const countryPath = pathMatch[1].toLowerCase()
    if (COUNTRY_MAP[countryPath]) {
      const response = NextResponse.next()

      // Set cookie to remember user's country preference
      response.cookies.set('skincoach_country', countryPath, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      })

      return response
    }
  }

  // Handle root path: /
  if (pathname === '/' || pathname === '') {
    // Check for saved country preference in cookie
    const savedCountry = request.cookies.get('skincoach_country')?.value
    if (savedCountry && COUNTRY_MAP[savedCountry]) {
      // Redirect to saved country
      const url = request.nextUrl.clone()
      url.pathname = `/${savedCountry}`
      return NextResponse.redirect(url, 302)
    }

    // First visit - detect country from IP and redirect (bots also get redirected)
    const detectedCountry = await detectCountryFromIP(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${detectedCountry}`
    return NextResponse.redirect(url, 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
