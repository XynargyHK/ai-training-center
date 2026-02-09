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

interface TrainingData {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
  variations: string[]
  tone: 'professional' | 'friendly' | 'expert' | 'casual'
  priority: number
  active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      context = 'general',
      conversationHistory = [],
      knowledgeBase = [],
      trainingData = [],
      guidelines = [],
      staffName = 'AI Coach',
      staffRole = 'coach',
      trainingMemory = {},
      language = 'en',  // Default to English
      image = null,  // Image data for vision models
      userName = null  // User's name for personalized greeting
    } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check for FAQ match first using vector search (fast + smart response)
    // Skip if SUPABASE_SERVICE_ROLE_KEY is not available (optional feature)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { hybridSearchFAQs } = await import('@/lib/supabase-storage')
        const faqResults = await hybridSearchFAQs(message, 1) // Get top 1 match

        if (faqResults.length > 0 && faqResults[0].similarity > 0.7) {
          const faq = faqResults[0]
          console.log('✅ FAQ vector match found:', faq.question, 'similarity:', faq.similarity)
          return NextResponse.json({
            success: true,
            response: faq.short_answer || faq.answer,
            context,
            usedTemplate: true,
            responseType: 'faq',
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.log('⚠️ FAQ vector search failed, continuing to AI generation:', error)
      }
    } else {
      console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY not set, skipping FAQ vector search')
    }

    // Generate AI response using AI model + knowledge base
    const response = await generateAIResponse(
      message,
      context,
      conversationHistory,
      knowledgeBase,
      trainingData,
      guidelines,
      staffName,
      staffRole,
      trainingMemory,
      language,
      image,
      userName
    )

    return NextResponse.json({
      success: true,
      response,
      context,
      usedTemplate: false,
      responseType: 'ai',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

async function generateAIResponse(
  message: string,
  context: string,
  conversationHistory: any[],
  knowledgeBase: any[],
  trainingData: TrainingData[],
  guidelines: any[] = [],
  staffName: string = 'AI Coach',
  staffRole: string = 'coach',
  trainingMemory: {[key: string]: string[]} = {},
  language: string = 'en',
  image: string | null = null,
  userName: string | null = null
): Promise<string> {

  // Debug logging
  console.log('=== AI CHAT DEBUG ===')
  console.log('Knowledge Base Entries:', knowledgeBase.length)
  console.log('Guidelines:', guidelines.length)
  console.log('User Message:', message)
  console.log('📷 Image provided:', image ? 'YES (length: ' + image.length + ')' : 'NO')

  if (knowledgeBase.length > 0) {
    console.log('✅ Including ALL knowledge base entries:', knowledgeBase.length)
  } else {
    console.log('Knowledge base is EMPTY - AI should say "Let me check on that"')
  }

  // Build training examples context using vector search
  let trainingContext = ''

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { vectorSearchTrainingData } = await import('@/lib/supabase-storage')
      const relevantTraining = await vectorSearchTrainingData(message, 3)

      if (relevantTraining.length > 0) {
        trainingContext = '\n\nTRAINING EXAMPLES:\n' + relevantTraining
          .map(entry => `Q: ${entry.question}\nA: ${entry.answer} (relevance: ${entry.similarity?.toFixed(2)})`)
          .join('\n\n')
        console.log('✅ Vector search found', relevantTraining.length, 'training examples')
      }
    } catch (vectorError) {
      console.log('⚠️ Training data vector search failed, using fallback:', vectorError)

      // Fallback to keyword matching if vector search fails
      if (trainingData.length > 0) {
        const relevantTraining = trainingData
          .filter(entry => entry.active)
          .filter(entry => {
            const messageLower = message.toLowerCase()
            return entry.keywords.some(keyword => messageLower.includes(keyword.toLowerCase())) ||
                   messageLower.includes(entry.question.toLowerCase()) ||
                   entry.variations.some(variation => messageLower.includes(variation.toLowerCase()))
          })
          .slice(0, 3)

        if (relevantTraining.length > 0) {
          trainingContext = '\n\nTRAINING EXAMPLES:\n' + relevantTraining
            .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
            .join('\n\n')
        }
      }
    }
  } else {
    // No service role key - use keyword matching only
    console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY not set, using keyword matching for training data')
    if (trainingData.length > 0) {
      const relevantTraining = trainingData
        .filter(entry => entry.active)
        .filter(entry => {
          const messageLower = message.toLowerCase()
          return entry.keywords.some(keyword => messageLower.includes(keyword.toLowerCase())) ||
                 messageLower.includes(entry.question.toLowerCase()) ||
                 entry.variations.some(variation => messageLower.includes(variation.toLowerCase()))
        })
        .slice(0, 3)

      if (relevantTraining.length > 0) {
        trainingContext = '\n\nTRAINING EXAMPLES:\n' + relevantTraining
          .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
          .join('\n\n')
      }
    }
  }

  // Build conversation history text for the shared prompt builder
  const recentHistory = conversationHistory
  const conversationContext = recentHistory
    .map((msg: any) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
    .join('\n')

  if (guidelines.length > 0) {
    console.log('✅ Including ALL guidelines:', guidelines.length)
  }
  if (trainingMemory && Object.keys(trainingMemory).length > 0) {
    console.log('Training memory applied for:', staffName, '- Scenarios:', Object.keys(trainingMemory).length)
  }

  // Use shared prompt builder for system prompt
  const systemPrompt = buildAIPrompt({
    staffName,
    staffRole,
    knowledgeBase,
    guidelines,
    trainingMemory,
    conversationHistory: conversationContext,
    language,
    image,
    userName,
  }) + (trainingContext ? `\n${trainingContext}` : '')

  try {
    // Get dynamic LLM configuration
    const llmConfig = getLLMConfig()

    let aiResponse = ""

    // ONLY use Google Gemini - no fallbacks
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

    // Build conversation history for Gemini
    const geminiContents: any[] = []

    // Add conversation history
    for (const msg of recentHistory) {
      const parts: any[] = [{ text: msg.content }]

      // Include image if present in history
      if (msg.image) {
        const imageData = msg.image.split(',')[1] // Extract base64 data
        const mimeType = msg.image.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
        parts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        })
      }

      geminiContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      })
    }

    // Add current user message with reminder and optional image
    const hasKnowledge = knowledgeBase.length > 0
    const currentMessageParts: any[] = [{ text: `${message}${buildUserReminder(hasKnowledge)}` }]

    // Add image to current message if provided
    if (image) {
      const imageData = image.split(',')[1] // Extract base64 data after "data:image/xxx;base64,"
      const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
      currentMessageParts.push({
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      })
      console.log('📷 Image included in Gemini request - MIME type:', mimeType)
    }

    geminiContents.push({
      role: 'user',
      parts: currentMessageParts
    })

    const result = await model.generateContent({
      contents: geminiContents,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: llmConfig.temperature ?? 0.7,
        maxOutputTokens: 4096,
      }
    })

    const response = result.response
    aiResponse = response.text() || "I'm here to help! Could you please provide more details about your question?"

    return aiResponse

  } catch (error) {
    console.error('AI API Error:', error)

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return "I'm having trouble connecting right now. Please check the API configuration."
      }
    }

    // Fallback to basic response if API fails
    return "I'm here to help! Could you please provide more details about your question? I'll do my best to assist you based on the information available."
  }
}

// GET handler for API status check
export async function GET() {
  const config = getLLMConfig()
  return NextResponse.json({
    status: 'ready',
    message: 'AI Chat API is operational',
    model: config.model || 'gemini-2.5-flash',
    provider: 'google',
    endpoints: {
      POST: 'Send a chat message with optional knowledgeBase and trainingData',
    },
    version: '3.0.0'
  })
}
