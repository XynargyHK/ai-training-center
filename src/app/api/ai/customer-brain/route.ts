import { NextRequest, NextResponse } from 'next/server'
import { getLLMConfig } from '@/app/api/llm-config/route'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Initialize Google Gemini client dynamically
function getGoogleClient() {
  const config = getLLMConfig()
  const apiKey = config.googleKey || process.env.GOOGLE_GEMINI_API_KEY || ''
  return new GoogleGenerativeAI(apiKey)
}

// Ollama helper function
async function generateOllamaResponse(prompt: string, model: string, baseURL: string): Promise<string> {
  const ollamaResponse = await fetch(`${baseURL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 1.0,
        num_predict: 256,
      }
    })
  })

  if (!ollamaResponse.ok) {
    throw new Error(`Ollama API error: ${ollamaResponse.status}`)
  }

  const ollamaData = await ollamaResponse.json()
  return ollamaData.response?.trim() || ''
}

interface KnowledgeEntry {
  id: string
  category: string
  content: string
  keywords?: string[]
  topic?: string
}

interface CustomerBrainRequest {
  scenario: {
    name: string
    description: string
    customerType: string
    objectives: string[]
  }
  coachMessage: string
  conversationHistory: Array<{
    sender: 'user' | 'customer'
    message: string
    timestamp: string
  }>
  turn: number
  knowledgeBase?: KnowledgeEntry[]
  guidelines?: Array<{
    id: string
    category: string
    title: string
    content: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const {
      scenario,
      coachMessage,
      conversationHistory,
      turn,
      knowledgeBase = [],
      guidelines = []
    }: CustomerBrainRequest = await request.json()

    if (!scenario || !coachMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build conversation context for the AI Customer
    const conversationContext = conversationHistory
      .slice(-4) // Last 4 messages for context
      .map(msg => `${msg.sender === 'user' ? 'Coach' : 'Customer'}: ${msg.message}`)
      .join('\n')

    // Build knowledge base context so customer knows what products/services exist
    let knowledgeContext = ''
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = '\n\n📚 AVAILABLE PRODUCTS/SERVICES (use these in your questions):\n' +
        knowledgeBase
          .map(entry => `- ${entry.topic || entry.category}: ${entry.content}`)
          .join('\n') +
        '\n\nIMPORTANT: When asking about products/services, use REAL names from the list above, NOT placeholders like "[Product/Service]".\n'
    }

    // Create AI Customer personality prompt based on customer type
    const customerPersonalities = {
      angry: `You are a VERY FRUSTRATED customer who had a bad experience. You're demanding, skeptical, and need to be convinced through concrete actions (refunds, guarantees, expert consultation). You gradually become less hostile if the coach shows genuine effort to fix the problem.`,

      confused: `You are a CONFUSED customer who feels overwhelmed. You ask lots of clarifying questions, need simple explanations, and worry about making mistakes. You become more confident as the coach provides clear, step-by-step guidance.`,

      'price-sensitive': `You are a BUDGET-CONSCIOUS customer looking for affordable solutions that actually work. You question costs, ask about value, and need proof that expensive products/services are worth it. You're interested but need to see clear financial value.`,

      'tech-savvy': `You are a RESEARCH-ORIENTED customer who wants scientific proof. You ask technical questions about details, data, and research. You respect expertise and detailed explanations.`,

      enthusiastic: `You are an EXCITED customer who loves trying new innovations. You're eager to try advanced products/services and want the most comprehensive solutions. You're ready to invest in premium options.`
    }

    const customerPersonality = customerPersonalities[scenario.customerType as keyof typeof customerPersonalities] || customerPersonalities.confused

    // Create system prompt for AI Customer
    const systemPrompt = `${customerPersonality}

CURRENT SCENARIO: ${scenario.name}
SCENARIO CONTEXT: ${scenario.description}${knowledgeContext}

CONVERSATION PROGRESS: This is turn ${turn} of the conversation.

RECENT CONVERSATION:
${conversationContext}

COACH'S LATEST RESPONSE: "${coachMessage}"

INSTRUCTIONS FOR YOUR RESPONSE:
- YOU ARE THE CUSTOMER, NOT THE REPRESENTATIVE
- DO NOT greet anyone or say "Welcome to..." - you are the one being helped
- DO NOT use templates like "{{customer_name}}" or "{{business_name}}"
- Respond naturally as a ${scenario.customerType} customer would
- React to what the coach just said in a realistic way
- Progress the conversation naturally (don't repeat the same concerns)
- Show character development - gradually move toward resolution if the coach is doing well
- Ask follow-up questions that challenge the coach to meet the scenario objectives
- Keep responses conversational and realistic (1-3 sentences)
- Don't be too easy to convince, but don't be impossibly difficult either
- Use natural customer language, not marketing speak
${knowledgeContext ? `- When asking about products/services, use REAL product names from the knowledge base above
- DO NOT use placeholders like "[Product/Service]" or generic terms - be specific!` : ''}

IMPORTANT: You are a CUSTOMER seeking help, NOT a business representative greeting customers.

Generate a realistic customer response that moves the conversation forward naturally.`

    const userPrompt = `As a ${scenario.customerType} customer, how do you respond to the coach's message: "${coachMessage}"${knowledgeContext ? '\n\nRemember: Use real product/service names from the knowledge base, not placeholders!' : ''}`

    // Get dynamic LLM configuration
    const llmConfig = getLLMConfig()
    let aiCustomerResponse = ''
    let tokensUsed = 0

    // Route to appropriate AI provider based on global config
    if (llmConfig.provider === 'google') {
      // Google Gemini API
      const genAI = getGoogleClient()
      const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 256,
        }
      })

      const response = result.response
      aiCustomerResponse = response.text() || ''
      tokensUsed = 0

    } else if (llmConfig.provider === 'openai') {
      const openai = getOpenAIClient()
      const isGPT5 = llmConfig.model?.startsWith('gpt-5')

      const tokenParam = isGPT5
        ? { max_completion_tokens: 256 }
        : { max_tokens: 256 }

      const temperatureParam = isGPT5
        ? {}
        : { temperature: 1.0 }

      const response = await openai.chat.completions.create({
        model: llmConfig.model || 'gpt-4o',
        ...tokenParam,
        ...temperatureParam,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })

      aiCustomerResponse = response.choices[0]?.message?.content || ''
      tokensUsed = response.usage?.total_tokens || 0

    } else if (llmConfig.provider === 'ollama') {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
      aiCustomerResponse = await generateOllamaResponse(fullPrompt, llmConfig.model, llmConfig.ollamaUrl || 'http://localhost:11434')
      tokensUsed = Math.ceil(aiCustomerResponse.length / 4) // Rough estimate

    } else {
      // Anthropic Claude
      const anthropic = getAnthropicClient()

      const response = await anthropic.messages.create({
        model: llmConfig.model,
        max_tokens: 256,
        temperature: 1.0,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })

      aiCustomerResponse = response.content[0].type === 'text' ? response.content[0].text : ''
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens
    }

    if (!aiCustomerResponse) {
      throw new Error('No response generated from AI for customer')
    }

    // Return the AI Customer response
    return NextResponse.json({
      success: true,
      response: aiCustomerResponse,
      metadata: {
        model: llmConfig.model,
        provider: llmConfig.provider,
        customerType: scenario.customerType,
        turn: turn,
        tokens: tokensUsed,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI Customer Brain API Error:', error)

    // Handle specific AI errors
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'AI service not reachable. Please check configuration.' },
          { status: 500 }
        )
      }
      if (error.message.includes('API error')) {
        return NextResponse.json(
          { error: 'AI API error. Please check if the model is available.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate AI Customer response' },
      { status: 500 }
    )
  }
}

// Optional: Add a GET endpoint for testing
export async function GET() {
  const config = getLLMConfig()
  return NextResponse.json({
    message: 'AI Customer Brain API is running',
    model: config.model,
    provider: config.provider,
    status: 'ready'
  })
}
