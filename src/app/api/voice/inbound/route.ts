import { NextRequest, NextResponse } from 'next/server'
import { loadIvrTree, getRootNode, renderTwimlMenu } from '@/lib/ivr-renderer'

export async function POST(request: NextRequest) {
  const body = await request.formData()
  const from = body.get('From') as string
  const to = body.get('To') as string
  const callSid = body.get('CallSid') as string
  const digits = body.get('Digits') as string | null

  const { searchParams } = request.nextUrl
  const customGreeting = searchParams.get('greeting')
  const businessUnitId = searchParams.get('businessUnitId')
  const parentId = searchParams.get('parentId')

  console.log(`[Voice] Call from ${from} to ${to} — SID: ${callSid} — BU: ${businessUnitId} — Digits: ${digits}`)

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://ai-training-center-production.up.railway.app').trim()

  // If BU has an IVR menu, use it. Otherwise fall back to speech-gather AI chat.
  if (businessUnitId) {
    try {
      const nodes = await loadIvrTree(businessUnitId)
      const root = getRootNode(nodes)

      if (root && nodes.length > 1) {
        const currentParent = parentId || root.id

        // If user pressed a digit, resolve the action
        if (digits) {
          const digit = parseInt(digits)
          const children = nodes.filter(n => n.parent_id === currentParent).sort((a, b) => a.sort_order - b.sort_order)
          const matched = children[digit - 1]

          if (matched) {
            if (matched.action === 'sub_menu') {
              const twiml = renderTwimlMenu(nodes, matched.id, `${appUrl}/api/voice/inbound?businessUnitId=${businessUnitId}`)
              return xml(twiml)
            }
            if (matched.action === 'ai_chat') {
              const gatherUrl = `${appUrl}/api/voice/gather?businessUnitId=${businessUnitId}`
              const prompt = matched.payload?.prompt || 'How can I help you?'
              return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherUrl}" method="POST" speechTimeout="2" timeout="10" language="en-US">
    <Say voice="Polly.Joanna">${prompt}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye.</Say>
</Response>`)
            }
            if (matched.action === 'transfer_human') {
              const msg = matched.payload?.message || 'Transferring you now.'
              return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">${msg}</Say><Hangup/></Response>`)
            }
            if (matched.action === 'play_message') {
              const msg = matched.payload?.message || 'Thank you for calling.'
              return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">${msg}</Say><Hangup/></Response>`)
            }
            if (matched.action === 'voice_ai' || matched.action === 'send_link') {
              return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">I've sent you a link via WhatsApp. Please check your messages.</Say><Hangup/></Response>`)
            }
          }
        }

        // No digits yet (first connect) — show root IVR menu
        if (customGreeting) {
          // Override greeting for outbound calls
          const gatherUrl = `${appUrl}/api/voice/inbound?businessUnitId=${businessUnitId}&parentId=${root.id}`
          const children = nodes.filter(n => n.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order)
          const options = children.map((c, i) => `Press ${i + 1} for ${c.label.replace(/[^\w\s]/g, '')}.`).join(' ')
          return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${gatherUrl}" method="POST" timeout="10">
    <Say voice="Polly.Joanna">${customGreeting} ${options}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear a response. Goodbye.</Say>
</Response>`)
        }

        const twiml = renderTwimlMenu(nodes, root.id, `${appUrl}/api/voice/inbound?businessUnitId=${businessUnitId}`)
        return xml(twiml)
      }
    } catch (e: any) {
      console.warn('IVR load failed for phone, falling back to speech:', e.message)
    }
  }

  // Fallback: no IVR menu — direct speech-to-AI
  const greeting = customGreeting || "Hello! Thank you for calling. I'm your AI assistant. How can I help you today?"
  const gatherUrl = businessUnitId
    ? `${appUrl}/api/voice/gather?businessUnitId=${businessUnitId}`
    : `${appUrl}/api/voice/gather`

  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherUrl}" method="POST" speechTimeout="2" timeout="10" language="en-US">
    <Say voice="Polly.Joanna" language="en-US">${greeting}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Please call again. Goodbye!</Say>
</Response>`)
}

function xml(content: string) {
  return new NextResponse(content, { status: 200, headers: { 'Content-Type': 'text/xml' } })
}
