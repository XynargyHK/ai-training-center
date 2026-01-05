/**
 * Shop Products API
 * Fetches products from the products table with product types for the shop frontend
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to resolve business unit ID from slug
async function resolveBusinessUnitId(slugOrId: string): Promise<string | null> {
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) {
    return slugOrId
  }

  // Look up by slug
  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', slugOrId)
    .single()

  return data?.id || null
}

// GET - List products with types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productTypeId = searchParams.get('productTypeId')
    const search = searchParams.get('search')
    const businessUnitSlug = searchParams.get('businessUnit')

    // Resolve business unit ID from slug
    let businessUnitId: string | null = null
    if (businessUnitSlug) {
      businessUnitId = await resolveBusinessUnitId(businessUnitSlug)
    }

    let query = supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        subtitle,
        thumbnail,
        status,
        tagline,
        key_actives,
        face_benefits,
        body_benefits,
        hair_benefits,
        eye_benefits,
        compare_at_price,
        cost_price,
        is_featured,
        product_type_id,
        business_unit_id,
        product_types(id, name)
      `)
      .is('deleted_at', null)
      .eq('status', 'published')
      .order('title')

    // Filter by business unit if provided
    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    if (productTypeId) {
      query = query.eq('product_type_id', productTypeId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error } = await query

    if (error) throw error

    // Fetch add-ons for products (filtered by business unit if applicable)
    let addonQuery = supabase
      .from('product_addon_matches')
      .select(`
        product_id,
        addon_product_id,
        display_order,
        addon:products!addon_product_id(id, title, tagline, thumbnail, cost_price, product_types(id, name))
      `)
      .order('display_order')

    const { data: addonMatches } = await addonQuery

    // Create a map of product_id -> addons
    const addonsByProduct: Record<string, any[]> = {}
    addonMatches?.forEach(match => {
      if (!addonsByProduct[match.product_id]) {
        addonsByProduct[match.product_id] = []
      }
      if (match.addon) {
        addonsByProduct[match.product_id].push(match.addon)
      }
    })

    // Attach addons to products
    const productsWithAddons = products?.map(p => ({
      ...p,
      addons: addonsByProduct[p.id] || []
    }))

    // Get product types with counts (filtered by business unit and published only)
    let typesQuery = supabase
      .from('products')
      .select('product_type_id, product_types(id, name)')
      .is('deleted_at', null)
      .eq('status', 'published')

    if (businessUnitId) {
      typesQuery = typesQuery.eq('business_unit_id', businessUnitId)
    }

    const { data: allProducts } = await typesQuery

    // Count products by type
    const typeCounts: Record<string, { id: string; name: string; count: number }> = {}
    allProducts?.forEach(p => {
      if (p.product_types) {
        const typeId = (p.product_types as any).id
        const typeName = (p.product_types as any).name
        if (!typeCounts[typeId]) {
          typeCounts[typeId] = { id: typeId, name: typeName, count: 0 }
        }
        typeCounts[typeId].count++
      }
    })

    const productTypes = Object.values(typeCounts).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    return NextResponse.json({
      success: true,
      products: productsWithAddons,
      productTypes,
      total: productsWithAddons?.length || 0,
      businessUnitId
    })
  } catch (error: any) {
    console.error('Error fetching shop products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
