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

  // 1. Skip pass-through paths
  if (PASS_THROUGH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // 2. Identify the Business Unit
  // First check hardcoded map
  let businessUnitSlug = LANDING_DOMAINS[hostname]

  // If not in map, try to detect from subdomain or domain name automatically
  if (!businessUnitSlug) {
    const hostParts = hostname.split('.')
    // Handles: xynargy.brezcode.com (subdomain) or xynargy.hk (root domain)
    if (hostParts.length >= 2) {
      const potentialSlug = hostParts[0]
      // Skip system subdomains
      if (!['www', 'ai-training-center', 'localhost', 'railway', 'admin'].includes(potentialSlug)) {
        businessUnitSlug = potentialSlug
      }
    }
  }

  // 3. Handle SkinCoach (Legacy Special Case)
  if (SKINCOACH_HOSTS.includes(hostname)) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/livechat'
      url.searchParams.set('businessUnit', 'skincoach')
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // 4. Handle Country-based Landing Pages
  // If we have a detected business unit and the path is a country code (like /hk)
  const countryMatch = pathname.match(/^\/(us|hk|sg|tw|cn|vi|ja|ko)$/i)
  if (businessUnitSlug && countryMatch) {
    const country = countryMatch[1].toUpperCase()
    const url = request.nextUrl.clone()
    url.pathname = '/livechat'
    url.searchParams.set('businessUnit', businessUnitSlug)
    url.searchParams.set('country', country)
    // Map country to default language
    const langMap: Record<string, string> = { 'HK': 'tw', 'TW': 'tw', 'CN': 'cn', 'US': 'en', 'SG': 'en', 'VI': 'vi' }
    url.searchParams.set('lang', langMap[country] || 'en')
    return NextResponse.rewrite(url)
  }

  // 5. Root path redirection for landing domains
  if (businessUnitSlug && pathname === '/') {
    // Detect country from header (provided by Railway/Cloudflare)
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
