/**
 * Shared AI Prompt Builder
 *
 * Single source of truth for prompt construction used by both:
 * - /api/ai/chat (livechat)
 * - /api/ai/coach-training (roleplay training)
 *
 * Core prompt (identity, knowledge, guidelines, memory, history) is identical.
 * Optional add-ons are feature-specific.
 */

export interface KnowledgeEntry {
  id: string
  category: string
  content: string
  topic?: string
  keywords?: string[]
  confidence?: number
}

export interface Guideline {
  id: string
  category: string
  title: string
  content: string
}

export interface UserProfile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  skin_type?: string
  skin_concerns?: string[]
  preferences?: any
  created_at?: string
}

export interface UserOrder {
  id: string
  display_id?: number
  status: string
  fulfillment_status?: string
  payment_status?: string
  total: number
  subtotal?: number
  currency_code: string
  order_items?: any[]
  created_at: string
  shipping_address?: any
  tracking_number?: string
  shipping_carrier?: string
  estimated_delivery?: string
}

export interface PromptOptions {
  // Core (shared by both livechat and roleplay)
  staffName: string
  staffRole: string
  businessUnitName?: string // Brand identity
  knowledgeBase: KnowledgeEntry[]
  guidelines: Guideline[]
  trainingMemory: { [key: string]: string[] }
  conversationHistory: string // pre-formatted conversation text
  relevantImages?: { url: string, description: string, name: string }[] // Images from library

  // Optional add-ons
  language?: string
  image?: string | null
  userName?: string | null

  // User data (for logged-in customers)
  userProfile?: UserProfile | null
  userOrders?: UserOrder[] | null

  // Roleplay-specific
  scenario?: {
    name: string
    description: string
    customerType: string
    successCriteria?: string[]
  }
  feedbackMemory?: string[] // already-resolved relevant memory items

  // Feedback revision
  revision?: {
    previousResponse: string
    feedbackMessage: string
    customerQuestion: string
    needsShorter: boolean
    needsLonger: boolean
  }
}

// ─── Knowledge Base Context ──────────────────────────────────────────
function buildKnowledgeContext(knowledgeBase: KnowledgeEntry[]): string {
  if (knowledgeBase.length === 0) return ''

  return (
    '\n\n📚 KNOWLEDGE BASE - CRITICAL: ONLY USE INFORMATION FROM THIS LIST:\n' +
    knowledgeBase
      .map(
        (entry) =>
          `- ${entry.category ? `[${entry.category}] ` : ''}${entry.topic ? `${entry.topic}: ` : ''}${entry.content}`
      )
      .join('\n') +
    '\n\n⚠️ DO NOT mention any products, prices, or information that are NOT listed above.'
  )
}

// ─── Visual Assets Context ───────────────────────────────────────────
function buildImagesContext(images?: { url: string, description: string, name: string }[]): string {
  if (!images || images.length === 0) return ''

  return (
    '\n\n🖼️ VISUAL ASSETS (IMAGE LIBRARY):\n' +
    'You have access to these specific images. If the customer asks about them, or if showing them would be helpful, you can embed them in your response using markdown: ![alt text](url)\n\n' +
    images.map(img => `- Image Name: ${img.name}\n  URL: ${img.url}\n  Description: ${img.description}`).join('\n\n')
  )
}

// ─── Anti-Hallucination Rules ────────────────────────────────────────
function buildAntiHallucinationRules(hasKnowledge: boolean): string {
  if (!hasKnowledge) {
    return `You represent THIS company. While we are currently updating our digital knowledge base:
1. Provide helpful, accurate information based on your general expertise in this industry.
2. Be professional, warm, and friendly.
3. If you're asked about a specific price or technical detail you're unsure of, say "Let me check the latest details on that for you."
4. Always speak as "we", "our", and "us".`
  }

  return `YOU MUST FOLLOW THESE RULES OR YOU WILL SEND CUSTOMERS TO COMPETITOR BRANDS:

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
- DO NOT make up product names from your training data`
}

// ─── Guidelines Context ──────────────────────────────────────────────
function buildGuidelinesContext(guidelines: Guideline[]): string {
  if (guidelines.length === 0) return ''

  return (
    '\n\n📋 TRAINING GUIDELINES - FOLLOW THESE RULES:\n' +
    guidelines.map((g) => `**${g.title}**\n${g.content}`).join('\n\n')
  )
}

