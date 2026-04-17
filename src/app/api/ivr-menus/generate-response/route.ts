import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGemini() {
  return new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
}

export async function POST(request: NextRequest) {
  try {
    const { menuPath, businessName, count = 3, mode = 'response', existingOptions = [] } = await request.json()

    const genAI = getGemini()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    let prompt: string

    if (mode === 'suggest_options') {
      prompt = `You are helping a business owner set up their phone/WhatsApp menu.

Business: ${businessName || 'a business'}
Existing menu options already created: ${existingOptions.length > 0 ? existingOptions.join(', ') : 'None yet'}

Suggest ${count} NEW menu options they should add. These should be common things customers ask about for this type of business. Do NOT suggest options that already exist.

Each suggestion should be a short label with an emoji prefix (e.g. "📅 Book appointment", "🛍️ Shop products").

Return ONLY a JSON array of strings. No markdown, no explanation.`
    } else {
      if (!menuPath) {
        return NextResponse.json({ error: 'menuPath required' }, { status: 400 })
      }

      prompt = `You are writing response messages for an automated phone/WhatsApp menu system.

Business: ${businessName || 'a business'}
Menu path the customer navigated: ${menuPath}

Generate ${count} different response options that the system would send when the customer reaches this menu option. Each response should:
- Be concise (1-3 sentences max)
- Sound warm and professional
- Include relevant details (price, duration, features) where appropriate
- Be ready to send as-is to a customer

Return ONLY a JSON array of strings. No markdown, no explanation.
Example: ["Response option 1", "Response option 2", "Response option 3"]`
    }

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    let options: string[] = []
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      options = JSON.parse(cleaned)
    } catch {
      options = [text]
    }

    return NextResponse.json({ success: true, options })
  } catch (error: any) {
    console.error('IVR generate error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
