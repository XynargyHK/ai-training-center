import { NextRequest, NextResponse } from 'next/server'
import {
  createChatSession,
  saveChatMessage,
  loadChatHistory,
  endChatSession,
  flagMessage,
  getFlaggedSessions
} from '@/lib/chat-storage'

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'create_session': {
        const sessionId = await createChatSession({
          businessUnitId: params.businessUnitId,
          aiStaffId: params.aiStaffId,
          userIdentifier: params.userIdentifier,
          userIp: params.userIp,
          userAgent: params.userAgent,
          language: params.language
        })
        return NextResponse.json({ success: true, sessionId })
      }

      case 'save_message': {
        const messageId = await saveChatMessage({
          sessionId: params.sessionId,
          messageType: params.messageType,
          content: params.content,
          imageBase64: params.imageBase64,
          aiModel: params.aiModel,
          aiProvider: params.aiProvider,
          tokensUsed: params.tokensUsed,
          isflagged: params.isFlagged,
          flagReason: params.flagReason,
          sentiment: params.sentiment
        })
        return NextResponse.json({ success: true, messageId })
      }

      case 'load_history': {
        const messages = await loadChatHistory(params.sessionId)
        return NextResponse.json({ success: true, messages })
      }

      case 'end_session': {
        await endChatSession(params.sessionId)
        return NextResponse.json({ success: true })
      }

      case 'flag_message': {
        await flagMessage(params.messageId, params.reason)
        return NextResponse.json({ success: true })
      }

      case 'get_flagged_sessions': {
        const sessions = await getFlaggedSessions(
          params.businessUnitId,
          params.limit
        )
        return NextResponse.json({ success: true, sessions })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Chat History API',
    actions: [
      'create_session',
      'save_message',
      'load_history',
      'end_session',
      'flag_message',
      'get_flagged_sessions'
    ]
  })
}