// ─── Training Memory Context ─────────────────────────────────────────
function buildTrainingMemoryContext(
  trainingMemory: { [key: string]: string[] },
  staffName: string,
  staffRole: string
): string {
  if (!trainingMemory || Object.keys(trainingMemory).length === 0) return ''

  const memoryEntries = Object.entries(trainingMemory)
  return (
    '\n\n🚨 MANDATORY CORRECTIONS FROM YOUR TRAINER - YOU MUST FOLLOW THESE RULES:\n' +
    `You are ${staffName} (${staffRole}). Your trainer has corrected your previous mistakes. You MUST apply these specific lessons to EVERY response:\n\n` +
    memoryEntries
      .map(
        ([scenario, lessons]) =>
          `Target Area: ${scenario}\nRules to Follow:\n${lessons.map((lesson) => `  • REQUIRED: ${lesson}`).join('\n')}`
      )
      .join('\n\n')
  )
}

// ─── Language Instruction ────────────────────────────────────────────
const LANGUAGE_NAMES: { [key: string]: string } = {
  en: 'English',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  cn: 'Simplified Chinese',
  tw: 'Traditional Chinese',
  vi: 'Vietnamese',
}

function buildLanguageInstruction(language?: string): string {
  if (!language || language === 'en') return ''
  const langName = LANGUAGE_NAMES[language] || language
  return `\n\n🌍 LANGUAGE REQUIREMENT: You MUST respond ONLY in ${langName}. The user may write in any language, but your responses must be in ${langName}.\n`
}

// ─── Vision Instruction ──────────────────────────────────────────────
function buildVisionInstruction(image?: string | null): string {
  if (!image) return ''
  return `\n\n📷 IMAGE ANALYSIS: The user has provided an image. Carefully analyze the image content and incorporate your observations into your response. Describe what you see, read any text in the image, and provide relevant insights based on the visual information.\n`
}

// ─── Greeting Instruction ────────────────────────────────────────────
function buildGreetingInstruction(userName?: string | null): string {
  if (!userName) return ''
  return `\n\n👋 PERSONALIZED GREETING: The user's name is ${userName}. If this is the first message in the conversation (no conversation history), start your response with a warm, personalized greeting using their name (e.g., "Hi ${userName}!" or "Hello ${userName}, nice to meet you!"). For subsequent messages, you can occasionally use their name naturally in conversation.\n`
}

// ─── User Profile & Orders Context ──────────────────────────────────
function buildUserContext(userProfile?: UserProfile | null, userOrders?: UserOrder[] | null): string {
  const parts: string[] = []

  if (userProfile) {
    parts.push('\n\n👤 CUSTOMER PROFILE - YOU HAVE ACCESS TO THIS CUSTOMER\'S ACCOUNT:')
    parts.push(`Name: ${userProfile.full_name || 'Not provided'}`)
    if (userProfile.email) parts.push(`Email: ${userProfile.email}`)
    if (userProfile.phone) parts.push(`Phone: ${userProfile.phone}`)
    if (userProfile.skin_type) parts.push(`Skin Type: ${userProfile.skin_type}`)
    if (userProfile.skin_concerns && userProfile.skin_concerns.length > 0) {
      parts.push(`Skin Concerns: ${userProfile.skin_concerns.join(', ')}`)
    }
    if (userProfile.created_at) {
      const memberSince = new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      parts.push(`Member Since: ${memberSince}`)
    }
  }

  if (userOrders && userOrders.length > 0) {
    parts.push('\n\n📦 ORDER HISTORY - THIS CUSTOMER\'S ORDERS:')
    parts.push(`Total Orders: ${userOrders.length}`)
    parts.push('')

    // Show recent orders (up to 5)
    const recentOrders = userOrders.slice(0, 5)
    recentOrders.forEach((order, index) => {
      const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      parts.push(`Order ${index + 1}: #${order.display_id || order.id.slice(0, 8)}`)
      parts.push(`  - Date: ${orderDate}`)
      parts.push(`  - Status: ${order.status}${order.fulfillment_status ? ` (Fulfillment: ${order.fulfillment_status})` : ''}`)
      parts.push(`  - Total: ${order.currency_code} ${(order.total / 100).toFixed(2)}`)
      if (order.tracking_number) {
        parts.push(`  - Tracking: ${order.tracking_number}${order.shipping_carrier ? ` (${order.shipping_carrier})` : ''}`)
      }
      if (order.estimated_delivery) {
        parts.push(`  - Estimated Delivery: ${order.estimated_delivery}`)
      }
      if (order.order_items && order.order_items.length > 0) {
        const itemNames = order.order_items.map((item: any) => `${item.title} x${item.quantity}`).join(', ')
        parts.push(`  - Items: ${itemNames}`)
      }
      parts.push('')
    })

    if (userOrders.length > 5) {
      parts.push(`... and ${userOrders.length - 5} more orders`)
    }

    parts.push('\n⚠️ CUSTOMER SERVICE INSTRUCTIONS FOR ORDERS:')
    parts.push('- When customer asks about their order, check the order history above')
    parts.push('- Provide accurate status, tracking, and order details')
    parts.push('- If order is delayed or has issues, be empathetic and offer help')
    parts.push('- Never guess order information - only use what is shown above')
  }

  if (parts.length === 0) return ''

  return parts.join('\n')
}

