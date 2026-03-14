import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin: currentOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 1. Await cookies() for modern Next.js
  const cookieStore = await cookies()
  const nextCookie = cookieStore.get('sb-next-url')
  
  // 2. Determine target URL
  let targetUrl = `${currentOrigin}/`
  if (nextCookie?.value) {
    targetUrl = decodeURIComponent(nextCookie.value)
  } else if (searchParams.get('next')) {
    targetUrl = `${currentOrigin}${searchParams.get('next')}`
  }
  
  console.log('[Auth Callback] Redirecting to:', targetUrl)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // SUCCESS: Prepare response and clear cookie
      const response = NextResponse.redirect(targetUrl)
      // Note: We can only set cookies on the response object
      response.cookies.set('sb-next-url', '', { maxAge: 0 })
      return response
    } else {
      console.error('[Auth Callback] Session exchange error:', error.message)
    }
  }

  // Fallback
  return NextResponse.redirect(targetUrl)
}
