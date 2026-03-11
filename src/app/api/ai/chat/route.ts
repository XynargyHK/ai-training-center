import { NextRequest, NextResponse } from 'next/server'
import { generateSiloedResponse } from '@/lib/ai-engine'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const {
      message,
      businessUnitId, // REQUIRED NOW
      conversationHistory = [],
      staffName = 'AI Coach',
      staffRole = 'coach',
      language = 'en',
      country = 'HK',
      image = null,
      userName = null,
      userProfile = null,
      userOrders = null
    } = requestData

    if (!message || !businessUnitId) {
      return NextResponse.json(
        { error: 'Message and businessUnitId are required' },
        { status: 400 }
      )
    }

    // Use the Unified AI Engine (Server-side RAG)
    // PROOF: A is A. We use EXACTLY the same engine call for everyone.
    const result = await generateSiloedResponse({
      businessUnitId,
      aiStaffId: requestData.aiStaffId,
      message,
      conversationHistory,
      staffName,
      staffRole,
      language,
      country,
      image,
      userName,
      userProfile,
      userOrders,
      isTraining: false // Force false so training Sarah acts EXACTLY like live Sarah
    })

    return NextResponse.json({
      success: true,
      response: result.response,
      timestamp: new Date().toISOString(),
      debug: result.contextUsed
    })

  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ready', engine: 'v3-unified-siloed' })
}
