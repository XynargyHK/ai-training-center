import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as XLSX from 'xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'products' | 'services' | 'policies'
    const businessUnitId = formData.get('businessUnitId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read the Excel/CSV file
    const bytes = await file.arrayBuffer()
    const workbook = XLSX.read(bytes, { type: 'buffer' })

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'File appears to be empty or has no data rows' },
        { status: 400 }
      )
    }

    // Extract headers and data
    const headers = rawData[0] as string[]
    const dataRows = rawData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''))

    // Use Gemini to intelligently map columns
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let targetFields: string[]
    let prompt: string

    if (type === 'products') {
      targetFields = ['name', 'description', 'category', 'price', 'currency', 'sku', 'tags', 'product_type', 'compare_at_price']
      prompt = `You are analyzing a product data spreadsheet. Map these column headers to our database fields.

Column headers from the file: ${JSON.stringify(headers)}

Target database fields:
- name: Product name (required)
- description: Product description
- category: Product category
- price: Product price (numeric)
- currency: Currency code (USD, EUR, etc.)
- sku: Product SKU or code
- tags: Tags or keywords (comma-separated in source)
- product_type: Either "base" (main product) or "addon" (add-on/booster/extra)
- compare_at_price: Original/compare price if discounted (numeric)

Return a JSON object mapping column indices (0-based) to field names.
Example: {"0": "name", "1": "description", "3": "price", "5": "product_type"}

Only map columns that have relevant data. If no good match exists, skip that field.
Return ONLY valid JSON, no explanation.`
    } else if (type === 'services') {
      targetFields = ['name', 'description', 'category', 'duration', 'price', 'currency', 'tags']
      prompt = `You are analyzing a service data spreadsheet. Map these column headers to our database fields.

Column headers from the file: ${JSON.stringify(headers)}

Target database fields:
- name: Service name (required)
- description: Service description
- category: Service category
- duration: Duration in minutes (numeric)
- price: Service price (numeric)
- currency: Currency code (USD, EUR, etc.)
- tags: Tags or keywords (comma-separated in source)

Return a JSON object mapping column indices (0-based) to field names.
Example: {"0": "name", "1": "description", "2": "duration", "4": "price"}

Only map columns that have relevant data. If no good match exists, skip that field.
Return ONLY valid JSON, no explanation.`
    } else {
      targetFields = ['title', 'type', 'content', 'effective_date']
      prompt = `You are analyzing a policy data spreadsheet. Map these column headers to our database fields.

Column headers from the file: ${JSON.stringify(headers)}

Target database fields:
- title: Policy title (required)
- type: Policy type (one of: refund, return, shipping, warranty, privacy, terms, other)
- content: Policy content/text (required)
- effective_date: Effective date (date format)

Return a JSON object mapping column indices (0-based) to field names.
Example: {"0": "title", "1": "type", "2": "content"}

Only map columns that have relevant data. If no good match exists, skip that field.
Return ONLY valid JSON, no explanation.`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    let mappingText = response.text().trim()

    // Clean up JSON response
    if (mappingText.startsWith('```json')) {
      mappingText = mappingText.slice(7)
    } else if (mappingText.startsWith('```')) {
      mappingText = mappingText.slice(3)
    }
    if (mappingText.endsWith('```')) {
      mappingText = mappingText.slice(0, -3)
    }
    mappingText = mappingText.trim()

    const columnMapping = JSON.parse(mappingText)

    // Transform data rows using the mapping
    const transformedItems: any[] = []

    for (const row of dataRows) {
      const item: any = { business_unit_id: businessUnitId }

      for (const [colIndex, fieldName] of Object.entries(columnMapping)) {
        const value = row[parseInt(colIndex)]
        if (value !== null && value !== undefined && value !== '') {
          // Handle special transformations
          if (fieldName === 'price' || fieldName === 'duration' || fieldName === 'compare_at_price') {
            const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
            if (!isNaN(numValue)) {
              item[fieldName as string] = numValue
            }
          } else if (fieldName === 'tags') {
            // Convert comma-separated tags to array
            item[fieldName as string] = String(value).split(',').map(t => t.trim()).filter(t => t)
          } else if (fieldName === 'type' && type === 'policies') {
            // Normalize policy type
            const normalizedType = String(value).toLowerCase().trim()
            const validTypes = ['refund', 'return', 'shipping', 'warranty', 'privacy', 'terms', 'other']
            item[fieldName as string] = validTypes.includes(normalizedType) ? normalizedType : 'other'
          } else if (fieldName === 'product_type') {
            // Normalize product type
            const normalizedType = String(value).toLowerCase().trim()
            item[fieldName as string] = ['base', 'addon'].includes(normalizedType) ? normalizedType : 'base'
          } else {
            item[fieldName as string] = String(value)
          }
        }
      }

      // Only add items with required fields
      if (type === 'products' && item.name) {
        // Set default product_type if not specified
        if (!item.product_type) item.product_type = 'base'
        transformedItems.push(item)
      } else if (type === 'services' && item.name) {
        transformedItems.push(item)
      } else if (type === 'policies' && item.title && item.content) {
        if (!item.type) item.type = 'other'
        transformedItems.push(item)
      }
    }

    if (transformedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid items found in the file. Make sure required fields are present.' },
        { status: 400 }
      )
    }

    // Insert into database
    const tableName = type === 'products' ? 'kb_products' :
                      type === 'services' ? 'kb_services' : 'kb_policies'

    const { error } = await supabase
      .from(tableName)
      .insert(transformedItems)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: transformedItems.length,
      message: `Successfully imported ${transformedItems.length} ${type}`
    })

  } catch (error) {
    console.error('Excel upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process Excel file' },
      { status: 500 }
    )
  }
}
