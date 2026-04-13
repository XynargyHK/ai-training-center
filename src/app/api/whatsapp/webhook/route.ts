import { NextRequest, NextResponse } from 'next/server'
import { generateSiloedResponse } from '@/lib/ai-engine'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * UNIVERSAL WHATSAPP WEBHOOK
 * Handles incoming messages from Gateway (Whapi/Maytapi) or Meta API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📱 WhatsApp Webhook Received:', JSON.stringify(body, null, 2))

    // 1. EXTRACT DATA (Universal Mapping)
    const messageData = body.messages?.[0] || body[0]?.message || body.data
    const sender = messageData?.from || body.from || body.chatId
    const text = messageData?.text?.body || messageData?.body || body.text
    // Identify which Business Unit this belongs to via the phone_id / instance_id
    const incomingPhoneId = body.phone_id || body.instance_id || body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id

    if (!sender || !text) {
      return NextResponse.json({ status: 'ignored', reason: 'no_message_content' })
    }

    // 1.2. GROUP DETECTION & SENDER NAME
    const isGroup = sender.includes('@g.us') || body.chatId?.includes('@g.us')
    const pushName = messageData?.pushName || body.pushName || body.senderName || 'Member'
    const cleanText = text.replace(/^#ai\s*/i, '').replace(/^sarah\s*/i, '').trim() || text

    // 1.3. TRIGGER LOGIC (For groups, only respond if Sarah or #AI is mentioned)
    const hasTrigger = text.toLowerCase().includes('sarah') || text.toLowerCase().includes('#ai')
    const shouldRespond = !isGroup || hasTrigger

    // 2. IDENTIFY BUSINESS UNIT DYNAMICALLY
    let businessUnitId = process.env.WHATSAPP_TEST_BU_ID
    let settings = null

    if (incomingPhoneId) {
      const { data, error } = await supabase
        .from('business_unit_settings')
        .select('*')
        .eq('whatsapp_phone_number_id', incomingPhoneId)
        .single()
      
      if (data) {
        businessUnitId = data.business_unit_id
        settings = data
        console.log(`✅ Found BU matching WhatsApp ID: ${businessUnitId}`)
      } else if (error) {
        console.warn(`⚠️ No BU found for WhatsApp ID ${incomingPhoneId}:`, error.message)
      }
    }

    if (!businessUnitId) {
      console.error('❌ Could not identify Business Unit for this message')
      return NextResponse.json({ error: 'Unknown Business Unit' }, { status: 404 })
    }

    // 2.5. FETCH CONVERSATION HISTORY (Sarah's Memory)
    const { data: historyData } = await supabase
      .from('whatsapp_conversations')
      .select('role, content, metadata')
      .eq('wa_chat_id', sender)
      .eq('business_unit_id', businessUnitId)
      .order('created_at', { ascending: false })
      .limit(15) // Slightly more history for groups

    const conversationHistory = (historyData || []).reverse().map((msg: any) => ({
      role: msg.role,
      content: isGroup && msg.role === 'user' && msg.metadata?.pushName 
        ? `${msg.metadata.pushName}: ${msg.content}` 
        : msg.content
    }))

    // 2.6. STORE USER MESSAGE
    await supabase.from('whatsapp_conversations').insert({
      business_unit_id: businessUnitId,
      wa_chat_id: sender,
      role: 'user',
      content: cleanText,
      metadata: { pushName, isGroup }
    })
    
    if (!shouldRespond) {
      console.log('🔇 Group message without trigger, skipping AI response.')
      return NextResponse.json({ success: true, ai_responded: false, reason: 'no_trigger' })
    }

    console.log(`🧠 Routing WhatsApp message to AI Brain for BU: ${businessUnitId} (History: ${conversationHistory.length} msgs)`)

    // 2.7 DEMO MODE — SPA Collection hardcoded context (remove after demo)
    const DEMO_BU_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'
    let demoPrefix = ''
    if (businessUnitId === DEMO_BU_ID) {
      demoPrefix = `[IMPORTANT CONTEXT — You are Sarah, the AI receptionist for SPA Collection (水療中心), a luxury spa in Causeway Bay, Hong Kong.

WELCOME MENU — When someone says "hi", "hello", "hey", or messages you for the first time, respond with:
"Hi! 歡迎來到 SPA Collection! I'm Sarah, your AI assistant. How can I help? 😊

1️⃣ Book an appointment
2️⃣ Browse services & prices
3️⃣ Talk to a staff member
4️⃣ 🎤 Voice AI assistant

Or just type anything and I'll help!"

When they pick a number or describe what they want, respond naturally. Don't force the menu if they ask a direct question.

SERVICES & PRICES:
- Hydrating Facial — HK$580 (60 min)
- Deep Cleansing Facial — HK$480 (45 min)
- Anti-Aging Facial — HK$780 (75 min)
- Full Body Massage — HK$680 (60 min)
- Aromatherapy Massage — HK$880 (90 min)
- Neck & Shoulder Treatment — HK$380 (30 min)
- Eye Treatment — HK$280 (20 min)

PRODUCTS:
- Hydrating Serum (30ml) — HK$380
- Recovery Cream (50ml) — HK$280
- Cleansing Oil (100ml) — HK$220
- Eye Cream (15ml) — HK$320

BOOKING FLOW:
- Ask what service they want
- Ask preferred date and time (available: Mon-Sat 10am-8pm, closed Sunday)
- Confirm the booking details
- After confirming, naturally suggest ONE add-on (upsell):
  • Neck care add-on — HK$400 (was HK$500, 20% off this month)
  • Aromatherapy oil upgrade — HK$150 extra
  • Eye treatment add-on — HK$200 extra
  • First-time package — 30% off total

VOICE AI:
- If customer wants voice AI, send: "Tap here to talk with me by voice: https://www.aistaffs.app/voiceapr9web"

LOCATION: SPA Collection, 3/F, Times Square, Causeway Bay, Hong Kong
HOURS: Mon-Sat 10:00 AM - 8:00 PM, Closed Sunday
PHONE: +852 9470 0952

LANGUAGE: Respond in the SAME language the customer uses. If they type Cantonese, reply in colloquial Cantonese. If English, reply in English. If Mandarin, reply in Mandarin.

PERSONALITY: Warm, friendly, professional. Like a real receptionist who genuinely cares. Use emojis sparingly. Keep replies concise — 2-3 sentences max unless listing services/prices.]

`
    }

    // 3. GENERATE AI RESPONSE
    const aiResult = await generateSiloedResponse({
      businessUnitId: businessUnitId,
      message: demoPrefix + cleanText,
      conversationHistory: conversationHistory,
      staffRole: 'coach',
      staffName: 'Sarah',
      language: 'en',
      isGroup,
      senderName: pushName
    })

    // 3.5. STORE AI RESPONSE
    await supabase.from('whatsapp_conversations').insert({
      business_unit_id: businessUnitId,
      wa_chat_id: sender,
      role: 'assistant',
      content: aiResult.response
    })

    // 3.6. NOTIFY BRAIN (queue event for Secretary Batcher)
    try {
      const BRAIN_URL = process.env.BRAIN_URL
      if (BRAIN_URL) {
        await fetch(`${BRAIN_URL}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_unit_id: businessUnitId,
            user_id: sender,
            event_type: 'whatsapp_message',
            priority: 'briefing',
            content: {
              summary: `WhatsApp from ${sender}: ${cleanText.substring(0, 100)}`,
              ai_response: aiResult.response.substring(0, 200),
            }
          })
        })
      }
    } catch (brainErr) {
      console.warn('Brain event notification failed (non-critical):', brainErr)
    }

    // 4. SEND REPLY
    // Option A: Use Meta Official API if credentials exist
    if (settings?.whatsapp_access_token && settings?.whatsapp_phone_number_id) {
      console.log('📤 Sending via Official Meta API...')
      await sendWhatsAppMessage({
        accessToken: settings.whatsapp_access_token,
        phoneNumberId: settings.whatsapp_phone_number_id,
        to: sender,
        text: aiResult.response
      })
    } 
    // Option B: Fallback to self-hosted Baileys Gateway
    else {
      const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL
      console.log(`📤 Gateway URL: "${GATEWAY_URL}", sender: "${sender}"`)

      if (GATEWAY_URL) {
        try {
          const sendUrl = `${GATEWAY_URL}/messages/text`
          console.log(`📤 Sending via Baileys Gateway: POST ${sendUrl}`)

          const gatewayRes = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: sender,
              body: aiResult.response
            })
          })
          const gatewayText = await gatewayRes.text()
          console.log(`📤 Gateway response (${gatewayRes.status}): ${gatewayText}`)
        } catch (gwErr: any) {
          console.error('❌ Gateway send failed:', gwErr.message)
        }
      } else {
        console.warn('⚠️ No WhatsApp credentials (Meta or Gateway) available')
      }
    }

    return NextResponse.json({ success: true, ai_responded: true, gateway_url: process.env.WHATSAPP_GATEWAY_URL, sender })

  } catch (error: any) {
    console.error('❌ WhatsApp Webhook Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// For Verification Handshake (if needed by gateway)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hubChallenge = searchParams.get('hub.challenge')

  // Diagnostic endpoint
  if (searchParams.get('diag') === '1') {
    const gwUrl = process.env.WHATSAPP_GATEWAY_URL || '(not set)'
    const buId = process.env.WHATSAPP_TEST_BU_ID || '(not set)'
    return NextResponse.json({
      WHATSAPP_GATEWAY_URL: gwUrl.substring(0, 50),
      WHATSAPP_TEST_BU_ID: buId.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    })
  }

  return new NextResponse(hubChallenge || 'Webhook Active')
}
