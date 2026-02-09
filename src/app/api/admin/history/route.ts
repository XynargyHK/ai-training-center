/**
 * Admin History API
 * GET - Fetch profiles, chats, or orders based on view mode
 * POST - Get detailed user data for popup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch data based on view mode
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'chat'
    const search = searchParams.get('search') || ''
    const flagFilter = searchParams.get('flag') || 'all'

    // ===== PROFILE VIEW =====
    if (view === 'profile') {
      // Get customers from both profiles AND orders (some customers may only exist in orders)
      const allCustomers = new Map<string, any>()

      // 1. Get from customer_profiles (for SkinCoach customers)
      const { data: profiles } = await supabase
        .from('customer_profiles')
        .select('*')

      for (const p of profiles || []) {
        if (p.user_id) {
          allCustomers.set(p.user_id, {
            user_id: p.user_id,
            full_name: p.name,  // customer_profiles uses 'name' not 'full_name'
            email: p.email,
            phone: p.phone,
            skin_type: p.skin_type,
            created_at: p.created_at
          })
        }
      }

      // 2. Get unique users from orders (may not have profile)
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, email, shipping_address, metadata, created_at')
        .not('user_id', 'is', null)

      for (const o of orders || []) {
        if (o.user_id && !allCustomers.has(o.user_id)) {
          const addr = o.shipping_address as any
          const meta = o.metadata as any

          // Get name from shipping_address or metadata
          let fullName = null
          if (addr?.first_name || addr?.last_name) {
            fullName = `${addr.first_name || ''} ${addr.last_name || ''}`.trim()
          } else if (meta?.customer_name) {
            fullName = meta.customer_name
          }

          allCustomers.set(o.user_id, {
            user_id: o.user_id,
            full_name: fullName,
            email: o.email,
            phone: addr?.phone || meta?.customer_phone || null,
            created_at: o.created_at
          })
        }
      }

      // 3. Get counts for each customer
      const profilesWithCounts = await Promise.all(
        Array.from(allCustomers.values()).map(async (profile) => {
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)

          const { count: chatCount } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)

          const { data: lastChat } = await supabase
            .from('chat_sessions')
            .select('started_at')
            .eq('user_id', profile.user_id)
            .order('started_at', { ascending: false })
            .limit(1)

          return {
            ...profile,
            order_count: orderCount || 0,
            chat_count: chatCount || 0,
            last_active: lastChat?.[0]?.started_at || profile.created_at
          }
        })
      )

      // Sort by name and filter by search
      let result = profilesWithCounts.sort((a, b) =>
        (a.full_name || '').localeCompare(b.full_name || '')
      )

      if (search) {
        const searchLower = search.toLowerCase()
        result = result.filter(p =>
          p.full_name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          p.phone?.includes(search)
        )
      }

      return NextResponse.json({ success: true, profiles: result.slice(0, 100) })
    }

    // ===== CHAT VIEW =====
    if (view === 'chat') {
      let query = supabase
        .from('chat_sessions')
        .select(`
          id,
          user_id,
          user_identifier,
          keywords,
          flag_level,
          total_messages,
          started_at,
          metadata
        `)
        .order('started_at', { ascending: false })

      // Apply flag filter
      if (flagFilter === 'alert') {
        query = query.eq('flag_level', 'alert')
      } else if (flagFilter === 'warning') {
        query = query.in('flag_level', ['warning', 'alert'])
      }

      const { data: sessions, error } = await query.limit(100)

      if (error) {
        console.error('Error fetching chats:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get display name and last message for each session
      const chatsWithDetails = await Promise.all(
        (sessions || []).map(async (session) => {
          // Get last message
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('message_type, content')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)

          // Get user profile
          let displayName = session.user_identifier || `Guest_${session.id.slice(0, 6)}`
          if (session.user_id) {
            const { data: profile } = await supabase
              .from('customer_profiles')
              .select('name, email')
              .eq('user_id', session.user_id)
              .single()
            if (profile) {
              displayName = profile.name || profile.email || displayName
            }
          } else if (session.metadata?.userName) {
            displayName = session.metadata.userName
          }

          return {
            ...session,
            display_name: displayName,
            last_message: messages?.[0] ? {
              type: messages[0].message_type,
              content: messages[0].content
            } : null
          }
        })
      )

      // Filter by search
      let filteredChats = chatsWithDetails
      if (search) {
        const searchLower = search.toLowerCase()
        filteredChats = chatsWithDetails.filter(chat =>
          chat.display_name?.toLowerCase().includes(searchLower) ||
          chat.keywords?.some((k: string) => k.toLowerCase().includes(searchLower))
        )
      }

      return NextResponse.json({ success: true, chats: filteredChats })
    }

    // ===== ORDER VIEW =====
    if (view === 'order') {
      let query = supabase
        .from('orders')
        .select(`
          id,
          display_id,
          user_id,
          email,
          status,
          fulfillment_status,
          total,
          currency_code,
          tracking_number,
          shipping_carrier,
          shipping_address,
          metadata,
          created_at,
          order_items (
            id,
            title,
            quantity
          )
        `)
        .order('created_at', { ascending: false })

      const { data: orders, error } = await query.limit(100)

      if (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get user names for orders
      const ordersWithUsers = await Promise.all(
        (orders || []).map(async (order) => {
          // Name can come from multiple sources:
          // 1. shipping_address (first_name + last_name)
          // 2. order.metadata.customer_name (stored at checkout)
          // 3. customer_profiles (if linked by user_id)
          const addr = order.shipping_address as any
          const meta = order.metadata as any

          let userName = null
          let userEmail = order.email
          let userPhone = null

          // Try shipping address first
          if (addr?.first_name || addr?.last_name) {
            userName = `${addr.first_name || ''} ${addr.last_name || ''}`.trim()
            userPhone = addr.phone || null
          }

          // Try metadata.customer_name
          if (!userName && meta?.customer_name) {
            userName = meta.customer_name
            userPhone = meta.customer_phone || userPhone
          }

          // Try customer_profiles as last resort
          if (!userName && order.user_id) {
            const { data: profile } = await supabase
              .from('customer_profiles')
              .select('name, email, phone')
              .eq('user_id', order.user_id)
              .single()
            if (profile) {
              userName = profile.name
              userEmail = profile.email || order.email
              userPhone = profile.phone || userPhone
            }
          }

          return {
            ...order,
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            items: order.order_items
          }
        })
      )

      // Filter by search
      let filteredOrders = ordersWithUsers
      if (search) {
        const searchLower = search.toLowerCase()
        filteredOrders = ordersWithUsers.filter(order =>
          order.display_id?.toString().includes(search) ||
          order.user_name?.toLowerCase().includes(searchLower) ||
          order.user_email?.toLowerCase().includes(searchLower)
        )
      }

      return NextResponse.json({ success: true, orders: filteredOrders })
    }

    return NextResponse.json({ error: 'Invalid view mode' }, { status: 400 })

  } catch (error) {
    console.error('Admin history GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// POST - Get detailed user data for popup or update orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, orderId, status, trackingNumber, shippingCarrier } = body

    if (action === 'get_user_details') {
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
      }

      // Get profile from customer_profiles
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          display_id,
          status,
          total,
          currency_code,
          created_at,
          order_items (
            id,
            title,
            quantity
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get chat sessions
      const { data: chats } = await supabase
        .from('chat_sessions')
        .select('id, keywords, started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(5)

      // Get recent messages from user's sessions
      let messages: any[] = []
      if (chats && chats.length > 0) {
        const sessionIds = chats.map(c => c.id)
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id, message_type, content, created_at, session_id')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(20)
        messages = msgs || []
      }

      return NextResponse.json({
        success: true,
        profile: profile
          ? { ...profile, full_name: profile.name }  // Map 'name' to 'full_name' for frontend
          : { user_id: userId, full_name: 'Unknown', email: null },
        orders: orders?.map(o => ({ ...o, items: o.order_items })) || [],
        chats: chats || [],
        messages: messages.reverse() // Show oldest first
      })
    }

    if (action === 'update_order') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId required' }, { status: 400 })
      }

      // Build update object
      const updateData: any = {
        status: status,
        fulfillment_status: status,
        updated_at: new Date().toISOString()
      }

      if (trackingNumber !== undefined) {
        updateData.tracking_number = trackingNumber
      }

      if (shippingCarrier !== undefined) {
        updateData.shipping_carrier = shippingCarrier
      }

      // Set shipped_at timestamp when status changes to shipped
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      }

      // Set delivered_at timestamp when status changes to delivered
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Admin history POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
