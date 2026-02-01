import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SKINCOACH_HOSTS = ['skincoach.ai', 'www.skincoach.ai']
const SKINCOACH_LANDING = '/livechat'
const SKINCOACH_PARAMS = 'businessUnit=skincoach&country=HK&lang=en&page=micro-infusion-system-face'
const PASS_THROUGH_PREFIXES = ['/livechat', '/api', '/_next', '/favicon.ico']

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''

  if (SKINCOACH_HOSTS.includes(hostname)) {
    const { pathname } = request.nextUrl

    if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = SKINCOACH_LANDING
    url.search = `?${SKINCOACH_PARAMS}`
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
