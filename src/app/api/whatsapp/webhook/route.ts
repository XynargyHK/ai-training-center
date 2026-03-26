import { NextRequest, NextResponse } from 'next/server'
import { generateSiloedResponse } from '@/lib/ai-engine'

/**
 * UNIVERSAL WHATSAPP WEBHOOK
 * Handles incoming messages from Gateway (Whapi/Maytapi)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📱 WhatsApp Webhook Received:', JSON.stringify(body, null, 2))

    // 1. EXTRACT DATA (Universal Mapping)
    // Most gateways send: { messages: [ { from: "123...", text: { body: "..." } } ] }
    const messageData = body.messages?.[0] || body[0]?.message || body.data
    const sender = messageData?.from || body.from || body.chatId
    const text = messageData?.text?.body || messageData?.body || body.text
    const phoneNumberId = body.phone_id || body.instance_id // Used to identify which Business Unit this belongs to

    // 1.5. SAFETY FILTER (For personal number testing)
    // Only respond if the message starts with #AI or Sarah
    const lowerText = text.toLowerCase()
    const isTriggered = lowerText.startsWith('#ai') || lowerText.startsWith('sarah')
    
    if (!isTriggered) {
      console.log('🔇 Ignoring non-trigger message in personal test mode')
      return NextResponse.json({ status: 'ignored', reason: 'no_trigger' })
    }

    // Strip the trigger for the AI brain
    const cleanText = text.replace(/^#ai\s*/i, '').replace(/^sarah\s*/i, '').trim()

    if (!sender || !cleanText) {
      return NextResponse.json({ status: 'ignored', reason: 'no_message_content' })
    }

    // 2. IDENTIFY BUSINESS UNIT
    // For this 30-minute POC, we will hardcode your "SkinCoach" ID.
    // In the SaaS version, we lookup business_unit_id from business_unit_settings.whatsapp_phone_number_id
    const HARDCODED_BU_ID = process.env.WHATSAPP_TEST_BU_ID || 'your-default-bu-id'
    
    console.log(`🧠 Routing WhatsApp message to AI Brain for BU: ${HARDCODED_BU_ID}`)

    // 3. GENERATE AI RESPONSE (The "One Brain")
    const aiResult = await generateSiloedResponse({
      businessUnitId: HARDCODED_BU_ID,
      message: cleanText,
      conversationHistory: [], // In Phase 3, we'll fetch real history from DB
      staffRole: 'coach',
      staffName: 'Sarah',
      language: 'en'
    })

    // 4. SEND REPLY VIA GATEWAY (The "Hand")
    const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL // e.g., https://gate.whapi.cloud/messages/text
    const GATEWAY_TOKEN = process.env.WHATSAPP_GATEWAY_TOKEN

    if (GATEWAY_URL && GATEWAY_TOKEN) {
      console.log(`📤 Sending WhatsApp reply to ${sender}...`)
      
      // Simulate "Typing..." state if the gateway supports it
      await fetch(GATEWAY_URL.replace('/text', '/typing'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sender, typing: true })
      }).catch(e => console.warn('Typing status failed', e))

      // Final Send
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: sender,
          body: aiResult.response,
          // Handle Whapi vs Maytapi naming differences
          chatId: sender,
          text: aiResult.response 
        })
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('❌ Gateway Send Error:', err)
      }
    } else {
      console.warn('⚠️ WhatsApp Gateway Credentials missing in .env.local')
    }

    return NextResponse.json({ success: true, ai_responded: true })

  } catch (error: any) {
    console.error('❌ WhatsApp Webhook Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// For Verification Handshake (if needed by gateway)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hubMode = searchParams.get('hub.mode')
  const hubVerifyToken = searchParams.get('hub.verify_token')
  const hubChallenge = searchParams.get('hub.challenge')

  return new NextResponse(hubChallenge || 'Webhook Active')
}
