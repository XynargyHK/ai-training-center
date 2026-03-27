import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Twilio calls this after the caller speaks — SpeechResult contains what they said.
export async function POST(request: NextRequest) {
  const body = await request.formData()
  const speechResult = body.get('SpeechResult') as string
  const from = body.get('From') as string
  const to = body.get('To') as string
  const callSid = body.get('CallSid') as string

  // businessUnitId can come from query param (set by inbound route for outbound calls)
  const { searchParams } = request.nextUrl
  const businessUnitIdFromQuery = searchParams.get('businessUnitId')

  console.log(`[Voice] Gather from ${from}: "${speechResult}"`)

  if (!speechResult) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I couldn't understand that. Please try again.</Say>
  <Gather input="speech" action="/api/voice/gather" method="POST" speechTimeout="3" language="en-US">
    <Say voice="Polly.Joanna">Please go ahead and speak.</Say>
  </Gather>
</Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
  }

  // Look up business unit — first from query param, then by Twilio number
  let businessUnitId = businessUnitIdFromQuery
  let businessName = 'our service'

  if (!businessUnitId) {
    const { data: voiceConfig } = await supabase
      .from('business_units')
      .select('id, name')
      .eq('twilio_number', to)
      .single()
    businessUnitId = voiceConfig?.id || null
    businessName = voiceConfig?.name || 'our service'
  } else {
    const { data: buData } = await supabase
      .from('business_units')
      .select('name')
      .eq('id', businessUnitId)
      .single()
    businessName = buData?.name || 'our service'
  }

  // Call Gemini via our existing AI engine
  let aiReply = `Thank you for contacting ${businessName}. How can I assist you further?`

  try {
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: speechResult,
        businessUnitId: businessUnitId || null,
        staffRole: 'cs',
        language: 'en',
        country: 'HK',
        conversationHistory: []
      })
    })

    if (aiResponse.ok) {
      const data = await aiResponse.json()
      if (data.response) {
        // Strip markdown formatting — TTS can't handle it
        aiReply = data.response
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/\n+/g, ' ')
          .substring(0, 500) // Twilio TTS limit
      }
    }
  } catch (err) {
    console.error('[Voice] AI engine error:', err)
  }

  // Log the call turn to Supabase
  if (businessUnitId) {
    supabase.from('voice_call_logs').insert({
      call_sid: callSid,
      business_unit_id: businessUnitId,
      from_number: from,
      to_number: to,
      user_speech: speechResult,
      ai_reply: aiReply
    }).then(() => {}).catch(console.error)
  }

  // Twilio requires absolute URLs — keep businessUnitId in the loop
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://ai-training-center-production.up.railway.app').trim()
  const gatherAction = businessUnitId
    ? `${appUrl}/api/voice/gather?businessUnitId=${businessUnitId}`
    : `${appUrl}/api/voice/gather`

  // Respond and keep the conversation going
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiReply)}</Say>
  <Gather input="speech" action="${gatherAction}" method="POST" speechTimeout="3" language="en-US">
    <Say voice="Polly.Joanna">Is there anything else I can help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye!</Say>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' }
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