// ─── Scenario Context (roleplay only) ────────────────────────────────
function buildScenarioContext(opts: PromptOptions): string {
  if (!opts.scenario) return ''

  const { scenario, feedbackMemory } = opts

  let text = `\nTRAINING SCENARIO: ${scenario.name}
DESCRIPTION: ${scenario.description}
CUSTOMER TYPE: ${scenario.customerType}

SUCCESS CRITERIA TO ACHIEVE:
${scenario.successCriteria && scenario.successCriteria.length > 0 ? scenario.successCriteria.map((c) => `- ${c}`).join('\n') : '- Complete the training scenario successfully'}`

  if (feedbackMemory && feedbackMemory.length > 0) {
    text += `

🚨🚨🚨 CRITICAL TRAINING FEEDBACK - YOU MADE THESE MISTAKES BEFORE - DO NOT REPEAT THEM! 🚨🚨🚨

The trainer has provided the following corrections to your PREVIOUS RESPONSES. You MUST fix these issues NOW:

${feedbackMemory.map((fb, i) => `${i + 1}. CORRECTION REQUIRED: ${fb}`).join('\n')}

⚠️ MANDATORY: You will be RE-EVALUATED on whether you fixed these issues. If you repeat the same mistakes, you FAIL.
⚠️ READ each correction above carefully and APPLY IT to your response.
⚠️ If feedback says "don't mention XR5000", then NEVER mention XR5000 or similar made-up products EVER AGAIN.
⚠️ If feedback says you're hallucinating, STOP making things up and use ONLY the knowledge base.

These corrections OVERRIDE everything else. Fix them NOW!`
  }

  text += `

CONVERSATION MANAGEMENT:
- READ THE ENTIRE CONVERSATION HISTORY to understand the context and emotional state
- PAY ATTENTION to how the customer's emotions are evolving (frustration, escalation, etc.)
- ADAPT your response based on the conversation flow - DO NOT repeat previous responses
- If the customer is getting more frustrated, acknowledge their escalating concerns and adjust your approach
- Focus on achieving the scenario success criteria listed above
- Adapt your approach to the customer's personality (${scenario.customerType})
- Be helpful, professional, and solution-oriented
- NEVER give the same or similar response twice - each response must progress the conversation

RESPONSE GUIDELINES:
- Use ONLY information from the knowledge base below
- If asked about specific products not in the knowledge base, offer to connect them with a specialist or check availability
- Focus on understanding customer needs and providing helpful guidance within your knowledge
- Be honest about limitations - it's better to admit you don't know than to make up information`

  return text
}

