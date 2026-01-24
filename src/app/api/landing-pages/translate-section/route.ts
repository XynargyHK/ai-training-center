import { NextRequest, NextResponse } from 'next/server'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

// Translate text using configured LLM
async function translateText(text: string, targetLanguage: string, context: string = 'skincare and beauty'): Promise<string> {
  if (!text || !text.trim()) return text

  const llmConfig = getLLMConfig()

  const languageMap: { [key: string]: string } = {
    'zh': 'Traditional Chinese (Hong Kong)',
    'cn': 'Simplified Chinese',
    'en': 'English',
    'es': 'Spanish',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German'
  }

  const targetLang = languageMap[targetLanguage] || targetLanguage

  const prompt = `You are a professional translator specializing in ${context} content.

Translate the following text to ${targetLang}.

CRITICAL RULES:
1. Preserve ALL HTML tags, markdown formatting exactly
2. Use professional terminology for ${context}
3. Maintain tone and style
4. Keep brand names in original language
5. Keep URLs unchanged
6. Respond with ONLY translated text, no explanations

Text:
"""
${text}
"""

Translation:`

  let translation = text

  try {
    switch (llmConfig.provider) {
      case 'google':
        const genAI = new GoogleGenerativeAI(llmConfig.googleKey!)
        const model = genAI.getGenerativeModel({ model: llmConfig.model })
        const result = await model.generateContent(prompt)
        translation = result.response.text().trim()
        break

      case 'anthropic':
        const anthropic = new Anthropic({ apiKey: llmConfig.anthropicKey! })
        const response = await anthropic.messages.create({
          model: llmConfig.model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }]
        })
        translation = response.content[0].type === 'text' ? response.content[0].text.trim() : text
        break

      case 'openai':
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmConfig.openaiKey}`
          },
          body: JSON.stringify({
            model: llmConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
          })
        })
        const data = await openaiResponse.json()
        translation = data.choices[0]?.message?.content?.trim() || text
        break
    }
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }

  return translation
}

// Check if a field should be skipped from translation
function shouldSkipField(key: string, value: any): boolean {
  // Skip null/undefined values
  if (value === null || value === undefined) {
    return true
  }

  // Skip non-string values (numbers, booleans)
  if (typeof value !== 'string' && typeof value !== 'object') {
    return true
  }

  // Skip empty strings
  if (typeof value === 'string' && value.trim() === '') {
    return true
  }

  // Skip URLs and file paths
  if (key.endsWith('_url') || key === 'url' || key === 'href') {
    return true
  }

  // Skip colors
  if (key.endsWith('_color') || key === 'color') {
    return true
  }

  // Skip font settings
  if (key.endsWith('_font_size') || key.endsWith('_font_family') || key === 'font_size' || key === 'font_family') {
    return true
  }

  // Skip layout and positioning
  if (key.endsWith('_align') || key === 'align' || key === 'layout' || key === 'text_position' || key === 'overall_layout') {
    return true
  }

  // Skip dimensions
  if (key.endsWith('_width') || key.endsWith('_height') || key === 'width' || key === 'height') {
    return true
  }

  // Skip styling booleans
  if (key.endsWith('_bold') || key.endsWith('_italic') || key === 'bold' || key === 'italic') {
    return true
  }

  // Skip technical fields (note: 'name' is NOT skipped because it's used as user-facing heading)
  const technicalFields = [
    'id', 'type', 'order',
    'background_type', 'is_carousel', 'is_price_banner',
    'original_filename', 'poster_url',
    'rating', 'autoplay', 'autoplay_interval',
    'rows', 'columns', 'currency_symbol',
    'original_price', 'discounted_price'
  ]
  if (technicalFields.includes(key)) {
    return true
  }

  return false
}

// Translate an entire object recursively
async function translateObject(obj: any, targetLanguage: string, context: string): Promise<any> {
  if (typeof obj === 'string') {
    return await translateText(obj, targetLanguage, context)
  }

  if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => translateObject(item, targetLanguage, context)))
  }

  if (obj && typeof obj === 'object') {
    const translated: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip fields that shouldn't be translated
      if (shouldSkipField(key, value)) {
        translated[key] = value
      } else {
        translated[key] = await translateObject(value, targetLanguage, context)
      }
    }
    return translated
  }

  return obj
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, targetLanguage, context = 'skincare and beauty' } = body

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'content and targetLanguage are required' },
        { status: 400 }
      )
    }

    console.log(`Translating section to ${targetLanguage}...`)
    console.log('Input content type:', content?.type)
    console.log('Input content keys:', Object.keys(content || {}))
    if (content?.data) {
      console.log('Input data keys:', Object.keys(content.data))
      if (content.data.steps) {
        console.log('Input steps count:', content.data.steps.length)
        console.log('First step keys:', Object.keys(content.data.steps[0] || {}))
        console.log('First step text_content:', content.data.steps[0]?.text_content?.substring(0, 100))
        console.log('First step text_position:', content.data.steps[0]?.text_position)
      }
    }

    const translated = await translateObject(content, targetLanguage, context)

    console.log('Translation completed')
    console.log('Output type:', translated?.type)
    console.log('Output content keys:', Object.keys(translated || {}))
    if (translated?.data) {
      console.log('Output data keys:', Object.keys(translated.data))
      if (translated.data.steps) {
        console.log('Output steps count:', translated.data.steps.length)
        console.log('First output step keys:', Object.keys(translated.data.steps[0] || {}))
        console.log('First output step text_content:', translated.data.steps[0]?.text_content?.substring(0, 100))
        console.log('First output step text_position:', translated.data.steps[0]?.text_position)
      }
    }

    return NextResponse.json({
      success: true,
      translated
    })

  } catch (error) {
    console.error('Translate section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
