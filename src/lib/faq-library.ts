// FAQ and Canned Message Library - Generic Version

import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
} catch (e) {
  console.log('Supabase not configured, using hardcoded FAQ data')
}

export interface FAQ {
  id: string
  keywords: string[]
  question: string
  answer: string
  category: 'pricing' | 'products' | 'shipping' | 'returns' | 'support' | 'features' | 'general'
  is_active?: boolean
  comments?: string
}

export interface CannedMessage {
  id: string
  scenario: string
  template: string
  variables?: string[]
  category?: string
}

export const faqDatabase: FAQ[] = []

export const cannedMessages: CannedMessage[] = []

export function matchFAQ(userMessage: string): FAQ | null {
  const messageLower = userMessage.toLowerCase()
  for (const faq of faqDatabase) {
    const matchCount = faq.keywords.filter(keyword =>
      messageLower.includes(keyword.toLowerCase())
    ).length
    if (matchCount > 0) return faq
  }
  return null
}

export function getCannedMessage(scenarioId: string): CannedMessage | null {
  return cannedMessages.find(msg => msg.id === scenarioId) || null
}

export function determineResponseType(
  userMessage: string,
  conversationHistory: Array<{role: string, content: string}>
): 'faq' | 'canned' | 'ai' {
  if (conversationHistory.length === 0) return 'canned'
  if (matchFAQ(userMessage)) return 'faq'
  return 'ai'
}
