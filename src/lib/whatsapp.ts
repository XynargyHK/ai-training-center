/**
 * WhatsApp Business API Utility
 * 
 * This utility handles sending messages back to customers using Meta's Cloud API.
 */

interface WhatsAppSendOptions {
  accessToken: string
  phoneNumberId: string
  to: string
  text: string
}

export async function sendWhatsAppMessage(opts: WhatsAppSendOptions) {
  const { accessToken, phoneNumberId, to, text } = opts
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  console.log(`📱 WhatsApp API: Sending message to ${to}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        body: text,
      },
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    console.error('❌ WhatsApp API Error:', JSON.stringify(result, null, 2))
    throw new Error(result.error?.message || 'Failed to send WhatsApp message')
  }

  console.log(`✅ WhatsApp API: Message sent successfully (ID: ${result.messages?.[0]?.id})`)
  return result
}
