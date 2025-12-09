import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')

    let query = supabase
      .from('kb_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data: categories, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      categories: categories || []
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, parent_id, display_order, business_unit_id } = body

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: category, error } = await supabase
      .from('kb_categories')
      .insert({
        name,
        slug: finalSlug,
        description,
        parent_id: parent_id || null,
        display_order: display_order || 0,
        business_unit_id,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, description, parent_id, display_order, is_active } = body

    const { data: category, error } = await supabase
      .from('kb_categories')
      .update({
        name,
        slug,
        description,
        parent_id: parent_id || null,
        display_order,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kb_categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Category deleted'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
