import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Google Gemini client
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
  return new GoogleGenerativeAI(apiKey)
}

// Language name mapping for better prompts
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh-TW': 'Traditional Chinese (繁體中文)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  'vi': 'Vietnamese (Tiếng Việt)'
}

export async function POST(request: NextRequest) {
  try {
    const { faq, targetLanguages } = await request.json()

    if (!faq || !faq.question || !faq.answer) {
      return NextResponse.json(
        { error: 'FAQ with question and answer required' },
        { status: 400 }
      )
    }

    if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'At least one target language required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const sourceLanguage = faq.language || 'en'
    const sourceLanguageName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage

    // Translate to each target language
    const translations = []

    for (const targetLang of targetLanguages) {
      const targetLanguageName = LANGUAGE_NAMES[targetLang] || targetLang

      const prompt = `You are a professional translator specializing in FAQ translation.

Translate the following FAQ from ${sourceLanguageName} to ${targetLanguageName}.

CRITICAL REQUIREMENTS:
1. Maintain the EXACT meaning and tone of the original
2. Keep all product names, brand names, and technical terms in their original form
3. Preserve any pricing information and currency symbols
4. Keep the same level of formality and professionalism
5. Use culturally appropriate phrasing for the target language
6. Maintain the same length and structure as much as possible

Original FAQ:
Category: ${faq.category}
Question: ${faq.question}
Answer: ${faq.answer}

Return your translation as a JSON object with this exact structure:
{
  "question": "Translated question in ${targetLanguageName}",
  "answer": "Translated answer in ${targetLanguageName}",
  "category": "${faq.category}",
  "keywords": ["translated", "keywords"]
}

IMPORTANT: Use ONLY straight double quotes (") in the JSON, NOT curly quotes (" or ").
Return ONLY the JSON object, no additional text or explanations.`

      // Call Gemini API
      const genAI = getGoogleClient()
      const llmConfig = getLLMConfig()
      const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent translations
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        }
      })

      const responseText = result.response.text() || ''

      // Parse JSON response
      let translatedData: any
      try {
        // Clean the response text
        let cleanedText = responseText.trim()

        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

        // Replace smart quotes with regular quotes
        cleanedText = cleanedText
          .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
          .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")

        // Try to extract JSON object from the response
        const jsonMatch = cleanedText.match(/\{\s*"[^"]*"[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : cleanedText

        translatedData = JSON.parse(jsonString)
      } catch (parseError) {
        console.error(`Failed to parse translation for ${targetLang}:`, parseError)
        console.error('Response text:', responseText.substring(0, 500))
        return NextResponse.json(
          {
            error: `Failed to parse translation for ${targetLanguageName}`,
            details: responseText.substring(0, 500)
          },
          { status: 500 }
        )
      }

      translations.push({
        language: targetLang,
        languageName: targetLanguageName,
        question: translatedData.question || faq.question,
        answer: translatedData.answer || faq.answer,
        category: faq.category,
        keywords: Array.isArray(translatedData.keywords) ? translatedData.keywords : faq.keywords || []
      })
    }

    return NextResponse.json({
      success: true,
      translations,
      count: translations.length
    })

  } catch (error: any) {
    console.error('FAQ translation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to translate FAQ',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FAQ Translation API',
    method: 'POST',
    body: {
      faq: 'FAQ object with question, answer, category, language',
      targetLanguages: 'Array of ISO language codes (e.g., ["zh-TW", "vi"])'
    }
  })
}
