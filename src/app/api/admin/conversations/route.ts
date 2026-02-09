/**
 * Admin Conversations API
 * GET - Fetch all conversations with filters
 * POST - Trigger analysis for a session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeAndUpdateSession } from '@/lib/conversation-analyzer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch conversations with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const flagFilter = searchParams.get('flag') || 'all'
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('chat_sessions')
      .select(`
        id,
        user_identifier,
        user_id,
        language,
        keywords,
        flag_level,
        flag_reason,
        total_messages,
        started_at,
        ended_at,
        analyzed_at,
        metadata
      `, { count: 'exact' })
      .order('started_at', { ascending: false })

    // Apply flag filter
    if (flagFilter === 'alert') {
      query = query.eq('flag_level', 'alert')
    } else if (flagFilter === 'warning') {
      query = query.in('flag_level', ['warning', 'alert'])
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('started_at', dateTo + 'T23:59:59')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: sessions, error, count } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get last message and user info for each session
    const sessionsWithDetails = await Promise.all(
      (sessions || []).map(async (session) => {
        // Get last message
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('message_type, content, created_at')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMessage = messages?.[0] || null

        // Get user profile if user_id exists
        let userProfile = null
        if (session.user_id) {
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('full_name, email')
            .eq('user_id', session.user_id)
            .single()
          userProfile = profile
        }

        // Determine display name
        const displayName = userProfile?.full_name
          || userProfile?.email
          || session.user_identifier
          || session.metadata?.userName
          || session.metadata?.userEmail
          || `Guest_${session.id.slice(0, 6)}`

        return {
          ...session,
          display_name: displayName,
          last_message: lastMessage ? {
            type: lastMessage.message_type,
            content: lastMessage.content,
            timestamp: lastMessage.created_at
          } : null
        }
      })
    )

    // Filter by search term (on display_name, keywords)
    let filteredSessions = sessionsWithDetails
    if (search) {
      const searchLower = search.toLowerCase()
      filteredSessions = sessionsWithDetails.filter(session => {
        const nameMatch = session.display_name?.toLowerCase().includes(searchLower)
        const keywordMatch = session.keywords?.some((k: string) => k.toLowerCase().includes(searchLower))
        const messageMatch = session.last_message?.content?.toLowerCase().includes(searchLower)
        return nameMatch || keywordMatch || messageMatch
      })
    }

    return NextResponse.json({
      success: true,
      conversations: filteredSessions,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Admin conversations GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST - Get full conversation or trigger analysis
export async function POST(request: NextRequest) {
  try {
    const { action, sessionId } = await request.json()

    if (action === 'get_messages') {
      // Fetch all messages for a session
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, message_type, content, created_at, has_image, image_url')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, messages })
    }

    if (action === 'analyze') {
      // Fetch messages and run analysis
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('message_type, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const analysis = await analyzeAndUpdateSession(sessionId, messages || [], supabase)

      return NextResponse.json({ success: true, analysis })
    }

    if (action === 'analyze_all_unanalyzed') {
      // Find sessions without analysis and analyze them
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .is('analyzed_at', null)
        .not('total_messages', 'eq', 0)
        .limit(20) // Process in batches

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      let analyzed = 0
      for (const session of sessions || []) {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('message_type, content, created_at')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true })

        if (messages && messages.length > 0) {
          await analyzeAndUpdateSession(session.id, messages, supabase)
          analyzed++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Analyzed ${analyzed} conversations`,
        remaining: (sessions?.length || 0) - analyzed
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin conversations POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}
