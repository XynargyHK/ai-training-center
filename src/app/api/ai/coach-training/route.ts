import { NextRequest, NextResponse } from 'next/server'
import { generateSiloedResponse } from '@/lib/ai-engine'

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()
    const {
      businessUnitId, // REQUIRED NOW
      customerMessage,
      conversationHistory = [],
      staffName = 'AI Coach',
      staffRole = 'coach',
      language = 'en',
      scenario,
      // Metadata for RAG
      country = 'HK'
    } = params

    if (!customerMessage || !businessUnitId) {
      return NextResponse.json(
        { error: 'customerMessage and businessUnitId are required' },
        { status: 400 }
      )
    }

    // Use the Unified AI Engine (Server-side RAG)
    const result = await generateSiloedResponse({
      businessUnitId,
      aiStaffId: params.aiStaffId, // Pass the specific staff ID
      message: customerMessage,
      conversationHistory: conversationHistory.map((m: any) => ({
        role: m.sender === 'customer' || m.sender === 'user' ? 'user' : 'assistant',
        content: m.message
      })),
      staffName,
      staffRole,
      language,
      country,
      scenario,
      isTraining: true
    })

    return NextResponse.json({
      success: true,
      response: result.response,
      debug: result.contextUsed
    })

  } catch (error: any) {
    console.error('Coach training error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate training response' },
      { status: 500 }
    )
  }
}
