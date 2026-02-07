/**
 * Customer Orders API
 * GET - Fetch orders for a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch orders for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        display_id,
        email,
        status,
        fulfillment_status,
        payment_status,
        currency_code,
        subtotal,
        total,
        shipping_address,
        shipping_carrier,
        tracking_number,
        estimated_delivery,
        shipped_at,
        delivered_at,
        created_at,
        metadata,
        order_items(
          id,
          title,
          thumbnail,
          quantity,
          unit_price,
          total
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    })
  } catch (error) {
    console.error('Customer orders GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
