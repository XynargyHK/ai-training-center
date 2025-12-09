/**
 * Knowledge Base Products API
 * CRUD operations for kb_products table
 * These products are extracted from uploaded documents (PDF/Excel)
 * and used for AI training/knowledge base
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List KB products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('kb_products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      products: data,
      total: count,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching KB products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create KB product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      business_unit_id,
      name,
      description,
      category,
      price,
      ingredients,
      benefits,
      usage_instructions,
      warnings,
      metadata
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('kb_products')
      .insert({
        business_unit_id,
        name,
        description,
        category,
        price,
        ingredients,
        benefits,
        usage_instructions,
        warnings,
        metadata
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      product: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating KB product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update KB product
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      price,
      ingredients,
      benefits,
      usage_instructions,
      warnings,
      metadata
    } = body

    const { data, error } = await supabase
      .from('kb_products')
      .update({
        name,
        description,
        category,
        price,
        ingredients,
        benefits,
        usage_instructions,
        warnings,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error: any) {
    console.error('Error updating KB product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete KB product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kb_products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting KB product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
