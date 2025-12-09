/**
 * Product Attributes API
 *
 * Manages product attributes (filterable features like Skin Concerns, Skin Type)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to resolve business unit ID from slug or UUID
async function resolveBusinessUnitId(param: string): Promise<string | null> {
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(param)) {
    return param
  }

  // Look up by slug
  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', param)
    .single()

  return data?.id || null
}

// GET - List attributes for a business unit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnitId is required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Get attributes with their options
    const { data: attributes, error } = await supabase
      .from('product_attributes')
      .select(`
        *,
        product_attribute_options (
          id,
          name,
          handle,
          category_id,
          display_order,
          product_categories (
            id,
            name
          )
        )
      `)
      .eq('business_unit_id', businessUnitId)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Format the response
    const formattedAttributes = (attributes || []).map(attr => ({
      id: attr.id,
      name: attr.name,
      handle: attr.handle,
      attribute_type: attr.attribute_type,
      is_category_linked: attr.is_category_linked,
      is_filterable: attr.is_filterable,
      is_required: attr.is_required,
      display_order: attr.display_order,
      options: (attr.product_attribute_options || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          handle: opt.handle,
          category_id: opt.category_id,
          category_name: opt.product_categories?.name
        }))
    }))

    return NextResponse.json({ attributes: formattedAttributes })
  } catch (error: any) {
    console.error('Error fetching attributes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new attribute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId: businessUnitParam, name, handle, attribute_type, is_category_linked, is_filterable, is_required } = body

    if (!businessUnitParam || !name) {
      return NextResponse.json({ error: 'businessUnitId and name are required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Get current max display order
    const { data: existing } = await supabase
      .from('product_attributes')
      .select('display_order')
      .eq('business_unit_id', businessUnitId)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = existing?.[0]?.display_order ?? -1

    const { data, error } = await supabase
      .from('product_attributes')
      .insert({
        business_unit_id: businessUnitId,
        name,
        handle: handle || name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        attribute_type: attribute_type || 'feature',
        is_category_linked: is_category_linked || false,
        is_filterable: is_filterable ?? true,
        is_required: is_required || false,
        display_order: maxOrder + 1
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ attribute: data })
  } catch (error: any) {
    console.error('Error creating attribute:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update an attribute
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, handle, attribute_type, is_category_linked, is_filterable, is_required } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (handle !== undefined) updateData.handle = handle
    if (attribute_type !== undefined) updateData.attribute_type = attribute_type
    if (is_category_linked !== undefined) updateData.is_category_linked = is_category_linked
    if (is_filterable !== undefined) updateData.is_filterable = is_filterable
    if (is_required !== undefined) updateData.is_required = is_required

    const { data, error } = await supabase
      .from('product_attributes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ attribute: data })
  } catch (error: any) {
    console.error('Error updating attribute:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete an attribute
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Delete options first (cascade should handle this, but just in case)
    await supabase
      .from('product_attribute_options')
      .delete()
      .eq('attribute_id', id)

    const { error } = await supabase
      .from('product_attributes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
