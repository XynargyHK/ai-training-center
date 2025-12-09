/**
 * Knowledge Base Bundles API
 * CRUD operations for kb_bundles and kb_bundle_slots tables
 * Manages product bundles (fixed or build-your-own)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List bundles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')
    const bundleType = searchParams.get('type')
    const includeSlots = searchParams.get('includeSlots') === 'true'

    let query = supabase
      .from('kb_bundles')
      .select(includeSlots ? `
        *,
        kb_bundle_slots(
          *,
          kb_products(id, name, price)
        ),
        kb_pricing_tiers(id, name)
      ` : '*')
      .order('display_order')

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    if (bundleType) {
      query = query.eq('bundle_type', bundleType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      bundles: data
    })
  } catch (error: any) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create bundle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      business_unit_id,
      name,
      description,
      bundle_type,
      fixed_price,
      compare_at_price,
      discount_type,
      discount_value,
      pricing_tier_id,
      image_url,
      slots // Optional array of slot definitions
    } = body

    if (!business_unit_id || !name) {
      return NextResponse.json(
        { success: false, error: 'business_unit_id and name are required' },
        { status: 400 }
      )
    }

    // Create bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('kb_bundles')
      .insert({
        business_unit_id,
        name,
        description,
        bundle_type: bundle_type || 'fixed',
        fixed_price,
        compare_at_price,
        discount_type,
        discount_value,
        pricing_tier_id,
        image_url
      })
      .select()
      .single()

    if (bundleError) throw bundleError

    // Create slots if provided
    if (slots && Array.isArray(slots) && slots.length > 0) {
      const slotsWithBundleId = slots.map((slot, index) => ({
        ...slot,
        bundle_id: bundle.id,
        display_order: slot.display_order ?? index
      }))

      const { error: slotsError } = await supabase
        .from('kb_bundle_slots')
        .insert(slotsWithBundleId)

      if (slotsError) throw slotsError
    }

    return NextResponse.json({
      success: true,
      bundle
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bundle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update bundle
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      bundle_type,
      fixed_price,
      compare_at_price,
      discount_type,
      discount_value,
      pricing_tier_id,
      image_url,
      is_active,
      display_order,
      slots // Optional: replace all slots
    } = body

    // Update bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('kb_bundles')
      .update({
        name,
        description,
        bundle_type,
        fixed_price,
        compare_at_price,
        discount_type,
        discount_value,
        pricing_tier_id,
        image_url,
        is_active,
        display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (bundleError) throw bundleError

    // Replace slots if provided
    if (slots && Array.isArray(slots)) {
      // Delete existing slots
      await supabase
        .from('kb_bundle_slots')
        .delete()
        .eq('bundle_id', id)

      // Insert new slots
      if (slots.length > 0) {
        const slotsWithBundleId = slots.map((slot, index) => ({
          ...slot,
          bundle_id: id,
          display_order: slot.display_order ?? index
        }))

        const { error: slotsError } = await supabase
          .from('kb_bundle_slots')
          .insert(slotsWithBundleId)

        if (slotsError) throw slotsError
      }
    }

    return NextResponse.json({
      success: true,
      bundle
    })
  } catch (error: any) {
    console.error('Error updating bundle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete bundle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    // Slots are deleted via CASCADE
    const { error } = await supabase
      .from('kb_bundles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Bundle deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
