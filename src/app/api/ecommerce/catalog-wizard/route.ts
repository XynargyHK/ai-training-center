/**
 * AI-Guided Catalog Setup Wizard API
 *
 * This API powers an intelligent setup wizard that helps users:
 * 1. Determine the best approach for their catalog setup
 * 2. Extract products from documents or URLs
 * 3. Generate categories and product types based on their industry
 * 4. Create products with AI assistance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Industry templates with pre-defined categories and product types
const INDUSTRY_TEMPLATES: Record<string, {
  name: string
  categories: { name: string; handle: string; description?: string }[]
  productTypes: { name: string; handle: string; is_addon: boolean; categoryHandle?: string }[]
}> = {
  'skincare': {
    name: 'Skincare & Beauty',
    categories: [
      { name: 'Face', handle: 'face', description: 'Facial skincare products' },
      { name: 'Body', handle: 'body', description: 'Body care products' },
      { name: 'Eye', handle: 'eye', description: 'Eye area treatments' },
      { name: 'Scalp & Hair', handle: 'scalp', description: 'Scalp and hair care' },
    ],
    productTypes: [
      { name: 'Cleanser', handle: 'cleanser', is_addon: false },
      { name: 'Serum', handle: 'serum', is_addon: false },
      { name: 'Moisturizer', handle: 'moisturizer', is_addon: false },
      { name: 'Mask', handle: 'mask', is_addon: false },
      { name: 'Booster', handle: 'booster', is_addon: true },
      { name: 'Treatment', handle: 'treatment', is_addon: false },
      { name: 'SPF', handle: 'spf', is_addon: false },
    ]
  },
  'restaurant': {
    name: 'Restaurant & Food',
    categories: [
      { name: 'Appetizers', handle: 'appetizers' },
      { name: 'Main Course', handle: 'main-course' },
      { name: 'Desserts', handle: 'desserts' },
      { name: 'Beverages', handle: 'beverages' },
      { name: 'Sides', handle: 'sides' },
    ],
    productTypes: [
      { name: 'Hot Dish', handle: 'hot-dish', is_addon: false },
      { name: 'Cold Dish', handle: 'cold-dish', is_addon: false },
      { name: 'Drink', handle: 'drink', is_addon: false },
      { name: 'Add-on', handle: 'addon', is_addon: true },
      { name: 'Combo', handle: 'combo', is_addon: false },
    ]
  },
  'florist': {
    name: 'Florist & Gifts',
    categories: [
      { name: 'Bouquets', handle: 'bouquets' },
      { name: 'Arrangements', handle: 'arrangements' },
      { name: 'Plants', handle: 'plants' },
      { name: 'Gift Baskets', handle: 'gift-baskets' },
      { name: 'Occasions', handle: 'occasions' },
    ],
    productTypes: [
      { name: 'Fresh Flowers', handle: 'fresh-flowers', is_addon: false },
      { name: 'Dried Flowers', handle: 'dried-flowers', is_addon: false },
      { name: 'Potted Plant', handle: 'potted-plant', is_addon: false },
      { name: 'Add-on Gift', handle: 'addon-gift', is_addon: true },
      { name: 'Vase', handle: 'vase', is_addon: true },
    ]
  },
  'apparel': {
    name: 'Apparel & Fashion',
    categories: [
      { name: 'Tops', handle: 'tops' },
      { name: 'Bottoms', handle: 'bottoms' },
      { name: 'Dresses', handle: 'dresses' },
      { name: 'Outerwear', handle: 'outerwear' },
      { name: 'Accessories', handle: 'accessories' },
    ],
    productTypes: [
      { name: 'Casual', handle: 'casual', is_addon: false },
      { name: 'Formal', handle: 'formal', is_addon: false },
      { name: 'Sportswear', handle: 'sportswear', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true },
    ]
  },
  'electronics': {
    name: 'Electronics & Tech',
    categories: [
      { name: 'Computers', handle: 'computers' },
      { name: 'Mobile Devices', handle: 'mobile' },
      { name: 'Audio', handle: 'audio' },
      { name: 'Accessories', handle: 'accessories' },
      { name: 'Smart Home', handle: 'smart-home' },
    ],
    productTypes: [
      { name: 'Device', handle: 'device', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true },
      { name: 'Software', handle: 'software', is_addon: true },
      { name: 'Bundle', handle: 'bundle', is_addon: false },
    ]
  },
  'general': {
    name: 'General Retail',
    categories: [
      { name: 'Featured', handle: 'featured' },
      { name: 'New Arrivals', handle: 'new-arrivals' },
      { name: 'Best Sellers', handle: 'best-sellers' },
      { name: 'Sale', handle: 'sale' },
    ],
    productTypes: [
      { name: 'Standard Product', handle: 'standard', is_addon: false },
      { name: 'Add-on', handle: 'addon', is_addon: true },
      { name: 'Bundle', handle: 'bundle', is_addon: false },
    ]
  }
}

// Helper function to resolve business unit ID
async function resolveBusinessUnitId(idOrSlug: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(idOrSlug)) {
    return idOrSlug
  }
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', idOrSlug)
    .single()
  return bu?.id || null
}

// POST - Handle wizard actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, businessUnitId, ...params } = body

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId is required' }, { status: 400 })
    }

    const resolvedBuId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBuId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    switch (action) {
      case 'analyze_situation':
        return handleAnalyzeSituation(resolvedBuId)

      case 'chat':
        return handleChat(resolvedBuId, params.message, params.context)

      case 'detect_industry':
        return handleDetectIndustry(params.description)

      case 'apply_template':
        return handleApplyTemplate(resolvedBuId, params.industry)

      case 'extract_from_url':
        return handleExtractFromUrl(resolvedBuId, params.url)

      case 'extract_from_document':
        return handleExtractFromDocument(resolvedBuId, params.content, params.filename)

      case 'create_products_batch':
        return handleCreateProductsBatch(resolvedBuId, params.products)

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Catalog wizard error:', error)
    return NextResponse.json(
      { error: error.message || 'Wizard error' },
      { status: 500 }
    )
  }
}

// Analyze current catalog situation
async function handleAnalyzeSituation(businessUnitId: string) {
  // Check what exists
  const [categoriesRes, typesRes, productsRes] = await Promise.all([
    supabase.from('product_categories').select('id, name').eq('business_unit_id', businessUnitId),
    supabase.from('product_types').select('id, name').eq('business_unit_id', businessUnitId),
    supabase.from('products').select('id, title').eq('business_unit_id', businessUnitId).is('deleted_at', null).limit(5)
  ])

  const categories = categoriesRes.data || []
  const productTypes = typesRes.data || []
  const products = productsRes.data || []

  const situation = {
    hasCategories: categories.length > 0,
    hasProductTypes: productTypes.length > 0,
    hasProducts: products.length > 0,
    categoryCount: categories.length,
    productTypeCount: productTypes.length,
    productCount: products.length,
    categories: categories.map(c => c.name),
    productTypes: productTypes.map(t => t.name),
    sampleProducts: products.map(p => p.title),
  }

  // Generate AI recommendation
  let recommendation = ''
  let suggestedPath = ''

  if (!situation.hasCategories && !situation.hasProducts) {
    recommendation = "Your catalog is empty. I recommend starting with an industry template to quickly set up categories and product types, or you can import products from existing documents/URLs."
    suggestedPath = 'template_or_import'
  } else if (situation.hasCategories && !situation.hasProducts) {
    recommendation = `You have ${situation.categoryCount} categories set up but no products yet. You can start adding products manually, or import them from documents/URLs.`
    suggestedPath = 'add_products'
  } else if (!situation.hasCategories && situation.hasProducts) {
    recommendation = "You have products but no categories. I recommend setting up categories to organize your products better."
    suggestedPath = 'add_categories'
  } else {
    recommendation = `Your catalog has ${situation.categoryCount} categories and ${situation.productCount} products. You can continue adding products or import more from external sources.`
    suggestedPath = 'manage'
  }

  return NextResponse.json({
    situation,
    recommendation,
    suggestedPath,
    availableIndustries: Object.keys(INDUSTRY_TEMPLATES).map(key => ({
      id: key,
      name: INDUSTRY_TEMPLATES[key].name
    }))
  })
}

// AI Chat for guided setup
async function handleChat(businessUnitId: string, message: string, context?: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const systemPrompt = `You are a helpful e-commerce catalog setup assistant. Your job is to help users set up their product catalog.

Current context:
- Business has ${context?.categoryCount || 0} categories
- Business has ${context?.productCount || 0} products
- Available industries for templates: ${Object.keys(INDUSTRY_TEMPLATES).join(', ')}

You can help users:
1. Choose the right industry template
2. Understand how to import products from documents or URLs
3. Guide them through manual product creation
4. Answer questions about catalog organization

Be concise and helpful. If the user describes their business, suggest the most appropriate industry template.
If they want to import products, explain they can:
- Paste a product page URL for AI to extract info
- Upload product documents (PDFs, spreadsheets) for AI to parse
- Enter products manually

Always end with a clear action suggestion or question.`

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: `User message: ${message}` }
  ])

  const response = result.response.text()

  // Try to detect if user mentioned an industry
  const industryMatch = detectIndustryFromText(message)

  return NextResponse.json({
    response,
    detectedIndustry: industryMatch,
    suggestedActions: extractSuggestedActions(response, context)
  })
}

// Detect industry from description
async function handleDetectIndustry(description: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Based on this business description, which industry template is the best match?

Description: "${description}"

Available templates:
${Object.entries(INDUSTRY_TEMPLATES).map(([key, val]) => `- ${key}: ${val.name}`).join('\n')}

Return ONLY the template key (e.g., "skincare", "restaurant", etc.) that best matches.
If none match well, return "general".`

  const result = await model.generateContent(prompt)
  const industry = result.response.text().trim().toLowerCase().replace(/[^a-z-]/g, '')

  const matchedIndustry = INDUSTRY_TEMPLATES[industry] ? industry : 'general'

  return NextResponse.json({
    detectedIndustry: matchedIndustry,
    industryName: INDUSTRY_TEMPLATES[matchedIndustry].name,
    template: INDUSTRY_TEMPLATES[matchedIndustry]
  })
}

// Apply industry template (create categories and product types)
async function handleApplyTemplate(businessUnitId: string, industry: string) {
  const template = INDUSTRY_TEMPLATES[industry]
  if (!template) {
    return NextResponse.json({ error: 'Unknown industry template' }, { status: 400 })
  }

  const createdCategories: any[] = []
  const createdTypes: any[] = []

  // Create categories
  for (let i = 0; i < template.categories.length; i++) {
    const cat = template.categories[i]
    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        business_unit_id: businessUnitId,
        name: cat.name,
        handle: cat.handle,
        description: cat.description || null,
        rank: i
      })
      .select()
      .single()

    if (!error && data) {
      createdCategories.push(data)
    }
  }

  // Create product types
  for (let i = 0; i < template.productTypes.length; i++) {
    const type = template.productTypes[i]
    const { data, error } = await supabase
      .from('product_types')
      .insert({
        business_unit_id: businessUnitId,
        name: type.name,
        handle: type.handle,
        is_addon: type.is_addon,
        display_order: i
      })
      .select()
      .single()

    if (!error && data) {
      createdTypes.push(data)
    }
  }

  return NextResponse.json({
    success: true,
    industry,
    industryName: template.name,
    createdCategories,
    createdTypes,
    message: `Created ${createdCategories.length} categories and ${createdTypes.length} product types for ${template.name}`
  })
}

// Extract products from URL
async function handleExtractFromUrl(businessUnitId: string, url: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Fetch the page
  let pageContent: string
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    pageContent = await response.text()
  } catch (error) {
    return NextResponse.json({ error: 'Could not fetch URL' }, { status: 400 })
  }

  // Strip HTML to text
  const textContent = pageContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 15000)

  const prompt = `Extract product information from this webpage content.

URL: ${url}
Content: ${textContent}

Extract any products found and return as JSON array:
[
  {
    "title": "Product Name",
    "tagline": "Short tagline if found",
    "description": "Product description",
    "price": 99.99,
    "sku": "SKU-123",
    "category_suggestion": "suggested category name",
    "ingredients": "if applicable",
    "benefits": "key benefits if found",
    "images": ["image URL if found"]
  }
]

If this is a single product page, return array with one product.
If this is a category/listing page, extract multiple products.
Return ONLY the JSON array, no explanation.`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    const products = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      url,
      extractedProducts: products,
      productCount: products.length
    })
  } catch (parseError) {
    return NextResponse.json({
      success: false,
      error: 'Could not parse product information',
      rawResponse: responseText.substring(0, 500)
    }, { status: 422 })
  }
}

// Extract products from document content
async function handleExtractFromDocument(businessUnitId: string, content: string, filename: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Extract product information from this document.

Filename: ${filename}
Content:
${content.substring(0, 20000)}

Extract all products found and return as JSON array:
[
  {
    "title": "Product Name",
    "tagline": "Short tagline if found",
    "description": "Product description",
    "price": 99.99,
    "sku": "SKU-123",
    "category_suggestion": "suggested category name",
    "ingredients": "if applicable (for skincare/food)",
    "benefits": "key benefits if found",
    "key_actives": "active ingredients if applicable"
  }
]

Return ONLY the JSON array, no explanation.`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    const products = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      filename,
      extractedProducts: products,
      productCount: products.length
    })
  } catch (parseError) {
    return NextResponse.json({
      success: false,
      error: 'Could not parse product information from document',
      rawResponse: responseText.substring(0, 500)
    }, { status: 422 })
  }
}

// Create multiple products at once
async function handleCreateProductsBatch(businessUnitId: string, products: any[]) {
  const created: any[] = []
  const errors: any[] = []

  for (const product of products) {
    try {
      const handle = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('products')
        .insert({
          business_unit_id: businessUnitId,
          title: product.title,
          handle,
          subtitle: product.tagline || null,
          description: product.description || null,
          thumbnail: product.images?.[0] || null,
          status: 'draft',
          tagline: product.tagline || null,
          hero_benefit: product.benefits || null,
          key_actives: product.key_actives || null,
          ingredients: product.ingredients || null,
          metadata: {
            price: product.price,
            sku: product.sku,
            imported: true,
            import_date: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) throw error
      created.push(data)
    } catch (err: any) {
      errors.push({ product: product.title, error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    created,
    errors,
    createdCount: created.length,
    errorCount: errors.length
  })
}

// Helper: Detect industry from text
function detectIndustryFromText(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('skin') || lower.includes('beauty') || lower.includes('cosmetic') || lower.includes('serum')) {
    return 'skincare'
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('menu')) {
    return 'restaurant'
  }
  if (lower.includes('flower') || lower.includes('florist') || lower.includes('bouquet')) {
    return 'florist'
  }
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('apparel') || lower.includes('wear')) {
    return 'apparel'
  }
  if (lower.includes('electronic') || lower.includes('tech') || lower.includes('computer') || lower.includes('phone')) {
    return 'electronics'
  }

  return null
}

// Helper: Extract suggested actions from AI response
function extractSuggestedActions(response: string, context?: any): string[] {
  const actions: string[] = []
  const lower = response.toLowerCase()

  if (lower.includes('template')) actions.push('apply_template')
  if (lower.includes('import') || lower.includes('url') || lower.includes('document')) actions.push('import_products')
  if (lower.includes('manual') || lower.includes('add product')) actions.push('manual_add')
  if (lower.includes('categor')) actions.push('manage_categories')

  return actions
}
