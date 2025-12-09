import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// POST - Analyze a product page URL and extract field structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the page content
    let pageContent: string
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      pageContent = await response.text()
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: `Could not fetch URL: ${fetchError.message}` },
        { status: 400 }
      )
    }

    // Extract text content (strip HTML but keep structure hints)
    const textContent = extractTextContent(pageContent)

    // Use Gemini to analyze the page and extract product fields
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Analyze this product page content and identify the custom product fields used (not standard fields like title, price, or images).

Page URL: ${url}

Page Content:
${textContent.substring(0, 15000)}

Your task:
1. Identify custom product fields displayed on this page
2. For each field, determine:
   - field_key: snake_case identifier
   - field_label: Human-readable label
   - field_type: One of: text, rich_text, number, boolean, select, multi_select, date, url, image
   - display_section: Where it appears - main (top area), accordion (expandable), tab (tabbed content), sidebar

IMPORTANT:
- DO NOT include standard e-commerce fields: title, description, price, images, SKU, stock
- DO include industry-specific fields like: ingredients, materials, dimensions, specifications, care instructions, certifications, origin, etc.
- Analyze the page structure to understand where fields are displayed

Return ONLY a JSON array of field objects. Example:
[
  {
    "field_key": "ingredients",
    "field_label": "Ingredients",
    "field_type": "rich_text",
    "display_section": "accordion"
  },
  {
    "field_key": "material_composition",
    "field_label": "Material & Composition",
    "field_type": "text",
    "display_section": "tab"
  }
]

Return the JSON array only, no explanation.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse the JSON response
    let fields: any[]
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }
      fields = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse field structure from page' },
        { status: 500 }
      )
    }

    // Validate and clean up fields
    const cleanedFields = fields
      .filter(f => f.field_key && f.field_label)
      .map((f, index) => ({
        field_key: String(f.field_key).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        field_label: String(f.field_label),
        field_type: ['text', 'rich_text', 'number', 'boolean', 'select', 'multi_select', 'date', 'url', 'image'].includes(f.field_type)
          ? f.field_type
          : 'text',
        display_section: ['main', 'accordion', 'tab', 'sidebar'].includes(f.display_section)
          ? f.display_section
          : 'main',
        display_order: index,
        is_required: false,
        is_from_template: false,
      }))

    return NextResponse.json({
      success: true,
      url: url,
      fields: cleanedFields,
      fieldCount: cleanedFields.length
    })
  } catch (error: any) {
    console.error('Error analyzing product page:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze product page' },
      { status: 500 }
    )
  }
}

// Helper to extract readable text from HTML
function extractTextContent(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

  // Convert some tags to markers for structure
  text = text
    .replace(/<h[1-6][^>]*>/gi, '\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<th[^>]*>/gi, ' | ')
    .replace(/<div[^>]*class="[^"]*accordion[^"]*"[^>]*>/gi, '\n[ACCORDION] ')
    .replace(/<div[^>]*class="[^"]*tab[^"]*"[^>]*>/gi, '\n[TAB] ')
    .replace(/<details[^>]*>/gi, '\n[EXPANDABLE] ')
    .replace(/<summary[^>]*>/gi, '[TITLE] ')

  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Clean up whitespace
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  return text
}
