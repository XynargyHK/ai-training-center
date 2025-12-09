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

// GET - List products with types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productTypeId = searchParams.get('productTypeId')
    const search = searchParams.get('search')

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
        product_types(id, name)
      `)
      .is('deleted_at', null)
      .order('title')

    if (productTypeId) {
      query = query.eq('product_type_id', productTypeId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error } = await query

    if (error) throw error

    // Fetch add-ons for all products
    const { data: addonMatches } = await supabase
      .from('product_addon_matches')
      .select(`
        product_id,
        addon_product_id,
        display_order,
        addon:products!addon_product_id(id, title, tagline, thumbnail, cost_price, product_types(id, name))
      `)
      .order('display_order')

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

    // Get product types with counts
    const { data: allProducts } = await supabase
      .from('products')
      .select('product_type_id, product_types(id, name)')
      .is('deleted_at', null)

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
      total: productsWithAddons?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching shop products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
