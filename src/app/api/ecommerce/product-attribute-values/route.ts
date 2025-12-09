/**
 * Product Attribute Values API (Generic)
 *
 * GET - Get attribute values for products
 * PUT - Update attribute values for a product
 *
 * Uses product_attribute_values table to link products to attribute options
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get attribute values for products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const productIds = searchParams.get('productIds')

    if (!productId && !productIds) {
      return NextResponse.json({ error: 'productId or productIds is required' }, { status: 400 })
    }

    let query = supabase
      .from('product_attribute_values')
      .select(`
        id,
        product_id,
        attribute_id,
        option_id,
        product_attributes(id, name, handle),
        product_attribute_options(id, name, handle, category_id)
      `)

    if (productId) {
      query = query.eq('product_id', productId)
    } else if (productIds) {
      const ids = productIds.split(',').filter(Boolean)
      query = query.in('product_id', ids)
    }

    const { data: values, error } = await query

    if (error) throw error

    return NextResponse.json({
      values: (values || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        attribute_id: v.attribute_id,
        option_id: v.option_id,
        attribute_name: v.product_attributes?.name,
        attribute_handle: v.product_attributes?.handle,
        option_name: v.product_attribute_options?.name,
        option_handle: v.product_attribute_options?.handle,
        category_id: v.product_attribute_options?.category_id
      }))
    })

  } catch (error: any) {
    console.error('Error fetching product attribute values:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update attribute values for a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, attributeId, optionIds } = body

    if (!productId || !attributeId) {
      return NextResponse.json(
        { error: 'productId and attributeId are required' },
        { status: 400 }
      )
    }

    // Delete existing values for this product + attribute
    await supabase
      .from('product_attribute_values')
      .delete()
      .eq('product_id', productId)
      .eq('attribute_id', attributeId)

    // Insert new values
    if (optionIds && optionIds.length > 0) {
      const inserts = optionIds.map((optionId: string) => ({
        product_id: productId,
        attribute_id: attributeId,
        option_id: optionId
      }))

      const { error: insertError } = await supabase
        .from('product_attribute_values')
        .insert(inserts)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, count: optionIds?.length || 0 })

  } catch (error: any) {
    console.error('Error updating product attribute values:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Bulk update attribute values for multiple products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body // Array of { productId, attributeId, optionIds }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    let totalUpdated = 0

    for (const update of updates) {
      const { productId, attributeId, optionIds } = update

      // Delete existing
      await supabase
        .from('product_attribute_values')
        .delete()
        .eq('product_id', productId)
        .eq('attribute_id', attributeId)

      // Insert new
      if (optionIds && optionIds.length > 0) {
        const inserts = optionIds.map((optionId: string) => ({
          product_id: productId,
          attribute_id: attributeId,
          option_id: optionId
        }))

        await supabase
          .from('product_attribute_values')
          .insert(inserts)

        totalUpdated += optionIds.length
      }
    }

    return NextResponse.json({ success: true, totalUpdated })

  } catch (error: any) {
    console.error('Error bulk updating product attribute values:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
