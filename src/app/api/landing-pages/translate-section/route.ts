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
      const skipFields = [
        'background_url', 'background_type', 'background_color',
        'image_url', 'video_url', 'cta_url', 'video_poster',
        'is_carousel', 'is_price_banner', 'order', 'id',
        'original_filename', 'image_width', 'image_height',
        'font_family', 'font_size', 'font_weight', 'text_align',
        'color', 'headline_color', 'subheadline_color', 'content_color',
        'headline_font_family', 'subheadline_font_family', 'content_font_family',
        'headline_font_size', 'subheadline_font_size', 'content_font_size',
        'headline_bold', 'headline_italic', 'subheadline_bold', 'subheadline_italic',
        'content_bold', 'content_italic', 'headline_text_align', 'subheadline_text_align',
        'content_text_align'
      ]

      if (skipFields.includes(key)) {
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
    const { sectionData, targetLanguage, context } = body

    if (!sectionData || !targetLanguage) {
      return NextResponse.json(
        { error: 'sectionData and targetLanguage are required' },
        { status: 400 }
      )
    }

    console.log(`Translating section to ${targetLanguage}...`)

    const translatedData = await translateObject(sectionData, targetLanguage, context || 'skincare and beauty')

    return NextResponse.json({
      success: true,
      translatedData
    })

  } catch (error) {
    console.error('Translate section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
