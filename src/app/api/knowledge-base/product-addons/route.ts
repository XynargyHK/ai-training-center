/**
 * Knowledge Base Product-Addon Mapping API
 * CRUD operations for kb_product_addons table
 * Maps base products to their available add-ons (Step 2 assignment)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List product-addon mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const addonProductId = searchParams.get('addonProductId')

    let query = supabase
      .from('kb_product_addons')
      .select(`
        *,
        product:kb_products!product_id(id, name, price),
        addon:kb_products!addon_product_id(id, name, price)
      `)
      .order('display_order')

    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (addonProductId) {
      query = query.eq('addon_product_id', addonProductId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      addons: data
    })
  } catch (error: any) {
    console.error('Error fetching product-addon mappings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create product-addon mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, addon_product_id, display_order, is_default, mappings } = body

    // Support bulk insert
    if (mappings && Array.isArray(mappings)) {
      const { data, error } = await supabase
        .from('kb_product_addons')
        .upsert(mappings, { onConflict: 'product_id,addon_product_id' })
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        addons: data
      }, { status: 201 })
    }

    // Single insert
    if (!product_id || !addon_product_id) {
      return NextResponse.json(
        { success: false, error: 'product_id and addon_product_id are required' },
        { status: 400 }
      )
    }

    if (product_id === addon_product_id) {
      return NextResponse.json(
        { success: false, error: 'A product cannot be its own addon' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('kb_product_addons')
      .upsert({
        product_id,
        addon_product_id,
        display_order: display_order || 0,
        is_default: is_default || false
      }, { onConflict: 'product_id,addon_product_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      addon: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product-addon mapping:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update product-addon mapping
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mapping ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { display_order, is_default } = body

    const { data, error } = await supabase
      .from('kb_product_addons')
      .update({ display_order, is_default })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      addon: data
    })
  } catch (error: any) {
    console.error('Error updating product-addon mapping:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove product-addon mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const productId = searchParams.get('productId')
    const addonProductId = searchParams.get('addonProductId')

    if (id) {
      const { error } = await supabase
        .from('kb_product_addons')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else if (productId && addonProductId) {
      const { error } = await supabase
        .from('kb_product_addons')
        .delete()
        .eq('product_id', productId)
        .eq('addon_product_id', addonProductId)

      if (error) throw error
    } else {
      return NextResponse.json(
        { success: false, error: 'id or (productId and addonProductId) required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Addon mapping deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product-addon mapping:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
