import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function resolveBusinessUnitId(param: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(param)) return param
  const { data } = await supabase.from('business_units').select('id').eq('slug', param).single()
  return data?.id || null
}

async function callLLM(prompt: string): Promise<string> {
  const llmConfig = getLLMConfig()

  switch (llmConfig.provider) {
    case 'google': {
      const genAI = new GoogleGenerativeAI(llmConfig.googleKey!)
      const model = genAI.getGenerativeModel({ model: llmConfig.model })
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    }
    case 'anthropic': {
      const anthropic = new Anthropic({ apiKey: llmConfig.anthropicKey! })
      const response = await anthropic.messages.create({
        model: llmConfig.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
      return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    }
    case 'openai':
    default: {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.openaiKey}`
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      })
      const data = await response.json()
      return data.choices[0]?.message?.content?.trim() || '{}'
    }
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  tw: 'Traditional Chinese',
  cn: 'Simplified Chinese',
  vi: 'Vietnamese',
}

export async function POST(request: NextRequest) {
  try {
    const { 
      businessUnitId, 
      country, 
      languageCode,
      sourceType,
      sources,
      customInstructions,
      existingSections
    } = await request.json()

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId required' }, { status: 400 })
    }

    const resolvedId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    let sourceContent = ''

    if (sourceType === 'multi' && sources && Array.isArray(sources)) {
      const contents = await Promise.all(sources.map(async (src: any) => {
        if (src.type === 'document') {
          const { data: doc } = await supabase
            .from('knowledge_base')
            .select('topic, content')
            .eq('id', src.id)
            .single()
          return doc ? `DOCUMENT [${doc.topic}]:\n${doc.content}` : ''
        } else {
          const { data: scraped } = await supabase
            .from('knowledge_base')
            .select('content')
            .eq('file_path', src.value)
            .maybeSingle()
          return scraped ? `URL [${src.value}]:\n${scraped.content}` : `URL [${src.value}]: (Analyze public presence)`
        }
      }))
      sourceContent = contents.filter(Boolean).join('\n\n---\n\n')
    } else {
      const { data: knowledgeRows } = await supabase
        .from('knowledge_base')
        .select('topic, content, category')
        .eq('business_unit_id', resolvedId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (knowledgeRows && knowledgeRows.length > 0) {
        sourceContent = knowledgeRows
          .map(k => `[${k.category}] ${k.topic}:\n${k.content}`)
          .join('\n\n---\n\n')
      }
    }

    if (!sourceContent) {
      return NextResponse.json({ error: 'No source content found. Please add knowledge first.' }, { status: 400 })
    }

    const lang = languageCode || 'en'
    const langName = LANGUAGE_NAMES[lang] || 'English'

    // 1. Fetch relevant images from the media library to provide as context
    let availableImages: any[] = []
    try {
      const { data: images } = await supabase
        .from('image_library')
        .select('name, url, description')
        .eq('business_unit_id', resolvedId)
        .limit(30)
      availableImages = images || []
    } catch (err) {
      console.error('Error fetching images for context:', err)
    }

    const imageContext = availableImages.length > 0 
      ? `\nAVAILABLE IMAGES IN MEDIA LIBRARY:\n${availableImages.map(img => `- "${img.name}": ${img.description || 'No description'} (URL: ${img.url})`).join('\n')}`
      : ''

    let contextPrompt = ''
    if (existingSections) {
      contextPrompt = `
CURRENT DRAFT:
${JSON.stringify(existingSections, null, 2)}

You are refining this draft. Keep the sections the user likes, but apply the changes requested in the custom instructions below.
`
    }

    const prompt = `You are an expert B2B landing page designer. Generate a tutorial-focused landing page for BrezCode, a system where beauticians help customers perform a 45-minute Quick Test using a tablet in a physical salon.

${contextPrompt}
SOURCE CONTENT (B2B Manual):
${sourceContent.slice(0, 10000)}
${imageContext}

USER CUSTOM INSTRUCTIONS:
${customInstructions || "Reconstruct the B2B tutorial: Step 1 Add Client, Step 2 Pair Device, Step 3 Wear Sensors, Step 4 Upload. Use an interactive accordion where each step is a title, and clicking it opens the instruction and matching image."}

Output MUST be a single, valid JSON object.

AVAILABLE BLOCKS & THEIR SCHEMAS:
- 'split': { "type": "split", "headline": "...", "subheadline": "...", "content": "...", "cta_text": "...", "layout": "image-right" | "image-left", "image_url": "URL from Available Images" }
- 'text_image_grid': { "type": "text_image_grid", "heading": "...", "overall_layout": "vertical" | "horizontal", "steps": [ { "subheadline": "...", "text_content": "...", "background_url": "URL from Available Images" } ] }
- 'form': { "type": "form", "headline": "...", "subheadline": "...", "content": "...", "submit_button_text": "...", "fields": [ { "label": "...", "placeholder": "...", "type": "text"|"email"|"tel"|"textarea"|"number"|"date"|"time"|"url"|"signature", "required": true } ] }
- 'accordion': { "type": "accordion", "headline": "...", "items": [ { "title": "...", "content": "...", "image_url": "URL from Available Images" } ] }

BLOCK MAPPING RULES:
1. For the interactive "Press to Open" tutorial, use the 'accordion' block. Each item should be a "STEP".
2. If the user wants a static visual flow, use 'text_image_grid'.
3. Always match images from the 'AVAILABLE IMAGES' list.

STRUCTURE:
{
  "sections": {
    "intro": [ 2 options of type split or static_banner ],
    "main_content": [ 2 options of type accordion or steps ],
    "social_proof": [ 2 options of type testimonials or logo_cloud ],
    "interaction": [ 2 options of type form or pricing ],
    "faq": [ 2 options of type accordion ]
  }
}

IMPORTANT:
1. Every field MUST be a string or array.
2. Ensure ALL labels and text are in ${langName}.
3. If refining, strictly prioritize the user's improvisations.
4. NO trailing commas.`

    // Use JSON mode for Gemini if configured
    const llmConfig = getLLMConfig()
    let rawResponse = ''
    
    if (llmConfig.provider === 'google') {
      const genAI = new GoogleGenerativeAI(llmConfig.googleKey!)
      const model = genAI.getGenerativeModel({ 
        model: llmConfig.model,
        generationConfig: { responseMimeType: "application/json" }
      })
      const result = await model.generateContent(prompt)
      rawResponse = result.response.text().trim()
    } else {
      rawResponse = await callLLM(prompt)
    }

    let parsed
    try {
      // Find the first { and last } to isolate the JSON block
      const startIdx = rawResponse.indexOf('{')
      const endIdx = rawResponse.lastIndexOf('}')
      
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON object found in AI response')
      }
      
      const jsonStr = rawResponse.substring(startIdx, endIdx + 1)
      parsed = JSON.parse(jsonStr)
    } catch (parseError: any) {
      console.error('❌ AI JSON Parse Error:', parseError)
      console.error('📋 Raw Response:', rawResponse)
      return NextResponse.json({ error: `Failed to parse AI response: ${parseError.message}` }, { status: 500 })
    }

    const finalSections = parsed.sections || parsed
    return NextResponse.json({ sections: finalSections })

  } catch (err: any) {
    console.error('Generate landing page error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
