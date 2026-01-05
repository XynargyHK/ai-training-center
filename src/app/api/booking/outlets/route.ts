import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load all outlets
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const businessUnitSlug = searchParams.get('businessUnitId')

    // Get business unit UUID from slug if provided
    let businessUnitId = null
    if (businessUnitSlug) {
      const { data: businessUnit, error: buError } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', businessUnitSlug)
        .single()

      if (buError || !businessUnit) {
        // For new business units or invalid slugs, return empty list
        console.log(`Business unit '${businessUnitSlug}' not found, returning empty outlets list`)
        return NextResponse.json({ data: [] })
      }
      businessUnitId = businessUnit.id
    }

    let query = supabase
      .from('outlets')
      .select('*')
      .order('display_order')
      .order('name')

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading outlets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/booking/outlets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update outlet
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const {
      id,
      name,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      phone,
      email,
      display_order,
      businessUnitId
    } = body

    if (!name || !address_line1 || !city) {
      return NextResponse.json({ error: 'Name, address, and city are required' }, { status: 400 })
    }

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit ID is required' }, { status: 400 })
    }

    // Get business unit UUID from slug
    const { data: businessUnit, error: buError } = await supabase
      .from('business_units')
      .select('id')
      .eq('slug', businessUnitId)
      .single()

    if (buError || !businessUnit) {
      return NextResponse.json({ error: 'Invalid business unit' }, { status: 400 })
    }

    if (id) {
      // Update existing outlet
      const { data, error } = await supabase
        .from('outlets')
        .update({
          name,
          address_line1,
          address_line2: address_line2 || null,
          city,
          state_province: state_province || null,
          postal_code: postal_code || null,
          country: country || 'USA',
          phone: phone || null,
          email: email || null,
          display_order: display_order || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating outlet:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Create new outlet
      const { data, error } = await supabase
        .from('outlets')
        .insert({
          name,
          address_line1,
          address_line2: address_line2 || null,
          city,
          state_province: state_province || null,
          postal_code: postal_code || null,
          country: country || 'USA',
          phone: phone || null,
          email: email || null,
          display_order: display_order || 0,
          business_unit_id: businessUnit.id,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return NextResponse.json({ error: `Outlet "${name}" already exists` }, { status: 400 })
        }
        console.error('Error creating outlet:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error('Error in POST /api/booking/outlets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove outlet
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    // Check if outlet has rooms
    const { data: rooms } = await supabase
      .from('treatment_rooms')
      .select('id')
      .eq('outlet_id', id)
      .limit(1)

    if (rooms && rooms.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete outlet with existing rooms. Please reassign or delete rooms first.'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('outlets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting outlet:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/outlets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
