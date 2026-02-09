import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from '@/lib/email-service'

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  USD: '$',
  HKD: 'HK$',
  SGD: 'S$',
  GBP: '£',
  EUR: '€',
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
  })
  try {
    const { orderId, paymentIntentId } = await request.json()

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Order ID and Payment Intent ID are required' },
        { status: 400 }
      )
    }

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: 'Payment not successful' },
        { status: 400 }
      )
    }

    // Get existing order with items to merge metadata and send email
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    // Update order - change from 'pending' to 'processing' after successful payment
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        fulfillment_status: 'processing',
        metadata: {
          ...(existingOrder?.metadata || {}),
          payment_intent_id: paymentIntentId,
          payment_method: paymentIntent.payment_method,
          paid_at: new Date().toISOString()
        }
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single()

    if (updateError) throw updateError

    // Send order confirmation email
    if (order && existingOrder) {
      const customerEmail = order.email || existingOrder.metadata?.customer_email
      const customerName = existingOrder.metadata?.customer_name ||
                          order.shipping_address?.first_name ||
                          'Valued Customer'

      if (customerEmail) {
        const currencyCode = order.currency_code || 'USD'
        const currencySymbol = currencySymbols[currencyCode.toUpperCase()] || '$'

        // Send email asynchronously (don't block response)
        sendOrderConfirmationEmail({
          orderId: order.id,
          displayId: order.display_id,
          customerName,
          customerEmail,
          items: (order.order_items || []).map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price / 100 // Convert from cents
          })),
          subtotal: (order.subtotal || order.total) / 100,
          total: order.total / 100,
          currencySymbol,
          shippingAddress: order.shipping_address,
          businessName: 'SkinCoach',
          supportEmail: 'cs@skincoach.ai'
        }).catch(err => console.error('Email send error:', err))
      } else {
        console.warn('No customer email found for order:', orderId)
      }
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
