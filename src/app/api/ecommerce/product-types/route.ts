import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to resolve business unit ID from slug or UUID
async function resolveBusinessUnitId(idOrSlug: string): Promise<string | null> {
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(idOrSlug)) {
    return idOrSlug
  }

  // Look up by slug
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', idOrSlug)
    .single()

  return bu?.id || null
}

// GET - List product types for a business unit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')

    console.log('🔍 [product-types] businessUnitParam:', businessUnitParam)

    if (!businessUnitParam) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    console.log('🔍 [product-types] resolved businessUnitId:', businessUnitId)

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    const { data: types, error } = await supabase
      .from('product_types')
      .select('*, product_categories(id, name, handle)')
      .eq('business_unit_id', businessUnitId)
      .order('display_order')

    console.log('🔍 [product-types] found types:', types?.length || 0)

    if (error) throw error

    return NextResponse.json({ types: types || [] })
  } catch (error: any) {
    console.error('Error fetching product types:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product types' },
      { status: 500 }
    )
  }
}

// POST - Create a new product type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, name, handle, is_addon, display_order } = body

    if (!businessUnitId || !name) {
      return NextResponse.json(
        { error: 'businessUnitId and name are required' },
        { status: 400 }
      )
    }

    // Resolve business unit ID from slug if needed
    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    const typeHandle = handle || name.toLowerCase().replace(/\s+/g, '-')

    const { data: type, error } = await supabase
      .from('product_types')
      .insert({
        business_unit_id: resolvedBusinessUnitId,
        name,
        handle: typeHandle,
        is_addon: is_addon || false,
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ type })
  } catch (error: any) {
    console.error('Error creating product type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product type' },
      { status: 500 }
    )
  }
}

// PUT - Update a product type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, handle, is_addon, display_order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (handle !== undefined) updates.handle = handle
    if (is_addon !== undefined) updates.is_addon = is_addon
    if (display_order !== undefined) updates.display_order = display_order

    const { data: type, error } = await supabase
      .from('product_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ type })
  } catch (error: any) {
    console.error('Error updating product type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product type' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product type' },
      { status: 500 }
    )
  }
}
