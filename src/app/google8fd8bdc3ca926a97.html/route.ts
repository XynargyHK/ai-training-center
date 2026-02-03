import { NextResponse } from 'next/server'

export async function GET() {
  const content = 'google-site-verification: google8fd8bdc3ca926a97.html'

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
