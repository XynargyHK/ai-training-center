import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import crypto from 'crypto'

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
  if (!slugOrId) return DEFAULT_BUSINESS_UNIT_ID
  if (isValidUUID(slugOrId)) return slugOrId

  const { data, error } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', slugOrId)
    .single()

  return error || !data ? DEFAULT_BUSINESS_UNIT_ID : data.id
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

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 Starting PDF Upload API...')
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string 
    const businessUnitSlugOrId = formData.get('businessUnitId') as string
    const businessUnitId = await getBusinessUnitId(businessUnitSlugOrId)

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine extraction mode
    let extractedText: string | null = null
    let useTextMode = false

    if (fileName.endsWith('.docx')) {
      extractedText = await extractTextFromDocx(buffer)
      useTextMode = true
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
      extractedText = buffer.toString('utf-8')
      useTextMode = true
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      extractedText = extractTextFromExcel(buffer)
      useTextMode = true
    }

    // Set up Prompt
    let prompt = ''
    if (type === 'industry') {
      prompt = `Analyze this entire document (text and images). 
Identify the most important topics and provide a comprehensive Markdown summary for each.
If there are diagrams or charts, describe them in the context of the text.

Return your answer as a JSON array of objects:
[{"topic": "Title", "content": "Markdown content...", "category": "Category", "tags": ["tag1"]}]

Return ONLY the valid JSON array.`
    } else if (type === 'products') {
      prompt = `Extract ALL products as JSON array: [{"name": "string", "description": "string", "category": "Face|Eye|Body|Hair", "price": number, "sku": "string"}]`
    } else if (type === 'services') {
      prompt = `Extract ALL services as JSON array: [{"name": "string", "description": "string", "duration": number, "price": number}]`
    } else {
      prompt = `Extract ALL policies as JSON array: [{"title": "string", "type": "string", "content": "string"}]`
    }

    // Call Gemini
    console.log('🧠 Calling Gemini 2.5-flash...')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    let result
    if (useTextMode && extractedText) {
      result = await model.generateContent(`Document content:\n${extractedText}\n\n${prompt}`)
    } else {
      let mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : file.type
      result = await model.generateContent([
        { inlineData: { mimeType, data: buffer.toString('base64') } },
        prompt
      ])
    }

    const responseText = (await result.response).text().trim()
    
    // Robust JSON Parsing
    let parsed: any = null
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
        console.log('✅ JSON parsed successfully')
      }
    } catch (e) {
      console.warn('❌ JSON Parse failed')
    }

    // Process Industry Knowledge (with raw fallback)
    if (type === 'industry') {
      let content = ''
      let title = file.name.replace('.pdf', '')
      let keywords: string[] = []
      
      if (Array.isArray(parsed)) {
        content = parsed.map((item: any) => `## ${item.topic || 'Segment'}\n\n${item.content || ''}`).join('\n\n---\n\n')
        title = parsed[0]?.topic || title
        keywords = parsed[0]?.tags || []
      } else {
        console.log('🔄 Using raw response as fallback content')
        content = responseText
      }

      console.log('💾 Saving to knowledge base...')
      const { saveKnowledge } = await import('@/lib/supabase-storage')
      
      // CRITICAL: Pass a clean object WITHOUT a 'kb-' id to avoid UUID errors
      await saveKnowledge({
        topic: title,
        content: content,
        category: 'Industry Knowledge',
        keywords: keywords,
        confidence: 0.95,
        fileName: file.name,
        filePath: file.name
      }, businessUnitId)

      const duration = (Date.now() - startTime) / 1000
      console.log(`✅ Success! Total duration: ${duration}s`)
      return NextResponse.json({ 
        success: true, 
        count: 1, 
        duration, 
        message: `Successfully processed ${file.name}`,
        skipImageExtraction: true // Signal to UI that Gemini already handled images
      })
    }

    // Process structured data (Products, Services, Policies)
    const items = Array.isArray(parsed) ? parsed : []
    if (items.length === 0) throw new Error('No items extracted from document')

    console.log(`💾 Saving ${items.length} items to ${type}...`)
    const tableName = type === 'products' ? 'kb_products' : type === 'services' ? 'kb_services' : 'kb_policies'
    const { error } = await supabase.from(tableName).insert(items.map(i => ({ ...i, business_unit_id: businessUnitId })))
    if (error) throw error

    const duration = (Date.now() - startTime) / 1000
    return NextResponse.json({ success: true, count: items.length, duration })

  } catch (err: any) {
    const duration = (Date.now() - startTime) / 1000
    console.error('❌ Upload Error:', err)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to process document', 
      duration 
    }, { status: 500 })
  }
}
