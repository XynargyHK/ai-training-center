import { NextRequest, NextResponse } from 'next/server'

const SKINCOACH_HOSTS = ['skincoach.ai', 'www.skincoach.ai']
const PASS_THROUGH_PREFIXES = ['/livechat', '/api', '/_next', '/favicon.ico', '/auth', '/operator', '/images']

const LANDING_DOMAINS: Record<string, string> = {
  'brezcode.com': 'brezcode',
  'www.brezcode.com': 'brezcode',
  'xynargy.hk': 'xynargy',
  'www.xynargy.hk': 'xynargy',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // 1. ABSOLUTE PROTECTION FOR SYSTEM DOMAINS
  // If we are on Railway or Localhost, stop all logic and just serve the page.
  if (hostname.includes('railway.app') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next()
  }

  // 2. Skip pass-through paths (API, Auth, etc)
  if (PASS_THROUGH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // 3. Identify the Business Unit
  let businessUnitSlug = LANDING_DOMAINS[hostname]

  // Try to detect from subdomain if not hardcoded (e.g., brand.brezcode.com)
  if (!businessUnitSlug) {
    const hostParts = hostname.split('.')
    if (hostParts.length >= 3) { // Must be a subdomain like x.y.z
      const potentialSlug = hostParts[0]
      if (!['www', 'admin', 'ai-training-center'].includes(potentialSlug)) {
        businessUnitSlug = potentialSlug
      }
    }
  }

  // 4. Handle SkinCoach (Legacy Special Case)
  if (SKINCOACH_HOSTS.includes(hostname)) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/livechat'
      url.searchParams.set('businessUnit', 'skincoach')
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // 5. Handle Country-based Landing Pages (e.g. brezcode.com/hk)
  const countryMatch = pathname.match(/^\/(us|hk|sg|tw|cn|vi|ja|ko)$/i)
  if (businessUnitSlug && countryMatch) {
    const country = countryMatch[1].toUpperCase()
    const url = request.nextUrl.clone()
    url.pathname = '/livechat'
    url.searchParams.set('businessUnit', businessUnitSlug)
    url.searchParams.set('country', country)
    const langMap: Record<string, string> = { 'HK': 'tw', 'TW': 'tw', 'CN': 'cn', 'US': 'en', 'SG': 'en', 'VI': 'vi' }
    url.searchParams.set('lang', langMap[country] || 'en')
    return NextResponse.rewrite(url)
  }

  // 6. Root path redirection (Only for recognized landing domains)
  if (businessUnitSlug && pathname === '/') {
    const detectedCountry = (request.headers.get('x-vercel-ip-country') || 
                             request.headers.get('cf-ipcountry') || 
                             'US').toLowerCase()
    
    const url = request.nextUrl.clone()
    url.pathname = `/${detectedCountry}`
    return NextResponse.redirect(url, 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
