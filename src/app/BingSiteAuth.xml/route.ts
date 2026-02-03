import { NextResponse } from 'next/server'

export async function GET() {
  const xml = `<?xml version="1.0"?>
<users>
    <user>49785425477910BA8333B7070A3DF5AD</user>
</users>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
