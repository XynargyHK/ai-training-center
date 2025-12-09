import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Google Gemini client
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
  return new GoogleGenerativeAI(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, context } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and targetLanguage are required' },
        { status: 400 }
      )
    }

    // Get LLM configuration
    const llmConfig = getLLMConfig()

    let translation = ''

    // Build context-aware prompt
    let prompt = ''
    if (context === 'faq_category') {
      prompt = `Translate the following FAQ category name to ${targetLanguage} in a business/e-commerce context. This is a category label for customer support topics. Only return the translated category name, nothing else.\n\nCategory: ${text}`
    } else if (context === 'faq') {
      prompt = `Translate the following FAQ (Frequently Asked Question) to ${targetLanguage} for a customer support chat. Maintain professional tone. Only return the translation, nothing else.\n\nText: ${text}`
    } else {
      prompt = `Translate the following text to ${targetLanguage}. Only return the translation, nothing else.\n\nText: ${text}`
    }

    // Use Gemini for translation
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    })

    translation = result.response.text() || text

    return NextResponse.json({
      success: true,
      translation: translation.trim(),
      originalText: text,
      targetLanguage
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    )
  }
}
