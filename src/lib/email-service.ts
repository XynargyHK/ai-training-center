import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    supportEmail = 'support@skincoach.ai'
  } = data

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
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Shipping Address</h3>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ${addressParts.join('<br>')}
        </p>
      </div>
    `
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
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
            Order Confirmed!
          </h2>

          <p style="margin: 0 0 30px 0; text-align: center; color: #666;">
            Thank you for your order, ${customerName}!
          </p>

          <div style="background: #f9f9f9; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600; color: #333; letter-spacing: 1px;">${orderNumber}</p>
          </div>

          <!-- Order Items -->
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="padding: 12px 0; text-align: left; font-weight: 500; color: #666;">Item</th>
                <th style="padding: 12px 0; text-align: center; font-weight: 500; color: #666;">Qty</th>
                <th style="padding: 12px 0; text-align: right; font-weight: 500; color: #666;">Price</th>
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
                <td style="padding: 8px 0; color: #666;">Subtotal</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">${currencySymbol}${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Shipping</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">Free</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 18px; font-weight: 600; color: #333;">Total</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #333;">${currencySymbol}${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${shippingHtml}

          <!-- Next Steps -->
          <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #166534;">What's Next?</h3>
            <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
              We're preparing your order for shipment. You'll receive a tracking number once your order ships.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">
            Questions? Contact us at <a href="mailto:${supportEmail}" style="color: #666;">${supportEmail}</a>
          </p>
          <p style="margin: 0;">
            © ${new Date().getFullYear()} ${businessName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: `${businessName} <cs@skincoach.ai>`,
      to: customerEmail,
      subject: `Order Confirmed - ${orderNumber}`,
      html: emailHtml
    })

    console.log('✅ Order confirmation email sent:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error)
    return { success: false, error }
  }
}
