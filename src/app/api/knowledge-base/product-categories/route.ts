/**
 * Knowledge Base Product-Category Mapping API
 * CRUD operations for kb_product_categories table
 * Maps KB products to categories (Step 1 of the matrix system)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List product-category mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')

    let query = supabase
      .from('kb_product_categories')
      .select(`
        *,
        kb_products(id, name, price),
        kb_categories(id, name, slug)
      `)
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      mappings: data
    })
  } catch (error: any) {
    console.error('Error fetching product-category mappings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create product-category mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, category_id, mappings } = body

    // Support bulk insert
    if (mappings && Array.isArray(mappings)) {
      const { data, error } = await supabase
        .from('kb_product_categories')
        .upsert(mappings, { onConflict: 'product_id,category_id' })
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        mappings: data
      }, { status: 201 })
    }

    // Single insert
    if (!product_id || !category_id) {
      return NextResponse.json(
        { success: false, error: 'product_id and category_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('kb_product_categories')
      .upsert({ product_id, category_id }, { onConflict: 'product_id,category_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      mapping: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product-category mapping:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove product-category mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')

    if (id) {
      const { error } = await supabase
        .from('kb_product_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else if (productId && categoryId) {
      const { error } = await supabase
        .from('kb_product_categories')
        .delete()
        .eq('product_id', productId)
        .eq('category_id', categoryId)

      if (error) throw error
    } else {
      return NextResponse.json(
        { success: false, error: 'id or (productId and categoryId) required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mapping deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product-category mapping:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
