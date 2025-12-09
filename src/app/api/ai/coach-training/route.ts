import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Google Gemini client - ONLY Gemini, no fallbacks
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

interface KnowledgeEntry {
  id: string
  category: string
  content: string
  keywords?: string[]
  topic?: string
}

interface CoachTrainingRequest {
  prompt: string
  customerMessage: string
  conversationHistory: Array<{
    sender: 'user' | 'customer'
    message: string
    timestamp: string
  }>
  customerPersona: string
  scenario: string
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
      prompt,
      customerMessage,
      conversationHistory,
      customerPersona,
      scenario,
      knowledgeBase = [],
      guidelines = []
    }: CoachTrainingRequest = await request.json()

    // Debug logging
    console.log('=== COACH TRAINING API DEBUG ===')
    console.log('Knowledge Base Entries:', knowledgeBase?.length || 0)
    console.log('Guidelines:', guidelines?.length || 0)
    if (knowledgeBase && knowledgeBase.length > 0) {
      console.log('First 3 KB entries:', knowledgeBase.slice(0, 3).map(k => ({ category: k.category, topic: k.topic, contentLength: k.content?.length })))
    }

    if (!prompt || !customerMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for Google API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Build knowledge base context
    let knowledgeContext = ''
    if (knowledgeBase && knowledgeBase.length > 0) {
      // Filter relevant knowledge based on customer message keywords
      const messageLower = customerMessage.toLowerCase()
      const relevantKnowledge = knowledgeBase
        .filter(entry => {
          if (!entry.content) return false
          const contentLower = entry.content.toLowerCase()
          const categoryLower = entry.category?.toLowerCase() || ''
          const topicLower = entry.topic?.toLowerCase() || ''

          // Smart keyword matching - check topic, category, content, and keywords
          const messageWords = messageLower.split(' ').filter(w => w.length > 2)

          // Check if any significant word from the message appears in topic, category, or content
          return messageWords.some(word =>
            topicLower.includes(word) ||
            categoryLower.includes(word) ||
            contentLower.includes(word)
          ) ||
          (entry.keywords && entry.keywords.some(keyword => messageLower.includes(keyword.toLowerCase())))
        })
        // Use ALL relevant matches - no artificial caps

      if (relevantKnowledge.length > 0) {
        console.log('✅ Filtered relevant knowledge:', relevantKnowledge.length, 'entries')
        console.log('Topics:', relevantKnowledge.map(k => k.topic || 'untitled'))

        // Use ALL relevant knowledge - no artificial limits
        // Filtering logic remains for semantic relevance, but no caps on entry count
        knowledgeContext = '\n\n📚 KNOWLEDGE BASE - THIS IS YOUR COMPLETE AND ONLY SOURCE OF TRUTH:\n' +
          relevantKnowledge
            .map(entry => `- ${entry.category ? `[${entry.category}] ` : ''}${entry.content}`)
            .join('\n') +
          '\n\n🚨🚨🚨 ABSOLUTE ANTI-HALLUCINATION RULES - VIOLATION = FAILURE 🚨🚨🚨\n' +
          '1. The information above is your COMPLETE knowledge - NOTHING EXISTS beyond this list\n' +
          '2. NEVER EVER mention ANY product name, model number, price, or detail NOT EXPLICITLY LISTED ABOVE\n' +
          '3. If something is not in the list above, IT DOES NOT EXIST - do not make it up\n' +
          '4. DO NOT invent product names like "XR5000" or "Pro Series" or any names not in the list\n' +
          '5. DO NOT make up prices, percentages, ingredients, or specifications\n' +
          '6. If customer asks about something not listed, say: "Let me check with my team on that specific detail"\n' +
          '7. Speak in GENERAL helpful terms if you lack specific details from the knowledge base\n' +
          '8. NEVER say "we don\'t have that in our knowledge base" - this is internal only\n' +
          '9. IT IS BETTER TO SAY "I\'LL VERIFY THAT" THAN TO MAKE UP INFORMATION\n' +
          '10. You will be evaluated - making up ANY information = automatic failure\n\n'
      } else if (knowledgeBase.length > 0) {
        console.log('⚠️ No filtered matches - using ALL knowledge base entries as fallback:', knowledgeBase.length)
        console.log('All topics:', knowledgeBase.map(k => k.topic || 'untitled'))

        // If no relevant match, include ALL general entries - no limits
        knowledgeContext = '\n\n📚 KNOWLEDGE BASE - THIS IS YOUR COMPLETE AND ONLY SOURCE OF TRUTH:\n' +
          knowledgeBase
            .map(entry => `- ${entry.category ? `[${entry.category}] ` : ''}${entry.content}`)
            .join('\n') +
          '\n\n🚨🚨🚨 ABSOLUTE ANTI-HALLUCINATION RULES - VIOLATION = FAILURE 🚨🚨🚨\n' +
          '1. The information above is your COMPLETE knowledge - NOTHING EXISTS beyond this list\n' +
          '2. NEVER EVER mention ANY product name, model number, price, or detail NOT EXPLICITLY LISTED ABOVE\n' +
          '3. If something is not in the list above, IT DOES NOT EXIST - do not make it up\n' +
          '4. DO NOT invent product names like "XR5000" or "Pro Series" or any names not in the list\n' +
          '5. DO NOT make up prices, percentages, ingredients, or specifications\n' +
          '6. If customer asks about something not listed, say: "Let me check with my team on that specific detail"\n' +
          '7. Speak in GENERAL helpful terms if you lack specific details from the knowledge base\n' +
          '8. NEVER say "we don\'t have that in our knowledge base" - this is internal only\n' +
          '9. IT IS BETTER TO SAY "I\'LL VERIFY THAT" THAN TO MAKE UP INFORMATION\n' +
          '10. You will be evaluated - making up ANY information = automatic failure\n\n'
      }
    }

    // Build training guidelines context
    let guidelinesContext = ''
    if (guidelines && guidelines.length > 0) {
      guidelinesContext = '\n\n## TRAINING GUIDELINES - MUST FOLLOW STRICTLY\n\n' +
        'These guidelines OVERRIDE all other instructions and define how you should respond:\n\n' +
        guidelines.map(g => `### ${g.title}\n${g.content}`).join('\n\n') +
        '\n\n⚠️ CRITICAL: You MUST follow ALL training guidelines above. They take priority over everything else.\n'
    }

    // Build conversation context for the AI Coach - USE ALL HISTORY
    const conversationContext = conversationHistory
      .map(msg => `${msg.sender === 'user' ? 'Coach' : 'Customer'}: ${msg.message}`)
      .join('\n')

    // Create system prompt for AI Coach
    const systemPrompt = `${prompt}${knowledgeContext}${guidelinesContext}

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n` : ''}

