import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function resolveBusinessUnitId(param: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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
    const { businessUnitId, country, languageCode } = await request.json()

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId required' }, { status: 400 })
    }

    const resolvedId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Load industry knowledge
    const { data: knowledgeRows } = await supabase
      .from('knowledge_base')
      .select('topic, content, category')
      .eq('business_unit_id', resolvedId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!knowledgeRows || knowledgeRows.length === 0) {
      return NextResponse.json({ error: 'No industry knowledge found. Please add knowledge first.' }, { status: 400 })
    }

    const knowledgeSummary = knowledgeRows
      .map(k => `[${k.category}] ${k.topic}:\n${k.content}`)
      .join('\n\n---\n\n')
      .slice(0, 8000)

    const lang = languageCode || 'en'
    const langName = LANGUAGE_NAMES[lang] || 'English'

    const prompt = `You are an expert landing page copywriter. Based on the following business knowledge, generate compelling landing page content in ${langName}.

BUSINESS KNOWLEDGE:
${knowledgeSummary}

Generate a complete landing page content structure with 2 variations for each section. Output ONLY valid JSON in this exact format:

{
  "problem": [
    {
      "heading": "Section heading (e.g. 'Are You Struggling With...')",
      "steps": [
        { "title": "Pain point title", "text_content": "1-2 sentence description of this pain point" },
        { "title": "Pain point title", "text_content": "1-2 sentence description" },
        { "title": "Pain point title", "text_content": "1-2 sentence description" }
      ]
    },
    {
      "heading": "Alternative section heading",
      "steps": [
        { "title": "Pain point title", "text_content": "Description" },
        { "title": "Pain point title", "text_content": "Description" },
        { "title": "Pain point title", "text_content": "Description" }
      ]
    }
  ],
  "solution": [
    {
      "heading": "Section heading (e.g. 'Introducing Our Solution')",
      "steps": [
        { "title": "Benefit title", "text_content": "How this solves the problem" },
        { "title": "Benefit title", "text_content": "Description" },
        { "title": "Benefit title", "text_content": "Description" }
      ]
    },
    {
      "heading": "Alternative heading",
      "steps": [
        { "title": "Benefit title", "text_content": "Description" },
        { "title": "Benefit title", "text_content": "Description" },
        { "title": "Benefit title", "text_content": "Description" }
      ]
    }
  ],
  "howItWorks": [
    {
      "heading": "Section heading (e.g. 'How It Works')",
      "steps": [
        { "title": "Step 1 title", "text_content": "What happens in this step" },
        { "title": "Step 2 title", "text_content": "What happens in this step" },
        { "title": "Step 3 title", "text_content": "What happens in this step" }
      ]
    },
    {
      "heading": "Alternative heading",
      "steps": [
        { "title": "Step 1 title", "text_content": "Description" },
        { "title": "Step 2 title", "text_content": "Description" },
        { "title": "Step 3 title", "text_content": "Description" }
      ]
    }
  ],
  "faq": [
    {
      "heading": "Frequently Asked Questions",
      "items": [
        { "title": "Question?", "content": "Answer to the question." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." }
      ]
    },
    {
      "heading": "Alternative FAQ heading",
      "items": [
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." },
        { "title": "Question?", "content": "Answer." }
      ]
    }
  ],
  "cta": [
    {
      "headline": "Strong call-to-action headline",
      "subheadline": "Supporting text that encourages action",
      "cta_text": "Button text (e.g. GET STARTED)"
    },
    {
      "headline": "Alternative CTA headline",
      "subheadline": "Alternative supporting text",
      "cta_text": "Alternative button text"
    }
  ]
}

Rules:
- Write in ${langName}
- Be specific to this business, not generic
- Keep text concise and persuasive
- Use the knowledge provided to create accurate, relevant content`

    const rawResponse = await callLLM(prompt)

    // Parse JSON - handle both pure JSON and markdown code blocks
    let sections
    try {
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : rawResponse
      sections = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ sections })

  } catch (err) {
    console.error('Generate landing page error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
