import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Redirect skincoach.ai root to livechat page
  if ((host === 'skincoach.ai' || host === 'www.skincoach.ai') && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/livechat'
    url.searchParams.set('businessUnit', 'skincoach')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
