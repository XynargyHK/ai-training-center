/**
 * IVR Renderer — converts ivr_menus tree into WhatsApp text or Twilio TwiML.
 * Shared logic for both channels reading from the same DB table.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface IvrNode {
  id: string
  business_unit_id: string
  parent_id: string | null
  sort_order: number
  label: string
  description?: string
  action: string
  payload: any
  active: boolean
}

const DIGIT_EMOJI = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

export async function loadIvrTree(businessUnitId: string): Promise<IvrNode[]> {
  const { data, error } = await supabase
    .from('ivr_menus')
    .select('*')
    .eq('business_unit_id', businessUnitId)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('IVR load error:', error.message)
    return []
  }
  return data || []
}

export function getRootNode(nodes: IvrNode[]): IvrNode | null {
  return nodes.find(n => n.parent_id === null) || null
}

export function getChildren(nodes: IvrNode[], parentId: string): IvrNode[] {
  return nodes.filter(n => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Render a menu level as WhatsApp text.
 * Returns { text, childNodes } so the webhook can track position.
 */
export function renderWhatsAppMenu(nodes: IvrNode[], parentId: string): { text: string; children: IvrNode[] } {
  const parent = nodes.find(n => n.id === parentId)
  const children = getChildren(nodes, parentId)

  if (children.length === 0) return { text: '', children: [] }

  const greeting = parent?.payload?.greeting || ''
  const lines = children.map((child, i) => `${DIGIT_EMOJI[i + 1]} ${child.label}`)

  const text = [
    greeting,
    '',
    ...lines,
    '',
    'Type a number or tell me what you need.'
  ].filter(Boolean).join('\n')

  return { text, children }
}

/**
 * Given user's digit input and current menu level, resolve the action.
 * Returns the matched child node, or null if invalid.
 */
export function resolveDigitInput(nodes: IvrNode[], parentId: string, digit: number): IvrNode | null {
  const children = getChildren(nodes, parentId)
  if (digit < 1 || digit > children.length) return null
  return children[digit - 1]
}

/**
 * Render a menu level as Twilio TwiML (XML string).
 * Uses <Gather> for DTMF input + <Say> for TTS.
 */
export function renderTwimlMenu(nodes: IvrNode[], parentId: string, actionUrl: string): string {
  const parent = nodes.find(n => n.id === parentId)
  const children = getChildren(nodes, parentId)

  if (children.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>No menu options available. Goodbye.</Say><Hangup/></Response>`
  }

  const greeting = parent?.payload?.greeting || 'Welcome.'
  const optionsList = children.map((child, i) =>
    `Press ${i + 1} for ${child.label.replace(/[^\w\s]/g, '')}.`
  ).join(' ')

  const sep = actionUrl.includes('?') ? '&' : '?'
  const fullAction = `${actionUrl}${sep}parentId=${parentId}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${fullAction}" method="POST" timeout="10">
    <Say voice="Polly.Joanna">${greeting} ${optionsList}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear a response. Goodbye.</Say>
  <Hangup/>
</Response>`
}
