import { Resend } from 'resend'

// Check if API key is configured
const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.warn('⚠️ RESEND_API_KEY is not configured - emails will not be sent')
}

const resend = new Resend(apiKey)

// Email translations
const emailTranslations = {
  en: {
    orderConfirmed: 'Order Confirmed!',
    thankYou: (name: string) => `Thank you for your order, ${name}!`,
    orderNumber: 'Order Number',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    total: 'Total',
    shippingAddress: 'Shipping Address',
    whatsNext: "What's Next?",
    whatsNextText: "We're preparing your order for shipment. You'll receive a tracking number once your order ships.",
    questions: 'Questions? Contact us at',
    allRightsReserved: 'All rights reserved.',
    subjectPrefix: 'Order Confirmed'
  },
  tw: {
    orderConfirmed: '訂單已確認！',
    thankYou: (name: string) => `感謝您的訂購，${name}！`,
    orderNumber: '訂單編號',
    item: '商品',
    qty: '數量',
    price: '價格',
    subtotal: '小計',
    shipping: '運費',
    free: '免運費',
    total: '總計',
    shippingAddress: '收貨地址',
    whatsNext: '接下來呢？',
    whatsNextText: '我們正在準備您的訂單。訂單出貨後，您將收到物流追蹤編號。',
    questions: '有任何問題？請聯繫我們',
    allRightsReserved: '版權所有',
    subjectPrefix: '訂單確認'
  }
}

interface OrderItem {
  title: string
  quantity: number
  unit_price: number
}

interface OrderConfirmationData {
  orderId: string
  displayId?: number
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  total: number
  currencySymbol: string
  shippingAddress?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country?: string
  }
  businessName?: string
  supportEmail?: string
  language?: string
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const {
    orderId,
    displayId,
    customerName,
    customerEmail,
    items,
    subtotal,
    total,
    currencySymbol,
    shippingAddress,
    businessName = 'SkinCoach',
    supportEmail = 'cs@skincoach.ai',
    language = 'en'
  } = data

  // Determine language - treat 'tw', 'zh-Hant', 'zh-TW' as Traditional Chinese
  const isChinese = language === 'tw' || language === 'zh-Hant' || language === 'zh-TW'
  const t = isChinese ? emailTranslations.tw : emailTranslations.en

  const orderNumber = displayId ? `#${displayId}` : orderId.slice(0, 8).toUpperCase()

  // Build items HTML
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${currencySymbol}${(item.unit_price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  // Build shipping address HTML
  let shippingHtml = ''
  if (shippingAddress) {
    const addressParts = [
      shippingAddress.first_name && shippingAddress.last_name
        ? `${shippingAddress.first_name} ${shippingAddress.last_name}`
        : null,
      shippingAddress.address_1,
      shippingAddress.address_2,
      [shippingAddress.city, shippingAddress.province, shippingAddress.postal_code].filter(Boolean).join(', '),
      shippingAddress.country
    ].filter(Boolean)

    shippingHtml = `
      <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${t.shippingAddress}</h3>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ${addressParts.join('<br>')}
        </p>
      </div>
    `
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${isChinese ? 'zh-Hant' : 'en'}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans TC', 'PingFang TC', sans-serif; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; color: #333;">${businessName}</h1>
        </div>

        <!-- Main Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <!-- Success Icon -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
          </div>

          <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 500; text-align: center; color: #333;">
            ${t.orderConfirmed}
          </h2>

          <p style="margin: 0 0 30px 0; text-align: center; color: #666;">
            ${t.thankYou(customerName)}
          </p>

          <div style="background: #f9f9f9; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; color: #666; font-size: 14px;">${t.orderNumber}</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600; color: #333; letter-spacing: 1px;">${orderNumber}</p>
          </div>

          <!-- Order Items -->
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="padding: 12px 0; text-align: left; font-weight: 500; color: #666;">${t.item}</th>
                <th style="padding: 12px 0; text-align: center; font-weight: 500; color: #666;">${t.qty}</th>
                <th style="padding: 12px 0; text-align: right; font-weight: 500; color: #666;">${t.price}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #333;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #666;">${t.subtotal}</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">${currencySymbol}${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">${t.shipping}</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">${t.free}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 18px; font-weight: 600; color: #333;">${t.total}</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #333;">${currencySymbol}${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${shippingHtml}

          <!-- Next Steps -->
          <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #166534;">${t.whatsNext}</h3>
            <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
              ${t.whatsNextText}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">
            ${t.questions} <a href="mailto:${supportEmail}" style="color: #666;">${supportEmail}</a>
          </p>
          <p style="margin: 0;">
            © ${new Date().getFullYear()} ${businessName}. ${t.allRightsReserved}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  // Check API key before attempting to send
  if (!apiKey) {
    console.error('❌ Cannot send email: RESEND_API_KEY not configured')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  console.log('📧 Attempting to send order confirmation email to:', customerEmail)
  console.log('📧 Order:', orderNumber, 'Total:', currencySymbol + total.toFixed(2), 'Language:', language)

  try {
    const result = await resend.emails.send({
      from: `${businessName} <cs@skincoach.ai>`,
      to: customerEmail,
      cc: 'order@skincoach.ai',
      subject: `${t.subjectPrefix} - ${orderNumber}`,
      html: emailHtml
    })

    console.log('✅ Order confirmation email sent:', JSON.stringify(result))
    return { success: true, data: result }
  } catch (error: any) {
    console.error('❌ Failed to send order confirmation email:', error?.message || error)
    console.error('❌ Full error:', JSON.stringify(error, null, 2))
    return { success: false, error }
  }
}
