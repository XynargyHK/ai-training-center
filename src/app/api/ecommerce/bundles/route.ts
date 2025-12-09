/**
 * Bundles API Routes - Product Bundle Management
 * GET /api/ecommerce/bundles - List all bundles
 * POST /api/ecommerce/bundles - Create a new bundle
 * PUT /api/ecommerce/bundles - Update an existing bundle
 * DELETE /api/ecommerce/bundles - Delete a bundle
 */

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

// GET - List bundles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')
    const bundleId = searchParams.get('id')

    // Get single bundle by ID
    if (bundleId) {
      const { data: bundle, error } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('id', bundleId)
        .single()

      if (error) throw error
      return NextResponse.json({ bundle })
    }

    // Get all bundles for business unit
    if (!businessUnitParam) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    const { data: bundles, error } = await supabase
      .from('product_bundles')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ bundles: bundles || [] })
  } catch (error: any) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bundles' },
      { status: 500 }
    )
  }
}

// POST - Create new bundle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      business_unit_id,
      name,
      description,
      thumbnail,
      bundle_type,
      products,
      discount_type,
      discount_value,
      original_price,
      final_price,
      savings,
      subscription_duration,
      is_active,
      is_featured
    } = body

    if (!business_unit_id || !name) {
      return NextResponse.json(
        { error: 'business_unit_id and name are required' },
        { status: 400 }
      )
    }

    // Generate handle from name
    const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: bundle, error } = await supabase
      .from('product_bundles')
      .insert({
        business_unit_id,
        name,
        handle,
        description,
        thumbnail,
        bundle_type: bundle_type || 'fixed',
        products: products || [],
        discount_type: discount_type || 'percentage',
        discount_value: discount_value || 0,
        original_price: original_price || 0,
        final_price: final_price || 0,
        savings: savings || 0,
        subscription_duration,
        is_active: is_active !== false,
        is_featured: is_featured || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bundle }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bundle:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bundle' },
      { status: 500 }
    )
  }
}

// PUT - Update existing bundle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Copy all fields that are present
    if (updateData.name !== undefined) {
      updates.name = updateData.name
      updates.handle = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (updateData.description !== undefined) updates.description = updateData.description
    if (updateData.thumbnail !== undefined) updates.thumbnail = updateData.thumbnail
    if (updateData.bundle_type !== undefined) updates.bundle_type = updateData.bundle_type
    if (updateData.products !== undefined) updates.products = updateData.products
    if (updateData.discount_type !== undefined) updates.discount_type = updateData.discount_type
    if (updateData.discount_value !== undefined) updates.discount_value = updateData.discount_value
    if (updateData.original_price !== undefined) updates.original_price = updateData.original_price
    if (updateData.final_price !== undefined) updates.final_price = updateData.final_price
    if (updateData.savings !== undefined) updates.savings = updateData.savings
    if (updateData.subscription_duration !== undefined) updates.subscription_duration = updateData.subscription_duration
    if (updateData.is_active !== undefined) updates.is_active = updateData.is_active
    if (updateData.is_featured !== undefined) updates.is_featured = updateData.is_featured

    const { data: bundle, error } = await supabase
      .from('product_bundles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bundle })
  } catch (error: any) {
    console.error('Error updating bundle:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update bundle' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a bundle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('product_bundles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete bundle' },
      { status: 500 }
    )
  }
}
