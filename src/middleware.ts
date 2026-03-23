import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * AI TRAINING CENTER - Master Middleware
 * Handles multi-tenant routing, custom domains, and dynamic homepage assignment.
 */

const MASTER_PLATFORM_DOMAIN = 'aistaffs.app'

// Static/API paths — always bypass on ALL domains (no HTML, no landing logic needed)
const STATIC_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
]

// Admin paths — only bypass on system domains (localhost, railway.app)
// On production custom domains (skincoach.ai etc.) these should NOT be reachable
const ADMIN_PATHS = [
  '/admin',
  '/auth',
  '/operator',
  '/livechat',
]

const LANDING_DOMAINS: Record<string, string> = {
  'brezcode.com': 'brezcode',
  'www.brezcode.com': 'brezcode',
  'skincoach.ai': 'skincoach',
  'www.skincoach.ai': 'skincoach',
  'xynargy.hk': 'xynargy',
  'www.xynargy.hk': 'xynargy',
}


export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // 1. STATIC PATHS — always bypass on every domain
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 2. SYSTEM/ADMIN DOMAINS — bypass everything (local dev + Railway internal)
  if (
    hostname.includes('railway.app') ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('github.dev')
  ) {
    return NextResponse.next()
  }

  // 3. IDENTIFY BUSINESS UNIT
  let businessUnitSlug = LANDING_DOMAINS[hostname]

  if (!businessUnitSlug && hostname.endsWith(MASTER_PLATFORM_DOMAIN)) {
    const hostParts = hostname.split('.')
    if (hostParts.length >= 3) {
      const potentialSlug = hostParts[0]
      if (!['www', 'admin', 'api', 'app'].includes(potentialSlug)) {
        businessUnitSlug = potentialSlug
      }
    }
  }

  if (!businessUnitSlug) {
    return NextResponse.next()
  }

  // 4. COUNTRY-BASED ROUTING
  const pathParts = pathname.split('/').filter(Boolean)
  const firstPart = pathParts[0]?.toLowerCase()
  const countryCodes = ['us', 'hk', 'sg', 'tw', 'cn', 'vi', 'ja', 'ko']

  if (firstPart && countryCodes.includes(firstPart)) {
    const country = firstPart.toUpperCase()
    let pageSlug = pathParts[1] || ''

    // Map country to default language
    const langMap: Record<string, string> = { 
      'HK': 'tw', 'TW': 'tw', 'CN': 'cn', 'US': 'en', 'SG': 'en', 'VI': 'vi' 
    }
    const lang = langMap[country] || 'en'

    // DYNAMIC HOMEPAGE RESOLUTION
    // If the user is requesting the country root (e.g., /hk), check if a specific page is assigned as the home page
    if (!pageSlug) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: bu } = await supabase
          .from('business_units')
          .select('homepage_config')
          .eq('slug', businessUnitSlug)
          .single()

        const config = bu?.homepage_config as Record<string, string> || {}
        const localeKey = `${country}/${lang}`
        if (config[localeKey]) {
          pageSlug = config[localeKey]
        }
      } catch (err) {
        console.error('Middleware: Error resolving homepage config', err)
      }
    }

    const url = request.nextUrl.clone()
    url.pathname = '/livechat'
    url.searchParams.set('businessUnit', businessUnitSlug)
    url.searchParams.set('country', country)
    url.searchParams.set('lang', lang)
    
    if (pageSlug) {
      url.searchParams.set('page', pageSlug)
    }

    return NextResponse.rewrite(url)
  }

  // 5. ROOT REDIRECTION
  if (pathname === '/') {
    const detectedCountry = (
      request.headers.get('x-vercel-ip-country') || 
      request.headers.get('cf-ipcountry') || 
      'HK'
    ).toLowerCase()

    const url = request.nextUrl.clone()
    url.pathname = `/${detectedCountry}`
    return NextResponse.redirect(url, 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
