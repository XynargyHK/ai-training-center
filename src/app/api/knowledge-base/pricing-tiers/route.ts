/**
 * Knowledge Base Pricing Tiers API
 * CRUD operations for kb_pricing_tiers table
 * Manages pricing tiers for products (e.g., Basic, Premium, Luxury)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List pricing tiers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')

    let query = supabase
      .from('kb_pricing_tiers')
      .select('*')
      .order('display_order')

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      tiers: data
    })
  } catch (error: any) {
    console.error('Error fetching pricing tiers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create pricing tier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      business_unit_id,
      name,
      description,
      min_price,
      max_price,
      display_order
    } = body

    if (!business_unit_id || !name) {
      return NextResponse.json(
        { success: false, error: 'business_unit_id and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('kb_pricing_tiers')
      .insert({
        business_unit_id,
        name,
        description,
        min_price,
        max_price,
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      tier: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating pricing tier:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update pricing tier
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tier ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      min_price,
      max_price,
      display_order,
      is_active
    } = body

    const { data, error } = await supabase
      .from('kb_pricing_tiers')
      .update({
        name,
        description,
        min_price,
        max_price,
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
      tier: data
    })
  } catch (error: any) {
    console.error('Error updating pricing tier:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete pricing tier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tier ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kb_pricing_tiers')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Pricing tier deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting pricing tier:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
