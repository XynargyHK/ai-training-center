/**
 * Product Categories API
 * PUT - Update which categories a product belongs to (by category handle)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PUT - Update product category mappings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, categories } = body
    // categories = ['face', 'eye', 'body', 'scalp'] - array of category handles

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Get all available categories to map handles to IDs
    const { data: allCategories, error: catError } = await supabase
      .from('product_categories')
      .select('id, handle')

    if (catError) {
      console.error('Error fetching categories:', catError)
      return NextResponse.json({ error: catError.message }, { status: 500 })
    }

    // Create a map of handle -> id
    const handleToId: Record<string, string> = {}
    allCategories?.forEach(cat => {
      handleToId[cat.handle] = cat.id
    })

    // Delete existing category mappings for this product
    const { error: deleteError } = await supabase
      .from('product_category_mapping')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Error deleting old mappings:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new category mappings
    if (categories && categories.length > 0) {
      const inserts = categories
        .map((handle: string) => {
          const categoryId = handleToId[handle]
          if (!categoryId) {
            console.warn(`Category handle not found: ${handle}`)
            return null
          }
          return {
            product_id: productId,
            category_id: categoryId
          }
        })
        .filter(Boolean)

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('product_category_mapping')
          .insert(inserts)

        if (insertError) {
          console.error('Error inserting category mappings:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: categories?.length || 0
    })
  } catch (error: any) {
    console.error('Error in PUT products/categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get categories for a specific product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const { data: mappings, error } = await supabase
      .from('product_category_mapping')
      .select(`
        category_id,
        product_categories(id, name, handle)
      `)
      .eq('product_id', productId)

    if (error) {
      console.error('Error fetching product categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const categories = mappings?.map(m => ({
      id: m.product_categories?.id,
      name: m.product_categories?.name,
      handle: m.product_categories?.handle
    })) || []

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error in GET products/categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
