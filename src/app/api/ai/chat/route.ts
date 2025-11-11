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
  // Fallback to environment variable
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// Initialize OpenAI client dynamically
function getOpenAIClient() {
  const config = getLLMConfig()
  if (config.provider === 'openai' && config.openaiKey) {
    return new OpenAI({ apiKey: config.openaiKey })
  }
  // Fallback to environment variable
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

interface KnowledgeEntry {
  id: string
  category: string
  topic: string
  content: string
  keywords: string[]
  confidence: number
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
      trainingMemory = {}
    } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check for FAQ match first using vector search (fast + smart response)
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
      trainingMemory
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
  knowledgeBase: KnowledgeEntry[],
  trainingData: TrainingData[],
  guidelines: any[] = [],
  staffName: string = 'AI Coach',
  staffRole: string = 'coach',
  trainingMemory: {[key: string]: string[]} = {}
): Promise<string> {

  // Build knowledge context from knowledge base
  let knowledgeContext = ''

  // Debug logging
  console.log('=== AI CHAT DEBUG ===')
  console.log('Knowledge Base Entries:', knowledgeBase.length)
  console.log('Guidelines:', guidelines.length)
  console.log('User Message:', message)

  // Use vector search if knowledge base has embeddings
  // Falls back to keyword search if vector search fails
  if (knowledgeBase.length > 0) {
    let relevantKnowledge = []

    try {
      // Try vector search first (semantic search)
      const { hybridSearchKnowledge } = await import('@/lib/supabase-storage')
      const vectorResults = await hybridSearchKnowledge(message, 10)

      if (vectorResults.length > 0) {
        relevantKnowledge = vectorResults
        console.log('✅ Vector search found:', relevantKnowledge.length, 'entries')
        console.log('Topics:', relevantKnowledge.map(k => `${k.topic} (similarity: ${k.similarity?.toFixed(2) || 'N/A'})`))
      } else {
        // Fallback to keyword matching
        console.log('⚠️ Vector search returned no results, falling back to keyword matching')
        const messageLower = message.toLowerCase()
        relevantKnowledge = knowledgeBase
          .filter(entry => {
            if (!entry.content) return false
            const contentLower = entry.content.toLowerCase()
            const categoryLower = entry.category?.toLowerCase() || ''
            const topicLower = entry.topic?.toLowerCase() || ''
            const messageWords = messageLower.split(' ').filter(w => w.length > 2)

            return messageWords.some(word =>
              topicLower.includes(word) ||
              categoryLower.includes(word) ||
              contentLower.includes(word)
            ) ||
            (entry.keywords && entry.keywords.some(keyword => messageLower.includes(keyword.toLowerCase())))
          })
      }
    } catch (vectorError) {
      // If vector search fails entirely, use keyword matching
      console.log('⚠️ Vector search failed, using keyword matching:', vectorError)
      const messageLower = message.toLowerCase()
      relevantKnowledge = knowledgeBase
        .filter(entry => {
          if (!entry.content) return false
          const contentLower = entry.content.toLowerCase()
          const categoryLower = entry.category?.toLowerCase() || ''
          const topicLower = entry.topic?.toLowerCase() || ''
          const messageWords = messageLower.split(' ').filter(w => w.length > 2)

          return messageWords.some(word =>
            topicLower.includes(word) ||
            categoryLower.includes(word) ||
            contentLower.includes(word)
          ) ||
          (entry.keywords && entry.keywords.some(keyword => messageLower.includes(keyword.toLowerCase())))
        })
    }

    if (relevantKnowledge.length > 0) {
      console.log('✅ Final filtered knowledge:', relevantKnowledge.length, 'entries')

      knowledgeContext = '\n\n📚 KNOWLEDGE BASE - CRITICAL: ONLY USE INFORMATION FROM THIS LIST:\n' + relevantKnowledge
        .map(entry => `- ${entry.topic}: ${entry.content}`)
        .join('\n') +
        '\n\n⚠️ DO NOT mention any products, prices, or information that are NOT listed above.'
    } else if (knowledgeBase.length > 0) {
      console.log('⚠️ No matches found - using ALL knowledge base entries as fallback:', knowledgeBase.length)

      // If no relevant match, include ALL general entries as fallback
      knowledgeContext = '\n\n📚 KNOWLEDGE BASE - CRITICAL: ONLY USE INFORMATION FROM THIS LIST:\n' +
        knowledgeBase
          .map(entry => `- ${entry.category ? `[${entry.category}] ` : ''}${entry.topic || ''}: ${entry.content}`)
          .join('\n') +
        '\n\n⚠️ DO NOT mention any products, prices, or information that are NOT listed above.'
    }
  } else {
    console.log('Knowledge base is EMPTY - AI should say "Let me check on that"')
  }

  // Build training examples context using vector search
  let trainingContext = ''

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

  // Build conversation history for context
  // Use full conversation history (no limit) for complete context
  const recentHistory = conversationHistory

  // Also create text version for system prompt (legacy)
  const conversationContext = recentHistory
    .map((msg: any) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
    .join('\n')

  // Build guidelines context using vector search
  let guidelinesContext = ''

  try {
    const { vectorSearchGuidelines } = await import('@/lib/supabase-storage')
    const relevantGuidelines = await vectorSearchGuidelines(message, 5)

    if (relevantGuidelines.length > 0) {
      guidelinesContext = '\n\n📋 TRAINING GUIDELINES - FOLLOW THESE RULES:\n' + relevantGuidelines
        .map((g: any) => `**${g.title}**\n${g.content} (relevance: ${g.similarity?.toFixed(2)})`)
        .join('\n\n')
      console.log('✅ Vector search found', relevantGuidelines.length, 'relevant guidelines')
    }
  } catch (vectorError) {
    console.log('⚠️ Guidelines vector search failed, using fallback:', vectorError)

    // Fallback to category filtering if vector search fails
    if (guidelines.length > 0) {
      // Use ALL guidelines for chatbot (general applies to everything, others provide specific rules)
      // FAQ guidelines = how to answer questions
      // Canned guidelines = message quality standards
      // Roleplay guidelines = learned from training sessions
      // General guidelines = always apply
      const relevantGuidelines = guidelines.filter((g: any) =>
        g.category === 'general' || g.category === 'faq' || g.category === 'canned' || g.category === 'roleplay'
      )

      if (relevantGuidelines.length > 0) {
        guidelinesContext = '\n\n📋 TRAINING GUIDELINES - FOLLOW THESE RULES:\n' + relevantGuidelines
          .map((g: any) => `**${g.title}**\n${g.content}`)
          .join('\n\n')
        console.log('Guidelines applied:', relevantGuidelines.length)
      }
    }
  }

  // Build training memory context from trained AI staff
  let trainingMemoryContext = ''
  if (trainingMemory && Object.keys(trainingMemory).length > 0) {
    const memoryEntries = Object.entries(trainingMemory)
    trainingMemoryContext = '\n\n📝 TRAINING MEMORY - IMPORTANT LESSONS LEARNED:\n' +
      'You are ' + staffName + ' (' + staffRole + '). Apply these lessons from your training:\n\n' +
      memoryEntries.map(([scenario, lessons]) =>
        `Scenario: ${scenario}\nLessons:\n${lessons.map(lesson => `  • ${lesson}`).join('\n')}`
      ).join('\n\n')
    console.log('Training memory applied for:', staffName, '- Scenarios:', memoryEntries.length)
  }

  // Create system prompt with EXTREMELY STRICT anti-hallucination rules
  const systemPrompt = `You are ${staffName}, a ${staffRole} for THIS company ONLY.${knowledgeContext}${trainingContext}${guidelinesContext}${trainingMemoryContext}

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n` : ''}

🚨🚨🚨 ABSOLUTE RULES - VIOLATION WILL CAUSE SEVERE HARM 🚨🚨🚨

${knowledgeContext ? `
YOU MUST FOLLOW THESE RULES OR YOU WILL SEND CUSTOMERS TO COMPETITOR BRANDS:

1. ⛔ BANNED: NEVER mention competitor brands like "The Ordinary", "Paula's Choice", "Neutrogena", "CeraVe", "La Roche-Posay" or ANY brand not in the knowledge base
2. ⛔ BANNED: NEVER recommend products from other companies
3. ⛔ BANNED: NEVER make up product names
4. ⛔ BANNED: NEVER invent prices, features, ingredients, or details
5. ✅ REQUIRED: ONLY mention products/information EXPLICITLY listed in the KNOWLEDGE BASE above
6. ✅ REQUIRED: When customers ask "what products do you have?", "any more products?", "show me products", etc. → LIST products from the knowledge base!
7. ✅ REQUIRED: If asked about a SPECIFIC product NOT in knowledge base, say: "We don't have that specific product yet, but I'll pass your interest along to our team!"
8. ⛔ BANNED: NEVER say "knowledge base", "database", "system" to customers
9. ✅ REQUIRED: Speak as "we", "our", "us" - you ARE this company

IMPORTANT CLARIFICATION:
- General questions like "what products?", "any more?", "show me what you have" = LIST our products from knowledge base
- Specific questions like "do you have Product X?" where X is NOT in knowledge base = "We don't currently offer that"
- DO NOT say "we don't offer that" when customer asks to see what products exist!

IF ASKED ABOUT SOMETHING SPECIFIC NOT IN KNOWLEDGE BASE:
- Say: "We don't currently offer that, but I appreciate your feedback and will share your interest with our team!"
- DO NOT recommend competitor products
- DO NOT make up product names from your training data` : `1. Provide helpful, accurate information
2. Be professional and friendly
3. If you're unsure, say "Let me check on that for you"`}

Keep responses clear and professional (2-4 sentences).`

  try {
    // Get dynamic LLM configuration
    const llmConfig = getLLMConfig()

    let aiResponse = ""

    // Route to appropriate AI provider
    if (llmConfig.provider === 'openai') {
      // OpenAI API
      const openai = getOpenAIClient()

      // GPT-5 models have different parameter requirements
      const isGPT5 = llmConfig.model?.startsWith('gpt-5')

      // GPT-5 uses max_completion_tokens instead of max_tokens
      // Increased from 1024 to 4096 for longer responses
      const tokenParam = isGPT5
        ? { max_completion_tokens: 4096 }
        : { max_tokens: 4096 }

      // GPT-5 only supports temperature=1 (default), custom values not allowed
      const temperatureParam = isGPT5
        ? {} // Don't set temperature for GPT-5, use default (1)
        : { temperature: llmConfig.temperature ?? 0.7 }

      // Build proper message array with conversation history
      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ]

      // Add conversation history as proper messages
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: `${message}

${knowledgeContext ? `
🚨 REMINDER: ONLY mention products/information EXPLICITLY LISTED in the knowledge base above. DO NOT mention competitor brands or make up information.` : ''}`
      })

      const response = await openai.chat.completions.create({
        model: llmConfig.model || 'gpt-4o',
        ...tokenParam,
        ...temperatureParam,
        messages
      })

      aiResponse = response.choices[0]?.message?.content || "I'm here to help! Could you please provide more details about your question?"

    } else {
      // Anthropic Claude API
      const anthropic = getAnthropicClient()

      // Build proper message array with conversation history
      const claudeMessages: any[] = []

      // Add conversation history as proper messages
      for (const msg of recentHistory) {
        claudeMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }

      // Add current user message
      claudeMessages.push({
        role: 'user',
        content: `${message}

${knowledgeContext ? `
🚨 REMINDER: ONLY mention products/information EXPLICITLY LISTED in the knowledge base above. DO NOT mention competitor brands or make up information.` : ''}`
      })

      const response = await anthropic.messages.create({
        model: llmConfig.model,
        max_tokens: 4096, // Increased from 1024 for longer responses
        temperature: llmConfig.temperature ?? 0.7,
        system: systemPrompt,
        messages: claudeMessages
      })

      aiResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : "I'm here to help! Could you please provide more details about your question?"
    }

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
    model: config.model,
    provider: config.provider,
    endpoints: {
      POST: 'Send a chat message with optional knowledgeBase and trainingData',
    },
    version: '3.0.0'
  })
}
