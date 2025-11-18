import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Anthropic client dynamically
function getAnthropicClient() {
  const config = getLLMConfig()
  if (config.provider === 'anthropic' && config.anthropicKey) {
    return new Anthropic({ apiKey: config.anthropicKey })
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// Initialize OpenAI client dynamically
function getOpenAIClient() {
  const config = getLLMConfig()
  if (config.provider === 'openai' && config.openaiKey) {
    return new OpenAI({ apiKey: config.openaiKey })
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and targetLanguage are required' },
        { status: 400 }
      )
    }

    // Get LLM configuration
    const config = getLLMConfig()

    let translation = ''

    if (config.provider === 'anthropic') {
      // Use Anthropic Claude
      const anthropic = getAnthropicClient()

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Only return the translation, nothing else.\n\nText: ${text}`
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        translation = content.text
      }
    } else {
      // Use OpenAI
      const openai = getOpenAIClient()

      const response = await openai.chat.completions.create({
        model: config.openaiModel || 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Only return the translation, nothing else.\n\nText: ${text}`
        }],
        max_tokens: 1024,
        temperature: 0.3
      })

      translation = response.choices[0]?.message?.content || text
    }

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
