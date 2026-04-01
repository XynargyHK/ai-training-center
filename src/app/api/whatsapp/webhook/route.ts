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

    // 1.5. SAFETY FILTER — disabled for dedicated business number (+85294740952)
    // Previously required #AI prefix for personal number testing
    // Now all messages are processed since this is a business-only number
    const cleanText = text.replace(/^#ai\s*/i, '').replace(/^sarah\s*/i, '').trim() || text

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
      .select('role, content')
      .eq('wa_chat_id', sender)
      .eq('business_unit_id', businessUnitId)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversationHistory = (historyData || []).reverse()

    // 2.6. STORE USER MESSAGE
    await supabase.from('whatsapp_conversations').insert({
      business_unit_id: businessUnitId,
      wa_chat_id: sender,
      role: 'user',
      content: cleanText
    })
    
    console.log(`🧠 Routing WhatsApp message to AI Brain for BU: ${businessUnitId} (History: ${conversationHistory.length} msgs)`)

    // 3. GENERATE AI RESPONSE
    const aiResult = await generateSiloedResponse({
      businessUnitId: businessUnitId,
      message: cleanText,
      conversationHistory: conversationHistory, 
      staffRole: 'coach',
      staffName: 'Sarah',
      language: 'en'
    })

    // 3.5. STORE AI RESPONSE
    await supabase.from('whatsapp_conversations').insert({
      business_unit_id: businessUnitId,
      wa_chat_id: sender,
      role: 'assistant',
      content: aiResult.response
    })

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

    return NextResponse.json({ success: true, ai_responded: true })

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
