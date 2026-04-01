import { NextRequest, NextResponse } from 'next/server'

/**
 * AI TRAINING CENTER - Master Middleware (Fail-Safe Version)
 * This version uses a whitelist approach to respect SSR country folders
 * and strictly prevents the 'Salmon DNA' fallback trap.
 */

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // 1. TOP-LEVEL GUARD: Bypass for all system domains and critical paths
  if (
    hostname.includes('localhost') || 
    hostname.includes('railway.app') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/operator') ||
    pathname.startsWith('/voice') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. IDENTIFY BRAND (Custom Domain Mapping)
  const domainMap: Record<string, string> = {
    'skincoach.ai': 'skincoach',
    'www.skincoach.ai': 'skincoach',
    'xynargy.hk': 'xynargy',
    'www.xynargy.hk': 'xynargy',
    'brezcode.com': 'brezcode',
    'www.brezcode.com': 'brezcode'
  }
  
  // Handle aistaffs.app subdomains (e.g., skincoach.aistaffs.app)
  let businessUnit = domainMap[hostname]
  if (!businessUnit && hostname.endsWith('aistaffs.app')) {
    const hostParts = hostname.split('.')
    if (hostParts.length >= 3) {
      const slug = hostParts[0]
      if (!['www', 'admin', 'app', 'api'].includes(slug)) {
        businessUnit = slug
      }
    }
  }

  // If no brand is identified, let the request proceed normally
  if (!businessUnit) return NextResponse.next()

  // 3. PRIORITY BYPASS: If businessUnit is already in query, don't re-process
  if (searchParams.has('businessUnit')) {
    return NextResponse.next()
  }

  // 4. HANDLE ROOT REDIRECT (e.g., skincoach.ai/ -> skincoach.ai/hk or /us)
  if (pathname === '/') {
    const countryHeader = request.headers.get('x-vercel-ip-country') || 'HK'
    const country = countryHeader.toLowerCase() === 'us' ? 'us' : 'hk'
    
    const url = request.nextUrl.clone()
    url.pathname = `/${country}`
    return NextResponse.redirect(url, 302)
  }

  // 5. SSR FOLDER ROUTING (Respect the country folders)
  // Instead of rewriting to /livechat (the trap), we rewrite to the real /hk or /us folder
  // and simply inject the businessUnit param internally.
  const countryFolders = ['/hk', '/us', '/sg', '/vi']
  if (countryFolders.some(folder => pathname.startsWith(folder))) {
    const url = request.nextUrl.clone()
    url.searchParams.set('businessUnit', businessUnit)
    // Internal rewrite hides the BU param from the user but gives it to the page
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