CUSTOMER'S LATEST MESSAGE: "${customerMessage}"

🚨🚨🚨 ABSOLUTE RULE: IF THERE IS A KNOWLEDGE BASE ABOVE, YOU ARE 100% RESTRICTED TO IT 🚨🚨🚨

${knowledgeContext ? `
═══════════════════════════════════════════════════════════════════
⛔ ZERO TOLERANCE ANTI-HALLUCINATION POLICY ⛔
═══════════════════════════════════════════════════════════════════

YOU ARE BEING EVALUATED. MENTIONING ANY PRODUCT NOT IN THE KNOWLEDGE BASE = INSTANT FAILURE.

❌ FORBIDDEN - YOU WILL FAIL IF YOU DO THIS:
- Mentioning "Vitamin C Booster" - NOT IN KNOWLEDGE BASE
- Mentioning "Retinol Booster" - NOT IN KNOWLEDGE BASE
- Mentioning "XR5000" or ANY model numbers - NOT IN KNOWLEDGE BASE
- Mentioning ANY product name not EXPLICITLY listed in the 📚 KNOWLEDGE BASE section above
- Making up percentages, ingredients, prices, or product features
- Suggesting products that "might" exist or that you "think" we have

✅ REQUIRED - YOU MUST DO THIS:
- ONLY mention products that are WORD-FOR-WORD in the knowledge base above
- If customer asks about a product not listed, say: "Let me check with my team on that specific product"
- Speak in GENERAL terms about the concern without inventing products
- Example: Instead of "try our Vitamin C Booster", say "I'll check what vitamin C options we have for you"

🎯 EXAMPLE OF CORRECT RESPONSE:
Customer: "Do you have vitamin C products?"
WRONG: "Yes! Try our Vitamin C Booster Serum..." ❌ FAIL
RIGHT: "Let me check what vitamin C options we currently have available for you." ✅ PASS

═══════════════════════════════════════════════════════════════════
` : ''}

INSTRUCTIONS FOR YOUR RESPONSE:
- Respond as a professional AI coach/staff member
- You ARE the company - speak as "we", "our", "us", not "the company" or "according to the website"
- WRONG: "According to the website..." or "The company offers..."
- RIGHT: "We offer..." or "Our products..."
- Address the customer's specific message directly
- Work towards achieving the scenario objectives
- Adapt your approach to the customer persona (${customerPersona})
- Maintain a professional yet empathetic tone
- Keep responses clear, helpful, and focused (2-4 sentences)
- Apply any feedback from training memory to improve your response
- Show genuine effort to help and resolve the customer's concerns
${knowledgeContext ? `
- 🚨 FINAL WARNING: You are being TESTED. If you mention even ONE product not in the knowledge base, you FAIL.
- When in doubt, say "Let me verify that for you" instead of making up product names.
- NEVER reveal internal issues like "not in knowledge base" to customers - that's internal only.
` : ''}

Generate a professional coach response.`

    // Get dynamic LLM configuration
    const llmConfig = getLLMConfig()

    const userPrompt = `As a professional AI coach, respond to this ${customerPersona} customer's message: "${customerMessage}"${knowledgeContext ? `

🚨 CRITICAL REMINDER BEFORE YOU RESPOND 🚨
1. READ the knowledge base section above CAREFULLY
2. ONLY mention products that are EXPLICITLY LISTED in the knowledge base
3. DO NOT mention: "Vitamin C Booster", "Retinol Booster", "XR5000", or ANY product not in the list
4. If unsure, say "Let me check on that for you" instead of inventing product names
5. You are being EVALUATED - one hallucinated product = FAILURE

Now respond professionally without making up ANY product names.` : ''}`

    // ONLY use Google Gemini - no fallbacks
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
        temperature: llmConfig.temperature ?? 0.7,
        maxOutputTokens: 2048,
      }
    })

    const response = result.response
    const aiCoachResponse = response.text() || ''

    if (!aiCoachResponse) {
      throw new Error('No response generated from Gemini')
    }

    // Return the AI Coach response
    return NextResponse.json({
      success: true,
      response: aiCoachResponse,
      metadata: {
        model: llmConfig.model || 'gemini-2.5-flash',
        provider: 'google',
        customerPersona: customerPersona,
        scenario: scenario,
        tokens: 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI Coach Training API Error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI Coach response' },
      { status: 500 }
    )
  }
}

// Optional: Add a GET endpoint for testing
export async function GET() {
  const config = getLLMConfig()
  return NextResponse.json({
    message: 'AI Coach Training API is running',
    model: config.model || 'gemini-2.5-flash',
    provider: 'google',
    status: 'ready'
  })
}
