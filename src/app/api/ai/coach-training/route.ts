import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { buildAIPrompt, buildUserReminder } from '@/lib/ai-prompt-builder'

// Initialize Google Gemini client - ONLY Gemini, no fallbacks
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

interface CoachTrainingRequest {
  // Structured fields (new)
  staffName?: string
  staffRole?: string
  scenario?: {
    name: string
    description: string
    customerType: string
    successCriteria?: string[]
  }
  feedbackMemory?: string[]
  trainingMemory?: { [key: string]: string[] }

  // Shared with livechat
  language?: string

  // Existing fields
  prompt?: string // legacy: ignored when structured fields are present
  customerMessage: string
  conversationHistory: Array<{
    sender: 'user' | 'customer' | string
    message: string
    timestamp: string
  }>
  customerPersona: string
  knowledgeBase?: Array<{
    id: string
    category: string
    content: string
    keywords?: string[]
    topic?: string
  }>
  guidelines?: Array<{
    id: string
    category: string
    title: string
    content: string
  }>

  // Revision fields
  revision?: {
    previousResponse: string
    feedbackMessage: string
    customerQuestion: string
    needsShorter: boolean
    needsLonger: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CoachTrainingRequest = await request.json()
    const {
      staffName = 'AI Coach',
      staffRole = 'coach',
      scenario,
      feedbackMemory = [],
      trainingMemory = {},
      language = 'en',
      customerMessage,
      conversationHistory,
      customerPersona,
      knowledgeBase = [],
      guidelines = [],
      revision,
    } = body

    // Debug logging
    console.log('=== COACH TRAINING API DEBUG ===')
    console.log('Knowledge Base Entries:', knowledgeBase?.length || 0)
    console.log('Guidelines:', guidelines?.length || 0)
    console.log('Structured scenario:', scenario ? scenario.name : 'none')
    if (knowledgeBase && knowledgeBase.length > 0) {
      console.log('First 3 KB entries:', knowledgeBase.slice(0, 3).map(k => ({ category: k.category, topic: k.topic, contentLength: k.content?.length })))
    }

    if (!customerMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for Google API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.sender === 'user' ? 'Coach' : 'Customer'}: ${msg.message}`)
      .join('\n')

    // Build system prompt using shared builder
    const systemPrompt = buildAIPrompt({
      staffName,
      staffRole,
      knowledgeBase,
      guidelines,
      trainingMemory,
      conversationHistory: conversationContext,
      scenario: scenario || {
        name: 'Training Session',
        description: body.prompt || 'General training scenario',
        customerType: customerPersona,
      },
      feedbackMemory,
      revision,
      language,
    })

    const hasKnowledge = knowledgeBase.length > 0
    const userPrompt = `As a professional AI coach, respond to this ${customerPersona} customer's message: "${customerMessage}"${buildUserReminder(hasKnowledge)}${hasKnowledge ? `\n5. You are being EVALUATED - one hallucinated product = FAILURE\n\nNow respond professionally without making up ANY product names.` : ''}`

    // Get dynamic LLM configuration
    const llmConfig = getLLMConfig()

    // ONLY use Google Gemini - no fallbacks
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: llmConfig.temperature ?? 0.7,
        maxOutputTokens: 4096,
      }
    })

    const response = result.response
    const aiCoachResponse = response.text() || ''

    if (!aiCoachResponse) {
      throw new Error('No response generated from Gemini')
    }

    // Return the AI Coach response
    return NextResponse.json({
      success: true,
      response: aiCoachResponse,
      metadata: {
        model: llmConfig.model || 'gemini-2.5-flash',
        provider: 'google',
        customerPersona: customerPersona,
        scenario: scenario?.name || 'Training Session',
        tokens: 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI Coach Training API Error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI Coach response' },
      { status: 500 }
    )
  }
}

// Optional: Add a GET endpoint for testing
export async function GET() {
  const config = getLLMConfig()
  return NextResponse.json({
    message: 'AI Coach Training API is running',
    model: config.model || 'gemini-2.5-flash',
    provider: 'google',
    status: 'ready'
  })
}
