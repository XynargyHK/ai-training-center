import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Default business unit (skincoach) - used as fallback
const DEFAULT_BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Get business unit ID from slug or UUID, with fallback to default
 */
async function getBusinessUnitId(slugOrId: string | null | undefined): Promise<string> {
  if (!slugOrId) {
    return DEFAULT_BUSINESS_UNIT_ID
  }

  // If it's already a UUID, return it
  if (isValidUUID(slugOrId)) {
    return slugOrId
  }

  // Otherwise, it's a slug - look up the UUID from database
  const { data, error } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', slugOrId)
    .single()

  if (error || !data) {
    console.warn(`⚠️ Business unit '${slugOrId}' not found, using default`)
    return DEFAULT_BUSINESS_UNIT_ID
  }

  return data.id
}

// Helper to extract text from DOCX files
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

// Helper to extract text from Excel files
function extractTextFromExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  let allText = ''

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    allText += `Sheet: ${sheetName}\n${csv}\n\n`
  }

  return allText
}

// Helper to parse CSV/Excel-like content
function parseCSVContent(text: string): string {
  // Just return the text as-is, Gemini can understand it
  return text
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'products' | 'services' | 'policies'
    const businessUnitSlugOrId = formData.get('businessUnitId') as string

    // Convert slug to UUID if needed
    const businessUnitId = await getBusinessUnitId(businessUnitSlugOrId)

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Allow all document types that Gemini can process
    // Gemini supports: PDF, images (PNG, JPG, WEBP, GIF), Word docs, Excel, PowerPoint, text files
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.txt', '.rtf',
      '.xls', '.xlsx', '.csv',
      '.ppt', '.pptx',
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp',
      '.html', '.htm', '.xml', '.json', '.md'
    ]
    const fileName = file.name.toLowerCase()
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext)) ||
                      file.type.includes('pdf') ||
                      file.type.includes('image') ||
                      file.type.includes('word') ||
                      file.type.includes('document') ||
                      file.type.includes('spreadsheet') ||
                      file.type.includes('presentation') ||
                      file.type.includes('text')

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, images, or text files.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const lowerName = file.name.toLowerCase()

    // Use Gemini to extract data
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Determine if we need to extract text first (for unsupported binary formats)
    let extractedText: string | null = null
    let useTextMode = false

    // Handle DOCX files - extract text using mammoth
    if (lowerName.endsWith('.docx')) {
      extractedText = await extractTextFromDocx(buffer)
      useTextMode = true
    }
    // Handle DOC files (older format) - try mammoth, fallback to text
    else if (lowerName.endsWith('.doc')) {
      try {
        extractedText = await extractTextFromDocx(buffer)
        useTextMode = true
      } catch {
        // If mammoth fails, try as plain text
        extractedText = buffer.toString('utf-8')
        useTextMode = true
      }
    }
    // Handle text-based files
    else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') ||
             lowerName.endsWith('.csv') || lowerName.endsWith('.json') ||
             lowerName.endsWith('.xml') || lowerName.endsWith('.html') ||
             lowerName.endsWith('.htm')) {
      extractedText = buffer.toString('utf-8')
      useTextMode = true
    }
    // Handle Excel files using xlsx library
    else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      extractedText = extractTextFromExcel(buffer)
      useTextMode = true
    }
    // Handle PowerPoint files - not directly supported
    else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
      return NextResponse.json(
        { success: false, error: 'PowerPoint files are not directly supported. Please save as PDF and upload again.' },
        { status: 400 }
      )
    }

    let prompt: string

    if (type === 'industry') {
      prompt = `You are analyzing a document that contains industry knowledge, training material, or reference information.
Extract the key knowledge and information from this document and return it as a JSON array of knowledge entries.

Each entry should have these fields:
- topic: A short title/topic for this piece of knowledge (required)
- content: The detailed content/information (required)
- category: Category for this knowledge (e.g., "Training", "Product Info", "Guidelines", "FAQ", etc.)
- tags: Array of relevant keywords/tags

Break down the document into logical sections or topics. Each significant piece of information should be a separate entry.

Example output:
[
  {
    "topic": "Product Benefits Overview",
    "content": "Detailed content about product benefits...",
    "category": "Product Info",
    "tags": ["benefits", "features"]
  },
  {
    "topic": "Usage Instructions",
    "content": "Step by step instructions on how to use...",
    "category": "Training",
    "tags": ["instructions", "how-to"]
  }
]

Extract as much useful knowledge as you can find. Return ONLY valid JSON array, no other text.
If you cannot extract any knowledge, return an empty array: []`
    } else if (type === 'products') {
      prompt = `You are analyzing a document that contains product information (likely skincare boosters or treatments).
Extract ALL products you can find and return them as a JSON array.

IMPORTANT: Analyze each product's benefits and usage areas to determine its category. Use ONLY these categories:
- "Face" - for products with face/facial benefits (anti-wrinkle, facial firming, complexion, etc.)
- "Eye" - for products with eye area benefits (eye puffiness, dark circles, crow's feet, etc.)
- "Hair/Scalp" - for products with hair or scalp benefits (hair growth, shine, scalp health, etc.)
- "Body" - for products with body benefits (cellulite, body firming, slimming, body skin, etc.)

If a product has benefits for MULTIPLE areas, choose the PRIMARY category based on the main benefit.
If a product is clearly a "booster" or "addon", set product_type to "addon", otherwise use "base".

Each product should have these fields:
- name: Product name (required)
- description: A comprehensive description combining the tagline, hero benefit summary, and key benefits. Make it informative and marketing-friendly.
- category: One of "Face", "Eye", "Hair/Scalp", or "Body" based on the product's PRIMARY benefit area
- price: Retail price as a number (use 2ml retail price if available, without currency symbol)
- currency: Currency code - default to USD
- sku: Product SKU, code, or trade name
- tags: Array of relevant keywords from the product's benefits (e.g., ["firming", "anti-aging", "hydrating"])
- product_type: "addon" if it's a booster/add-on product, "base" otherwise
- compare_at_price: Original/compare price if discounted (as number), or null

Example output:
[
  {
    "name": "Lift+ Booster",
    "description": "Instant lift. All-day confidence. Instantly lifts and firms for a visibly smoother, younger-looking complexion. Reduces wrinkles, restores elasticity, and delivers a 12-hour firming effect. Contains DMAE for immediate lifting and long-term results.",
    "category": "Face",
    "price": 10,
    "currency": "USD",
    "sku": "DMAE",
    "tags": ["lifting", "firming", "anti-wrinkle", "instant results"],
    "product_type": "addon",
    "compare_at_price": null
  },
  {
    "name": "Caviar Glow Booster",
    "description": "Revive. Renew. Reawaken. Deeply nourishes with luxurious caviar nutrients. Hydrates and restores dry, damaged hair while improving skin radiance.",
    "category": "Hair/Scalp",
    "price": 10,
    "currency": "USD",
    "sku": "Caviar",
    "tags": ["hair", "nourishing", "shine", "hydrating"],
    "product_type": "addon",
    "compare_at_price": null
  }
]

Extract ALL products from the document. Analyze carefully to determine the correct category for each.
Return ONLY valid JSON array, no other text.
If you cannot find any products, return an empty array: []`
    } else if (type === 'services') {
      prompt = `You are analyzing a document that contains service information.
Extract ALL services you can find and return them as a JSON array.

Each service should have these fields:
- name: Service name (required)
- description: Service description
- category: Service category
- duration: Duration in minutes (as a number)
- price: Price as a number (without currency symbol)
- currency: Currency code (USD, EUR, etc.) - default to USD if not specified
- tags: Array of relevant tags/keywords

Example output:
[
  {
    "name": "Service Name",
    "description": "Service description here",
    "category": "Category",
    "duration": 60,
    "price": 99.99,
    "currency": "USD",
    "tags": ["tag1", "tag2"]
  }
]

Extract as many services as you can find. Return ONLY valid JSON array, no other text.
If you cannot find any services, return an empty array: []`
    } else {
      prompt = `You are analyzing a document that contains business policies.
Extract ALL policies you can find and return them as a JSON array.

Each policy should have these fields:
- title: Policy title (required)
- type: Policy type - must be one of: refund, return, shipping, warranty, privacy, terms, other
- content: Full policy content/text (required)
- effective_date: Effective date if mentioned (YYYY-MM-DD format)

Example output:
[
  {
    "title": "Return Policy",
    "type": "return",
    "content": "Full policy text here...",
    "effective_date": "2024-01-01"
  }
]

Extract as many policies as you can find. Return ONLY valid JSON array, no other text.
If you cannot find any policies, return an empty array: []`
    }

    // Generate content based on whether we're using text mode or binary mode
    let result

    if (useTextMode && extractedText) {
      // For text-based content (DOCX, TXT, CSV, etc.), send as plain text
      const fullPrompt = `Here is the document content:\n\n${extractedText}\n\n${prompt}`
      result = await model.generateContent(fullPrompt)
    } else {
      // For binary files (PDF, images), send as base64
      let mimeType = file.type

      if (lowerName.endsWith('.pdf')) {
        mimeType = 'application/pdf'
      } else if (lowerName.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (lowerName.endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (lowerName.endsWith('.webp')) {
        mimeType = 'image/webp'
      }

      const base64 = buffer.toString('base64')
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        },
        prompt
      ])
    }

    const response = await result.response
    let text = response.text().trim()

    // Clean up JSON response
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()

    let extractedItems: any[]
    try {
      extractedItems = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse AI response:', text.substring(0, 500))
      return NextResponse.json(
        { success: false, error: 'Failed to parse extracted data from document. The AI could not understand the document structure. Try a clearer PDF or a different file format.' },
        { status: 500 }
      )
    }

    if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${type} found in the document` },
        { status: 400 }
      )
    }

    // Add business_unit_id to each item and validate
    const validItems: any[] = []

    for (const item of extractedItems) {
      item.business_unit_id = businessUnitId

      // Validate and normalize data
      if (type === 'products' && item.name) {
        if (item.price && typeof item.price === 'string') {
          item.price = parseFloat(item.price.replace(/[^0-9.-]/g, '')) || null
        }
        if (item.compare_at_price && typeof item.compare_at_price === 'string') {
          item.compare_at_price = parseFloat(item.compare_at_price.replace(/[^0-9.-]/g, '')) || null
        }
        if (!item.currency) item.currency = 'USD'
        if (!item.tags) item.tags = []
        // Validate product_type
        if (!item.product_type || !['base', 'addon'].includes(item.product_type)) {
          item.product_type = 'base'
        }
        validItems.push(item)
      } else if (type === 'services' && item.name) {
        if (item.price && typeof item.price === 'string') {
          item.price = parseFloat(item.price.replace(/[^0-9.-]/g, '')) || null
        }
        if (item.duration && typeof item.duration === 'string') {
          item.duration = parseInt(item.duration.replace(/[^0-9]/g, '')) || null
        }
        if (!item.currency) item.currency = 'USD'
        if (!item.tags) item.tags = []
        validItems.push(item)
      } else if (type === 'policies' && item.title && item.content) {
        // Validate policy type
        const validTypes = ['refund', 'return', 'shipping', 'warranty', 'privacy', 'terms', 'other']
        if (!item.type || !validTypes.includes(item.type)) {
          item.type = 'other'
        }
        validItems.push(item)
      } else if (type === 'industry' && item.topic && item.content) {
        // Industry knowledge entries
        if (!item.category) item.category = 'General'
        if (!item.tags) item.tags = []
        validItems.push(item)
      }
    }

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: `No valid ${type} could be extracted from the document` },
        { status: 400 }
      )
    }

    // Insert into database
    const tableName = type === 'products' ? 'kb_products' :
                      type === 'services' ? 'kb_services' :
                      type === 'industry' ? 'knowledge' : 'kb_policies'

    const { error } = await supabase
      .from(tableName)
      .insert(validItems)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: validItems.length,
      message: `Successfully extracted ${validItems.length} ${type}`
    })

  } catch (error: any) {
    console.error('Document upload error:', error)
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to process document'

    // Check for common Gemini API errors
    if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      errorMessage = 'The document was blocked by content safety filters. Try a different file.'
    } else if (errorMessage.includes('too large') || errorMessage.includes('size')) {
      errorMessage = 'The file is too large. Please try a smaller PDF (under 20MB).'
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      errorMessage = 'API rate limit reached. Please wait a moment and try again.'
    } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
      errorMessage = 'The PDF format could not be read. Try saving as a new PDF or converting to a different format.'
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
