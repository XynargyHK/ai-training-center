/**
 * Conversation Analyzer
 * Uses AI to analyze chat conversations and extract:
 * - Keywords (3-5 topic/sentiment tags)
 * - Flag level (none, warning, alert)
 * - Flag reason (if flagged)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

interface ChatMessage {
  message_type: 'user' | 'ai'
  content: string
  created_at: string
}

interface AnalysisResult {
  keywords: string[]
  flag_level: 'none' | 'warning' | 'alert'
  flag_reason: string | null
}

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Analyze a conversation and extract keywords + flag level
 */
export async function analyzeConversation(messages: ChatMessage[]): Promise<AnalysisResult> {
  if (!messages || messages.length === 0) {
    return { keywords: [], flag_level: 'none', flag_reason: null }
  }

  // Format conversation for analysis
  const conversationText = messages
    .map(msg => `${msg.message_type === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
    .join('\n')

  const prompt = `Analyze this customer service conversation and provide:

1. KEYWORDS: Extract 3-5 keywords/tags that describe the main topics and sentiment. Include:
   - Topic tags (e.g., order, shipping, refund, product, price, delivery)
   - Sentiment tags if notable (e.g., angry, frustrated, happy, confused)
   - Action tags if applicable (e.g., complaint, inquiry, purchase, cancel)

2. FLAG_LEVEL: Determine if this conversation needs attention:
   - "alert" = Any mention of refund, return, cancel order, complaint, angry, threatening, or very negative
   - "warning" = Mild frustration, unresolved issue, concern, confusion, product problem, delivery issue
   - "none" = Normal conversation, happy customer, general product inquiry
   IMPORTANT: If the customer mentions "refund", "return", or "cancel" in ANY context, flag_level MUST be "alert".

3. FLAG_REASON: If flag_level is not "none", briefly explain why (e.g., "Customer demands refund", "Unresolved shipping complaint")

CONVERSATION:
${conversationText}

Respond in this exact JSON format only, no other text:
{"keywords": ["tag1", "tag2", "tag3"], "flag_level": "none|warning|alert", "flag_reason": "reason or null"}
`

  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    })

    const responseText = result.response.text().trim()
    console.log('🔍 Gemini raw response:', responseText)

    // Extract JSON: find first { and last } in the response
    const start = responseText.indexOf('{')
    const end = responseText.lastIndexOf('}')
    if (start === -1 || end === -1) {
      console.error('No JSON found in Gemini response:', responseText)
      return { keywords: [], flag_level: 'none', flag_reason: null }
    }
    const jsonText = responseText.slice(start, end + 1)
    console.log('🔍 Extracted JSON:', jsonText)
    const analysis = JSON.parse(jsonText)

    return {
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5) : [],
      flag_level: ['none', 'warning', 'alert'].includes(analysis.flag_level) ? analysis.flag_level : 'none',
      flag_reason: analysis.flag_level !== 'none' ? (analysis.flag_reason || null) : null
    }
  } catch (error) {
    console.error('Conversation analysis failed:', error)
    // Return default on error - don't block the flow
    return { keywords: [], flag_level: 'none', flag_reason: null }
  }
}

/**
 * Analyze and update a chat session in the database
 */
export async function analyzeAndUpdateSession(
  sessionId: string,
  messages: ChatMessage[],
  supabase: any
): Promise<AnalysisResult> {
  const analysis = await analyzeConversation(messages)

  // Update the session with analysis results
  const { error } = await supabase
    .from('chat_sessions')
    .update({
      keywords: analysis.keywords,
      flag_level: analysis.flag_level,
      flag_reason: analysis.flag_reason,
      analyzed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to update session with analysis:', error)
  }

  return analysis
}