// ─── Revision Context (feedback re-generation) ───────────────────────
function buildRevisionContext(opts: PromptOptions): string {
  if (!opts.revision) return ''
  const { revision, scenario } = opts

  let text = `You are ${opts.staffName} receiving training feedback. You must REVISE your previous response based on the trainer's specific feedback.

TRAINING CONTEXT:
Scenario: ${scenario?.name || 'General'}
Customer Type: ${scenario?.customerType || 'General'}

CUSTOMER'S QUESTION:
"${revision.customerQuestion}"

YOUR PREVIOUS RESPONSE (THAT NEEDS REVISION):
"${revision.previousResponse}"

🚨 TRAINER'S FEEDBACK ON YOUR RESPONSE:
"${revision.feedbackMessage}"`

  if (revision.needsShorter) {
    text += `\n\n⚠️ CRITICAL: The trainer wants a SHORTER response! Your previous response was ${revision.previousResponse.split(' ').length} words.
Make your revised response SIGNIFICANTLY shorter (aim for 30-50 words MAX). Be concise and direct!`
  }
  if (revision.needsLonger) {
    text += `\n\n⚠️ CRITICAL: The trainer wants MORE DETAIL! Your previous response was too brief.
Expand your revised response with more explanation, examples, and helpful details.`
  }

  text += `

REVISION INSTRUCTIONS:
1. Read the trainer's feedback carefully
2. Identify what was wrong or missing in your previous response
3. Write a COMPLETELY NEW response that:
   - Directly addresses the trainer's feedback
   ${revision.needsShorter ? '   - Is MUCH SHORTER than your previous response (cut it by at least 50%)' : ''}
   ${revision.needsLonger ? '   - Is MORE DETAILED than your previous response (at least 2x longer)' : ''}
   - Fixes the specific issues mentioned
   - Maintains your professional, warm tone
   - Provides better, more helpful guidance to the customer
4. DO NOT just repeat your previous response
5. DO NOT ignore the trainer's feedback
6. SHOW that you learned from the feedback by making substantial improvements

Now provide your REVISED response to the customer's question above:`

  return text
}

// ═════════════════════════════════════════════════════════════════════
// Main entry point
// ═════════════════════════════════════════════════════════════════════

export function buildAIPrompt(opts: PromptOptions): string {
  const knowledgeContext = buildKnowledgeContext(opts.knowledgeBase)
  const hasKnowledge = opts.knowledgeBase.length > 0

  // For revision requests, use the revision-specific prompt structure
  if (opts.revision) {
    const revisionBase = buildRevisionContext(opts)
    return `${revisionBase}${knowledgeContext}${buildGuidelinesContext(opts.guidelines)}${buildTrainingMemoryContext(opts.trainingMemory, opts.staffName, opts.staffRole)}`
  }

  // Build the unified system prompt
  const parts: string[] = []

  // 1. Staff identity
  parts.push(`You are ${opts.staffName}, a ${opts.staffRole} for ${opts.businessUnitName || 'this company'} ONLY.`)


  // 2. Knowledge base + anti-hallucination rules
  parts.push(knowledgeContext)

  // 2b. Visual Assets (Image Library)
  if (opts.relevantImages && opts.relevantImages.length > 0) {
    parts.push(buildImagesContext(opts.relevantImages))
  }

  // 3. Guidelines
  parts.push(buildGuidelinesContext(opts.guidelines))

  // 4. Training memory
  parts.push(buildTrainingMemoryContext(opts.trainingMemory, opts.staffName, opts.staffRole))

  // 5. Optional add-ons
  parts.push(buildLanguageInstruction(opts.language))
  parts.push(buildVisionInstruction(opts.image))
  parts.push(buildGreetingInstruction(opts.userName))

  // 5b. User profile & orders context (for logged-in customers)
  parts.push(buildUserContext(opts.userProfile, opts.userOrders))

  // 6. Conversation history
  if (opts.conversationHistory) {
    parts.push(`\nRECENT CONVERSATION:\n${opts.conversationHistory}\n`)
  }

  // 7. Anti-hallucination enforcement block
  parts.push(`\n🚨🚨🚨 ABSOLUTE RULES - VIOLATION WILL CAUSE SEVERE HARM 🚨🚨🚨\n`)
  parts.push(buildAntiHallucinationRules(hasKnowledge))

  // 8. FINAL MANDATORY ENFORCEMENT (The last thing the AI reads)
  parts.push(`\nSTRICT RESPONSE FORMAT:
1. Response length: MUST be under 100 words. Be direct.
2. Mandatory Corrections: Apply ALL "MANDATORY CORRECTIONS FROM YOUR TRAINER" listed above.
3. No AI Disclosure: Never mention you are an AI or a language model.`)

  return parts.filter(Boolean).join('\n')
}

/**
 * Build the user-message reminder appended to each customer message.
 * Used by both livechat and roleplay to reinforce anti-hallucination at inference time.
 */
export function buildUserReminder(hasKnowledge: boolean): string {
  if (!hasKnowledge) return ''
  return `\n\n🚨 REMINDER: ONLY mention products/information EXPLICITLY LISTED in the knowledge base above. DO NOT mention competitor brands or make up information.`
}
