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

// GET - List product categories for a business unit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')

    console.log('🔍 [categories] businessUnitParam:', businessUnitParam)

    if (!businessUnitParam) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    console.log('🔍 [categories] resolved businessUnitId:', businessUnitId)

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .order('created_at')

    console.log('🔍 [categories] found categories:', categories?.length || 0)

    if (error) throw error

    return NextResponse.json({ categories: categories || [] })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, name, handle, description, display_order } = body

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

    const catHandle = handle || name.toLowerCase().replace(/\s+/g, '-')

    // Note: product_categories table uses 'rank' column, not 'display_order'
    const { data: category, error } = await supabase
      .from('product_categories')
      .insert({
        business_unit_id: resolvedBusinessUnitId,
        name,
        handle: catHandle,
        description: description || null,
        rank: display_order || 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT - Update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, handle, description, display_order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Note: product_categories table uses 'rank' column, not 'display_order'
    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (handle !== undefined) updates.handle = handle
    if (description !== undefined) updates.description = description
    if (display_order !== undefined) updates.rank = display_order

    const { data: category, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a category
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
      .from('product_categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}
