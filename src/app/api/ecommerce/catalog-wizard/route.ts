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
  'factory-outlet': {
    name: 'Factory Outlet',
    categories: [
      { name: 'Clearance', handle: 'clearance', description: 'Final clearance items' },
      { name: 'Overstock', handle: 'overstock', description: 'Excess inventory' },
      { name: 'Seconds', handle: 'seconds', description: 'Minor imperfection items' },
      { name: 'Sample Sale', handle: 'sample-sale', description: 'Sample products' },
      { name: 'End of Season', handle: 'end-of-season', description: 'Seasonal closeouts' },
      { name: 'Bundle Deals', handle: 'bundle-deals', description: 'Multi-pack savings' },
    ],
    productTypes: [
      { name: 'First Quality', handle: 'first-quality', is_addon: false },
      { name: 'Second Quality', handle: 'second-quality', is_addon: false },
      { name: 'Sample', handle: 'sample', is_addon: false },
      { name: 'Overstock', handle: 'overstock', is_addon: false },
      { name: 'Bundle', handle: 'bundle', is_addon: false },
      { name: 'Add-on', handle: 'addon', is_addon: true },
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
  'grocery': {
    name: 'Grocery & Supermarket',
    categories: [
      { name: 'Fresh Produce', handle: 'fresh-produce' },
      { name: 'Dairy & Eggs', handle: 'dairy-eggs' },
      { name: 'Meat & Seafood', handle: 'meat-seafood' },
      { name: 'Bakery', handle: 'bakery' },
      { name: 'Frozen Foods', handle: 'frozen' },
      { name: 'Pantry', handle: 'pantry' },
      { name: 'Beverages', handle: 'beverages' },
      { name: 'Snacks', handle: 'snacks' },
    ],
    productTypes: [
      { name: 'Fresh Item', handle: 'fresh', is_addon: false },
      { name: 'Packaged Item', handle: 'packaged', is_addon: false },
      { name: 'Frozen Item', handle: 'frozen', is_addon: false },
      { name: 'Beverage', handle: 'beverage', is_addon: false },
      { name: 'Bundle', handle: 'bundle', is_addon: false },
    ]
  },
  'bakery': {
    name: 'Bakery & Pastry',
    categories: [
      { name: 'Bread', handle: 'bread' },
      { name: 'Cakes', handle: 'cakes' },
      { name: 'Pastries', handle: 'pastries' },
      { name: 'Cookies', handle: 'cookies' },
      { name: 'Seasonal', handle: 'seasonal' },
    ],
    productTypes: [
      { name: 'Daily Bake', handle: 'daily-bake', is_addon: false },
      { name: 'Special Order', handle: 'special-order', is_addon: false },
      { name: 'Topping', handle: 'topping', is_addon: true },
      { name: 'Add-on', handle: 'addon', is_addon: true },
    ]
  },
  'jewelry': {
    name: 'Jewelry Store',
    categories: [
      { name: 'Rings', handle: 'rings' },
      { name: 'Necklaces', handle: 'necklaces' },
      { name: 'Earrings', handle: 'earrings' },
      { name: 'Bracelets', handle: 'bracelets' },
      { name: 'Watches', handle: 'watches' },
      { name: 'Fine Jewelry', handle: 'fine-jewelry' },
    ],
    productTypes: [
      { name: 'Fine Jewelry', handle: 'fine', is_addon: false },
      { name: 'Fashion Jewelry', handle: 'fashion', is_addon: false },
      { name: 'Watch', handle: 'watch', is_addon: false },
      { name: 'Gift Box', handle: 'gift-box', is_addon: true },
      { name: 'Chain', handle: 'chain', is_addon: true },
    ]
  },
  'furniture': {
    name: 'Furniture Store',
    categories: [
      { name: 'Living Room', handle: 'living-room' },
      { name: 'Bedroom', handle: 'bedroom' },
      { name: 'Dining', handle: 'dining' },
      { name: 'Office', handle: 'office' },
      { name: 'Outdoor', handle: 'outdoor' },
    ],
    productTypes: [
      { name: 'Furniture', handle: 'furniture', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true },
      { name: 'Set', handle: 'set', is_addon: false },
      { name: 'Add-on Part', handle: 'addon-part', is_addon: true },
    ]
  },
  'pharmacy': {
    name: 'Pharmacy & Health',
    categories: [
      { name: 'Medications', handle: 'medications' },
      { name: 'Vitamins & Supplements', handle: 'vitamins' },
      { name: 'Personal Care', handle: 'personal-care' },
      { name: 'First Aid', handle: 'first-aid' },
      { name: 'Baby Care', handle: 'baby-care' },
    ],
    productTypes: [
      { name: 'OTC Medicine', handle: 'otc', is_addon: false },
      { name: 'Supplement', handle: 'supplement', is_addon: false },
      { name: 'Personal Care', handle: 'personal-care', is_addon: false },
      { name: 'Device', handle: 'device', is_addon: false },
      { name: 'Bundle', handle: 'bundle', is_addon: false },
    ]
  },
  'pet-store': {
    name: 'Pet Store',
    categories: [
      { name: 'Dogs', handle: 'dogs' },
      { name: 'Cats', handle: 'cats' },
      { name: 'Fish & Aquatic', handle: 'fish' },
      { name: 'Birds', handle: 'birds' },
      { name: 'Small Pets', handle: 'small-pets' },
    ],
    productTypes: [
      { name: 'Food', handle: 'food', is_addon: false },
      { name: 'Treat', handle: 'treat', is_addon: true },
      { name: 'Toy', handle: 'toy', is_addon: true },
      { name: 'Accessory', handle: 'accessory', is_addon: false },
      { name: 'Health', handle: 'health', is_addon: false },
    ]
  },
  'liquor': {
    name: 'Liquor & Wine Store',
    categories: [
      { name: 'Wine', handle: 'wine' },
      { name: 'Beer', handle: 'beer' },
      { name: 'Spirits', handle: 'spirits' },
      { name: 'Champagne', handle: 'champagne' },
      { name: 'Non-Alcoholic', handle: 'non-alcoholic' },
    ],
    productTypes: [
      { name: 'Wine', handle: 'wine', is_addon: false },
      { name: 'Beer', handle: 'beer', is_addon: false },
      { name: 'Spirit', handle: 'spirit', is_addon: false },
      { name: 'Gift Set', handle: 'gift-set', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true },
    ]
  },
  'spa-salon': {
    name: 'Spa & Salon',
    categories: [
      { name: 'Hair Services', handle: 'hair' },
      { name: 'Skin Services', handle: 'skin' },
      { name: 'Nail Services', handle: 'nail' },
      { name: 'Massage', handle: 'massage' },
      { name: 'Packages', handle: 'packages' },
    ],
    productTypes: [
      { name: 'Service', handle: 'service', is_addon: false },
      { name: 'Add-on Service', handle: 'addon-service', is_addon: true },
      { name: 'Package', handle: 'package', is_addon: false },
      { name: 'Product', handle: 'product', is_addon: false },
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

// Industry-specific extraction schemas
const INDUSTRY_EXTRACTION_SCHEMAS: Record<string, string> = {
  'apparel': `{
    "title": "Product Name",
    "title_en": "English name if different",
    "tagline": "Short marketing tagline",
    "description": "Full description",
    "price": 99.99,
    "original_price": 129.99,
    "currency": "USD",
    "sku": "SKU-123",
    "category_suggestion": "Jackets, Tops, Bottoms, etc.",
    "colors": ["Black", "Navy"],
    "sizes": ["S", "M", "L", "XL"],
    "materials": "100% Polyester",
    "features": ["Waterproof", "Breathable"],
    "images": ["url1", "url2"]
  }`,
  'skincare': `{
    "title": "Product Name",
    "tagline": "Short tagline",
    "description": "Full description",
    "price": 99.99,
    "original_price": 129.99,
    "currency": "USD",
    "sku": "SKU-123",
    "category_suggestion": "Face, Body, Eye, etc.",
    "volume": "30ml",
    "ingredients": "Water, Glycerin, Niacinamide...",
    "key_actives": "Vitamin C, Retinol, Hyaluronic Acid",
    "skin_type": "All skin types",
    "concerns": ["Anti-aging", "Hydration", "Brightening"],
    "how_to_use": "Apply morning and evening...",
    "benefits": "Reduces wrinkles, improves texture",
    "images": ["url1", "url2"]
  }`,
  'restaurant': `{
    "title": "Dish Name",
    "description": "Dish description",
    "price": 15.99,
    "currency": "USD",
    "category_suggestion": "Appetizers, Main Course, etc.",
    "ingredients": "Chicken, vegetables, sauce",
    "allergens": ["Gluten", "Dairy"],
    "dietary": ["Vegetarian", "Gluten-free"],
    "spice_level": "Medium",
    "calories": 450,
    "serving_size": "1 plate",
    "images": ["url1"]
  }`,
  'electronics': `{
    "title": "Product Name",
    "title_en": "English name if different",
    "tagline": "Marketing tagline",
    "description": "Full description",
    "price": 299.99,
    "original_price": 399.99,
    "currency": "USD",
    "sku": "SKU-123",
    "category_suggestion": "Computers, Mobile, Audio, etc.",
    "brand": "Brand Name",
    "model": "Model Number",
    "specs": {
      "processor": "Intel i7",
      "ram": "16GB",
      "storage": "512GB SSD"
    },
    "features": ["Wireless", "Bluetooth 5.0"],
    "warranty": "2 years",
    "in_box": ["Device", "Charger", "Manual"],
    "images": ["url1", "url2"]
  }`,
  'florist': `{
    "title": "Arrangement Name",
    "tagline": "Short description",
    "description": "Full description",
    "price": 49.99,
    "currency": "USD",
    "category_suggestion": "Bouquets, Arrangements, Plants",
    "flowers": ["Roses", "Lilies", "Carnations"],
    "colors": ["Red", "Pink", "White"],
    "size": "Medium",
    "vase_included": true,
    "occasion": ["Birthday", "Anniversary", "Sympathy"],
    "care_instructions": "Keep in cool place...",
    "images": ["url1"]
  }`,
  'general': `{
    "title": "Product Name",
    "tagline": "Short tagline",
    "description": "Full description",
    "price": 29.99,
    "original_price": 39.99,
    "currency": "USD",
    "sku": "SKU-123",
    "category_suggestion": "Category name",
    "brand": "Brand if applicable",
    "features": ["Feature 1", "Feature 2"],
    "specs": "Any specifications",
    "images": ["url1"]
  }`
}

// Detect industry from URL or content
function detectIndustryFromUrl(url: string, content: string): string {
  const lower = (url + ' ' + content).toLowerCase()

  if (lower.includes('skincare') || lower.includes('beauty') || lower.includes('serum') ||
      lower.includes('moisturizer') || lower.includes('cleanser') || lower.includes('cosmetic')) {
    return 'skincare'
  }
  if (lower.includes('restaurant') || lower.includes('menu') || lower.includes('dish') ||
      lower.includes('food') || lower.includes('cuisine') || lower.includes('dine')) {
    return 'restaurant'
  }
  if (lower.includes('apparel') || lower.includes('clothing') || lower.includes('jacket') ||
      lower.includes('shirt') || lower.includes('pants') || lower.includes('dress') ||
      lower.includes('sportswear') || lower.includes('fashion') || lower.includes('wear')) {
    return 'apparel'
  }
  if (lower.includes('electronics') || lower.includes('computer') || lower.includes('phone') ||
      lower.includes('laptop') || lower.includes('gadget') || lower.includes('tech')) {
    return 'electronics'
  }
  if (lower.includes('flower') || lower.includes('florist') || lower.includes('bouquet') ||
      lower.includes('arrangement') || lower.includes('roses')) {
    return 'florist'
  }

  return 'general'
}

// Extract products from URL
async function handleExtractFromUrl(businessUnitId: string, url: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Fetch the page
  let pageContent: string
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })
    pageContent = await response.text()
  } catch (error) {
    return NextResponse.json({ error: 'Could not fetch URL' }, { status: 400 })
  }

  // Extract JSON-LD structured data if present (common in e-commerce)
  const jsonLdMatches = pageContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  let structuredData = ''
  if (jsonLdMatches) {
    structuredData = jsonLdMatches.map(m => m.replace(/<\/?script[^>]*>/gi, '')).join('\n')
  }

  // Also look for product data in script tags (many sites embed product JSON)
  const productJsonMatch = pageContent.match(/var\s+product\s*=\s*(\{[\s\S]*?\});/i) ||
                           pageContent.match(/"product"\s*:\s*(\{[\s\S]*?\})/i)
  if (productJsonMatch) {
    structuredData += '\n' + productJsonMatch[1]
  }

  // Strip HTML to text
  const textContent = pageContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 12000)

  // Detect industry type
  const detectedIndustry = detectIndustryFromUrl(url, textContent.substring(0, 2000))
  const extractionSchema = INDUSTRY_EXTRACTION_SCHEMAS[detectedIndustry] || INDUSTRY_EXTRACTION_SCHEMAS['general']

  // Extract SKU from URL if present
  const urlSkuMatch = url.match(/\/product\/([A-Z0-9]+)/i) || url.match(/\/([A-Z]{2,3}[0-9]{5,})/i)
  const urlSku = urlSkuMatch ? urlSkuMatch[1] : ''

  const prompt = `Extract product information from this webpage.

URL: ${url}
Detected Industry: ${detectedIndustry.toUpperCase()}
${urlSku ? `SKU from URL: ${urlSku}` : ''}

${structuredData ? `Structured Data Found:\n${structuredData.substring(0, 5000)}\n` : ''}

Page Content:
${textContent}

Extract product details using this ${detectedIndustry.toUpperCase()} schema:
${extractionSchema}

Return as JSON array with products matching the schema above.
Include ALL relevant fields for this industry type.
If a field doesn't apply or isn't found, omit it.

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
      detectedIndustry,
      extractedProducts: products,
      productCount: products.length
    })
  } catch (parseError) {
    return NextResponse.json({
      success: false,
      error: 'Could not parse product information. The page may use JavaScript rendering.',
      suggestion: 'Try copying product details and pasting them in the text input instead.',
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
      const title = product.title || product.title_en || 'Untitled Product'
      const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      // Build metadata with all extracted fields
      const metadata: any = {
        imported: true,
        import_date: new Date().toISOString()
      }

      // Pricing
      if (product.price) metadata.price = product.price
      if (product.original_price) metadata.original_price = product.original_price
      if (product.currency) metadata.currency = product.currency
      if (product.sku) metadata.sku = product.sku

      // Apparel-specific fields
      if (product.colors?.length) metadata.colors = product.colors
      if (product.sizes?.length) metadata.sizes = product.sizes
      if (product.materials) metadata.materials = product.materials
      if (product.features?.length) metadata.features = product.features

      // Build description including features if present
      let fullDescription = product.description || ''
      if (product.features?.length && !fullDescription.includes(product.features[0])) {
        fullDescription += '\n\nFeatures:\n• ' + product.features.join('\n• ')
      }
      if (product.materials && !fullDescription.includes(product.materials)) {
        fullDescription += '\n\nMaterials: ' + product.materials
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          business_unit_id: businessUnitId,
          title: title,
          handle,
          subtitle: product.tagline || product.title_en || null,
          description: fullDescription || null,
          thumbnail: product.images?.[0] || null,
          status: 'draft',
          tagline: product.tagline || null,
          hero_benefit: product.features?.slice(0, 3).join(', ') || product.benefits || null,
          key_actives: product.materials || product.key_actives || null,
          ingredients: product.ingredients || null,
          metadata
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

  if (lower.includes('factory outlet') || lower.includes('clearance') || lower.includes('overstock') || lower.includes('seconds')) {
    return 'factory-outlet'
  }
  if (lower.includes('skin') || lower.includes('beauty') || lower.includes('cosmetic') || lower.includes('serum')) {
    return 'skincare'
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('menu') || lower.includes('dine')) {
    return 'restaurant'
  }
  if (lower.includes('flower') || lower.includes('florist') || lower.includes('bouquet')) {
    return 'florist'
  }
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('apparel') || lower.includes('wear') || lower.includes('garment')) {
    return 'apparel'
  }
  if (lower.includes('electronic') || lower.includes('tech') || lower.includes('computer') || lower.includes('phone') || lower.includes('gadget')) {
    return 'electronics'
  }
  if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('produce') || lower.includes('fresh')) {
    return 'grocery'
  }
  if (lower.includes('bakery') || lower.includes('bread') || lower.includes('pastry') || lower.includes('cake')) {
    return 'bakery'
  }
  if (lower.includes('jewelry') || lower.includes('jewellery') || lower.includes('ring') || lower.includes('necklace') || lower.includes('watch')) {
    return 'jewelry'
  }
  if (lower.includes('furniture') || lower.includes('sofa') || lower.includes('table') || lower.includes('chair') || lower.includes('bed')) {
    return 'furniture'
  }
  if (lower.includes('pharmacy') || lower.includes('drug') || lower.includes('medicine') || lower.includes('vitamin') || lower.includes('health')) {
    return 'pharmacy'
  }
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat') || lower.includes('animal')) {
    return 'pet-store'
  }
  if (lower.includes('liquor') || lower.includes('wine') || lower.includes('beer') || lower.includes('spirits') || lower.includes('alcohol')) {
    return 'liquor'
  }
  if (lower.includes('spa') || lower.includes('salon') || lower.includes('massage') || lower.includes('hair')) {
    return 'spa-salon'
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
