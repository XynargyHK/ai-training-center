import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to resolve business unit ID
async function resolveBusinessUnitId(businessUnitParam: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(businessUnitParam)) {
    return businessUnitParam
  }

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', businessUnitParam)
    .single()

  return data?.id || null
}

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
    // Return original text on error
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
      if (['background_url', 'background_type', 'background_color', 'image_url', 'video_url', 'cta_url', 'is_carousel', 'is_price_banner', 'order', 'id', 'original_filename'].includes(key)) {
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
    const { businessUnitId, country, language, mode, sourceCountry, sourceLanguage } = body

    if (!businessUnitId || !country || !language) {
      return NextResponse.json(
        { error: 'businessUnitId, country, and language are required' },
        { status: 400 }
      )
    }

    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Check if locale already exists
    const { data: existing } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', country)
      .eq('language_code', language)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Locale already exists' }, { status: 409 })
    }

    let newPageData: any = {
      business_unit_id: resolvedBusinessUnitId,
      country,
      language_code: language,
      is_active: true,
      hero_type: 'carousel',
      hero_slides: [],
      announcements: [],
      blocks: [],
      menu_items: [],
      footer: {}
    }

    // If copying or translating from source
    if ((mode === 'copy' || mode === 'translate') && sourceCountry && sourceLanguage) {
      const { data: sourcePage, error: sourceError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_unit_id', resolvedBusinessUnitId)
        .eq('country', sourceCountry)
        .eq('language_code', sourceLanguage)
        .single()

      if (sourceError || !sourcePage) {
        return NextResponse.json({ error: 'Source locale not found' }, { status: 404 })
      }

      // Copy ALL fields from source, then override locale-specific fields
      const { id, created_at, updated_at, ...sourceData } = sourcePage
      newPageData = {
        ...sourceData,
        business_unit_id: resolvedBusinessUnitId,
        country,
        language_code: language,
        is_active: true
      }

      // If translate mode, translate all text content
      if (mode === 'translate') {
        console.log(`Translating content to ${language}...`)

        // Translate hero slides
        if (newPageData.hero_slides && newPageData.hero_slides.length > 0) {
          newPageData.hero_slides = await translateObject(newPageData.hero_slides, language, 'skincare and beauty')
        }

        // Translate announcements
        if (newPageData.announcements && newPageData.announcements.length > 0) {
          newPageData.announcements = await translateObject(newPageData.announcements, language, 'skincare and beauty')
        }

        // Translate blocks
        if (newPageData.blocks && newPageData.blocks.length > 0) {
          newPageData.blocks = await translateObject(newPageData.blocks, language, 'skincare and beauty')
        }

        // Translate menu items
        if (newPageData.menu_items && newPageData.menu_items.length > 0) {
          newPageData.menu_items = await translateObject(newPageData.menu_items, language, 'skincare and beauty')
        }

        // Translate footer
        if (newPageData.footer && newPageData.footer.length > 0) {
          newPageData.footer = await translateObject(newPageData.footer, language, 'skincare and beauty')
        }

        console.log(`Translation completed for ${country}/${language}`)
      }
    }

    // Create the new landing page
    const { data: newPage, error: createError } = await supabase
      .from('landing_pages')
      .insert(newPageData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating landing page:', createError)
      return NextResponse.json(
        { error: 'Failed to create landing page', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      landingPage: newPage,
      message: `Landing page created for ${country}/${language}`
    })

  } catch (error) {
    console.error('Create locale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
