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
      // Get all customer profiles with order and chat counts
      let query = supabase
        .from('customer_profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      const { data: profiles, error } = await query.limit(100)

      if (error) {
        console.error('Error fetching profiles:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get counts for each user
      const profilesWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Count orders
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)

          // Count chats
          const { count: chatCount } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)

          // Get last activity
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

      return NextResponse.json({ success: true, profiles: profilesWithCounts })
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
              .select('full_name, email')
              .eq('user_id', session.user_id)
              .single()
            if (profile) {
              displayName = profile.full_name || profile.email || displayName
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
          let userName = null
          let userEmail = order.email

          if (order.user_id) {
            const { data: profile } = await supabase
              .from('customer_profiles')
              .select('full_name, email')
              .eq('user_id', order.user_id)
              .single()
            if (profile) {
              userName = profile.full_name
              userEmail = profile.email || order.email
            }
          }

          return {
            ...order,
            user_name: userName,
            user_email: userEmail,
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

// POST - Get detailed user data for popup
export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json()

    if (action === 'get_user_details') {
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
      }

      // Get profile
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
        profile: profile || { user_id: userId, full_name: 'Unknown', email: null },
        orders: orders?.map(o => ({ ...o, items: o.order_items })) || [],
        chats: chats || [],
        messages: messages.reverse() // Show oldest first
      })
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
