/**
 * Attribute Options API
 *
 * Manages options for product attributes (e.g., "Acne", "Aging" for Skin Concerns)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List options for an attribute
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attributeId = searchParams.get('attributeId')

    if (!attributeId) {
      return NextResponse.json({ error: 'attributeId is required' }, { status: 400 })
    }

    const { data: options, error } = await supabase
      .from('product_attribute_options')
      .select(`
        *,
        product_categories (
          id,
          name
        )
      `)
      .eq('attribute_id', attributeId)
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ options: options || [] })
  } catch (error: any) {
    console.error('Error fetching attribute options:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attribute_id, name, handle, category_id, description, icon } = body

    if (!attribute_id || !name) {
      return NextResponse.json({ error: 'attribute_id and name are required' }, { status: 400 })
    }

    // Get current max display order
    const { data: existing } = await supabase
      .from('product_attribute_options')
      .select('display_order')
      .eq('attribute_id', attribute_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = existing?.[0]?.display_order ?? -1

    const { data, error } = await supabase
      .from('product_attribute_options')
      .insert({
        attribute_id,
        name,
        handle: handle || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: category_id || null,
        description: description || null,
        icon: icon || null,
        display_order: maxOrder + 1
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ option: data })
  } catch (error: any) {
    console.error('Error creating attribute option:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update an option
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, handle, category_id, description, icon } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (handle !== undefined) updateData.handle = handle
    if (category_id !== undefined) updateData.category_id = category_id || null
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon

    const { data, error } = await supabase
      .from('product_attribute_options')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ option: data })
  } catch (error: any) {
    console.error('Error updating attribute option:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete an option
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // First delete any product attribute values that reference this option
    await supabase
      .from('product_attribute_values')
      .delete()
      .eq('option_id', id)

    const { error } = await supabase
      .from('product_attribute_options')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting attribute option:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
