import { NextRequest, NextResponse } from 'next/server'

// POST /api/voice/outbound
// Body: { toNumber, businessUnitId, greeting? }
// Triggers Twilio to call `toNumber`, AI greets and converses
export async function POST(request: NextRequest) {
  try {
    const { toNumber, businessUnitId, greeting } = await request.json()

    if (!toNumber) {
      return NextResponse.json({ error: 'toNumber is required' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioFrom) {
      return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-training-center-production.up.railway.app'

    // Build TwiML URL — pass businessUnitId and custom greeting as query params
    const twimlUrl = new URL(`${appUrl}/api/voice/inbound`)
    if (businessUnitId) twimlUrl.searchParams.set('businessUnitId', businessUnitId)
    if (greeting) twimlUrl.searchParams.set('greeting', greeting)

    // Use Twilio REST API to initiate the call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: toNumber,
        From: twilioFrom,
        Url: twimlUrl.toString(),
        Method: 'POST'
      })
    })

    const data = await response.json() as { sid?: string; status?: string; message?: string }

    if (!response.ok) {
      console.error('[Voice] Twilio outbound error:', data)
      return NextResponse.json({ error: data.message || 'Twilio call failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      callSid: data.sid,
      status: data.status,
      to: toNumber
    })

  } catch (err) {
    console.error('[Voice] Outbound error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
