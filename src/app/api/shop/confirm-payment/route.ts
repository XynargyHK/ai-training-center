import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
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

    // Update order payment status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        metadata: {
          payment_intent_id: paymentIntentId,
          payment_method: paymentIntent.payment_method,
          paid_at: new Date().toISOString()
        }
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) throw updateError

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
