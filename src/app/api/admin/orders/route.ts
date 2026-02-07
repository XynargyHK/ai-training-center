/**
 * Admin Orders API
 * GET - Fetch all orders with optional filtering
 * PUT - Update order status and tracking info
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all orders with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Search by email or display_id
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_id.ilike.%${search}%`)
    }

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// PUT - Update order status and tracking info
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      status,
      shipping_carrier,
      tracking_number,
      estimated_delivery
    } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}

    // Update status if provided
    if (status) {
      updateData.status = status

      // Set timestamps based on status change
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
        updateData.fulfillment_status = 'shipped'
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
        updateData.fulfillment_status = 'delivered'
      }
    }

    // Update tracking info
    if (shipping_carrier !== undefined) {
      updateData.shipping_carrier = shipping_carrier
    }
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number
    }
    if (estimated_delivery !== undefined) {
      updateData.estimated_delivery = estimated_delivery
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
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
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('Admin orders PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    )
  }
}
