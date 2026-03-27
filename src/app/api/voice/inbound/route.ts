import { NextRequest, NextResponse } from 'next/server'

// Twilio calls this webhook when someone calls your Twilio number.
// It responds with TwiML (XML) that tells Twilio what to do.
export async function POST(request: NextRequest) {
  // Parse the form-encoded body Twilio sends
  const body = await request.formData()
  const from = body.get('From') as string
  const to = body.get('To') as string
  const callSid = body.get('CallSid') as string

  // Support query params for outbound calls (custom greeting + businessUnit)
  const { searchParams } = request.nextUrl
  const customGreeting = searchParams.get('greeting')
  const businessUnitId = searchParams.get('businessUnitId')

  console.log(`[Voice] Call from ${from} to ${to} — SID: ${callSid} — BU: ${businessUnitId}`)

  const greeting = customGreeting || 'Hello! Thank you for calling. I\'m your AI assistant. How can I help you today?'

  // Twilio requires absolute URLs for action attributes
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://ai-training-center-production.up.railway.app').trim()

  // Pass businessUnitId to gather route via query param
  const gatherUrl = businessUnitId
    ? `${appUrl}/api/voice/gather?businessUnitId=${businessUnitId}`
    : `${appUrl}/api/voice/gather`

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${greeting}</Say>
  <Gather input="speech" action="${gatherUrl}" method="POST" speechTimeout="auto" timeout="10" language="en-US">
    <Say voice="Polly.Joanna">Please go ahead and speak.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Please call again. Goodbye!</Say>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' }
  })
}
