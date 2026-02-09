/**
 * Shop Checkout API
 * Creates orders from cart items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CartItem {
  product_id: string
  title: string
  thumbnail?: string
  quantity: number
  unit_price: number
}

interface CheckoutData {
  customer: {
    name: string
    email: string
    phone?: string
  }
  shipping_address?: {
    address: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  items: CartItem[]
  subtotal: number
  total: number
  currency?: string
  notes?: string
  user_id?: string
}

// POST - Create order
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutData = await request.json()
    const { customer, shipping_address, items, subtotal, total, currency, notes, user_id } = body

    if (!customer?.email || !customer?.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name and email are required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Create the order - status is 'processing' since payment is done
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id || null,
        email: customer.email,
        status: 'processing',
        fulfillment_status: 'processing',
        payment_status: 'not_paid',
        currency_code: currency?.toUpperCase() || 'USD',
        subtotal: subtotal,
        total: total,
        shipping_address: shipping_address || null,
        metadata: {
          customer_name: customer.name,
          customer_phone: customer.phone || null,
          notes: notes || null
        }
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      title: item.title,
      thumbnail: item.thumbnail || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
      total: item.unit_price * item.quantity,
      metadata: {
        product_id: item.product_id
      }
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        total: order.total,
        status: order.status,
        created_at: order.created_at
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET - Fetch order by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
