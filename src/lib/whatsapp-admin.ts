/**
 * WHATSAPP ADMIN MODE
 *
 * Owner-only command handler. When a message arrives from the owner's phone,
 * we flip Sarah into "General Manager" mode: she can inspect conversations,
 * add guardrails, add knowledge entries, and run simple reports.
 *
 * Demo-only owner detection (env var). Add PIN/Supabase auth later.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Owner detection ────────────────────────────────────────────────
export function isOwnerSender(senderChatId: string): boolean {
  const ownerPhone = (process.env.WHATSAPP_OWNER_PHONE || '').replace(/\D/g, '')
  if (!ownerPhone) return false
  const senderDigits = senderChatId.replace(/\D/g, '')
  // Match by suffix so country-code variants all resolve (e.g. 85294740952 vs 94740952)
  return senderDigits.endsWith(ownerPhone) || ownerPhone.endsWith(senderDigits)
}

// ─── Admin tool definitions (Gemini function calling) ───────────────
const adminTools = [
  {
    functionDeclarations: [
      {
        name: 'list_recent_conversations',
        description: 'List the most recent customer conversations for the current business unit. Shows last message, sender name, and timestamp per unique customer.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limit: { type: SchemaType.NUMBER, description: 'Number of conversations to return (default 10, max 30)' },
          },
        },
      },
      {
        name: 'show_conversation',
        description: 'Show the full message transcript between the AI and a specific customer. Use phone suffix or partial match.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            phone: { type: SchemaType.STRING, description: 'Customer phone number or suffix (e.g. 1234 for matching 85291231234)' },
            limit: { type: SchemaType.NUMBER, description: 'Max messages to show (default 20)' },
          },
          required: ['phone'],
        },
      },
      {
        name: 'add_guardrail',
        description: 'Add a new guardrail / rule to the AI system prompt. Use this when you want the AI to behave differently in future conversations (e.g. never promise same-day delivery, always greet customers by name).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: 'Short title for the rule (e.g. "Delivery promises")' },
            content: { type: SchemaType.STRING, description: 'The rule itself, written as an instruction to the AI' },
            category: { type: SchemaType.STRING, description: 'Category like "tone", "policy", "sales" (optional)' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'add_knowledge',
        description: 'Add a knowledge entry (product info, policy, FAQ, service details) that the AI can cite when answering customers.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: { type: SchemaType.STRING, description: 'Short topic (e.g. "Return policy", "Deep tissue massage price")' },
            content: { type: SchemaType.STRING, description: 'The actual information content' },
            category: { type: SchemaType.STRING, description: 'Category like "policy", "product", "service" (optional)' },
          },
          required: ['topic', 'content'],
        },
      },
      {
        name: 'help',
        description: 'Show the list of available admin commands to the owner.',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
    ],
  },
]

// ─── Tool implementations ────────────────────────────────────────────
async function listRecentConversations(businessUnitId: string, limit: number): Promise<string> {
  const cap = Math.min(Math.max(limit || 10, 1), 30)
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('wa_chat_id, role, content, metadata, created_at')
    .eq('business_unit_id', businessUnitId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return `Error: ${error.message}`
  if (!data || data.length === 0) return 'No conversations yet.'

  // Group by wa_chat_id, keep most recent
  const seen = new Set<string>()
  const rows: { chatId: string; name: string; lastRole: string; lastContent: string; when: string }[] = []
  for (const msg of data) {
    if (seen.has(msg.wa_chat_id)) continue
    seen.add(msg.wa_chat_id)
    const phone = msg.wa_chat_id.replace(/@.*/, '')
    const name = msg.metadata?.pushName || phone
    rows.push({
      chatId: phone,
      name,
      lastRole: msg.role,
      lastContent: (msg.content || '').substring(0, 60),
      when: new Date(msg.created_at).toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' }),
    })
    if (rows.length >= cap) break
  }

  return rows.map((r, i) =>
    `${i + 1}. ${r.name} (${r.chatId})\n   [${r.lastRole}] ${r.lastContent}\n   ${r.when}`
  ).join('\n\n')
}

async function showConversation(businessUnitId: string, phoneSuffix: string, limit: number): Promise<string> {
  const cap = Math.min(Math.max(limit || 20, 1), 50)
  const digits = phoneSuffix.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('wa_chat_id, role, content, created_at')
    .eq('business_unit_id', businessUnitId)
    .like('wa_chat_id', `%${digits}%`)
    .order('created_at', { ascending: false })
    .limit(cap)

  if (error) return `Error: ${error.message}`
  if (!data || data.length === 0) return `No conversation found for ${phoneSuffix}.`

  const rows = data.reverse().map(m => {
    const who = m.role === 'user' ? 'Customer' : m.role === 'assistant' ? 'AI' : 'System'
    const time = new Date(m.created_at).toLocaleTimeString('en-HK', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit' })
    return `[${time}] ${who}: ${m.content}`
  })
  return `Chat with ${data[0].wa_chat_id.replace(/@.*/, '')}:\n\n${rows.join('\n')}`
}

async function addGuardrail(businessUnitId: string, title: string, content: string, category?: string): Promise<string> {
  const { error } = await supabase.from('guidelines').insert({
    business_unit_id: businessUnitId,
    original_id: crypto.randomUUID(),
    reference_id: crypto.randomUUID(),
    category: category || 'owner-rule',
    title,
    content,
    language: 'en',
  })
  if (error) return `Failed to add guardrail: ${error.message}`
  return `Guardrail added. AI will follow this rule from now on:\n"${title}" — ${content}`
}

async function addKnowledge(businessUnitId: string, topic: string, content: string, category?: string): Promise<string> {
  const { error } = await supabase.from('knowledge_base').insert({
    business_unit_id: businessUnitId,
    topic,
    content,
    category: category || 'owner-added',
  })
  if (error) return `Failed to add knowledge: ${error.message}`
  return `Knowledge added. AI can now cite:\n"${topic}" — ${content}`
}

function helpText(): string {
  return `Admin Commands (just type naturally):

• "show recent chats" — list customer conversations
• "show chat with 1234" — full transcript
• "add rule: never promise same-day delivery" — add AI guardrail
• "add knowledge: return policy is 30 days" — add to knowledge base
• "help" — this menu

More coming: reports, shop management, broadcasts.`
}

// ─── Main entry ──────────────────────────────────────────────────────
export async function handleOwnerCommand(
  text: string,
  businessUnitId: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) return 'Admin mode error: GOOGLE_GEMINI_API_KEY not configured.'

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: adminTools as any,
    systemInstruction: `You are the AI General Manager for the business owner. The owner will send you natural-language commands in English or Cantonese. Parse their intent and call the appropriate tool. Always call exactly one tool. If no tool fits, call "help". Respond only with tool calls, no prose.`,
  })

  try {
    const result = await model.generateContent(text)
    const call = result.response.functionCalls()?.[0]

    if (!call) {
      return helpText()
    }

    const args: any = call.args || {}
    switch (call.name) {
      case 'list_recent_conversations':
        return await listRecentConversations(businessUnitId, args.limit || 10)
      case 'show_conversation':
        return await showConversation(businessUnitId, args.phone || '', args.limit || 20)
      case 'add_guardrail':
        return await addGuardrail(businessUnitId, args.title, args.content, args.category)
      case 'add_knowledge':
        return await addKnowledge(businessUnitId, args.topic, args.content, args.category)
      case 'help':
        return helpText()
      default:
        return helpText()
    }
  } catch (err: any) {
    console.error('Admin handler error:', err)
    return `Admin error: ${err.message}\n\n${helpText()}`
  }
}
