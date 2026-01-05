import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load all rooms (optionally filtered by outlet)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const businessUnitSlug = searchParams.get('businessUnitId')
    const outletId = searchParams.get('outletId')

    let query = supabase
      .from('treatment_rooms')
      .select('*')
      .order('room_number')

    if (outletId) {
      // Filter by specific outlet
      query = query.eq('outlet_id', outletId)
    } else if (businessUnitSlug) {
      // Filter by business unit (get all rooms across all outlets)
      const { data: businessUnit, error: buError } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', businessUnitSlug)
        .single()

      if (buError || !businessUnit) {
        // For new business units or invalid slugs, return empty list
        console.log(`Business unit '${businessUnitSlug}' not found, returning empty rooms list`)
        return NextResponse.json({ data: [] })
      }

      query = query.eq('business_unit_id', businessUnit.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading rooms:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/booking/rooms:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update room
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, room_number, room_name, outlet_id, businessUnitId } = body

    if (!room_number) {
      return NextResponse.json({ error: 'Room number is required' }, { status: 400 })
    }

    // Outlet is optional for now (until migration 021 is run)
    // if (!outlet_id) {
    //   return NextResponse.json({ error: 'Outlet is required' }, { status: 400 })
    // }

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
      // Update existing room
      const updateData: any = {
        room_number,
        room_name: room_name || null,
        updated_at: new Date().toISOString()
      }

      // Only include outlet_id if provided (for after migration 021)
      if (outlet_id) {
        updateData.outlet_id = outlet_id
      }

      const { data, error } = await supabase
        .from('treatment_rooms')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating room:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Create new room
      const { data, error } = await supabase
        .from('treatment_rooms')
        .insert({
          room_number,
          room_name: room_name || null,
          business_unit_id: businessUnit.id,
          is_active: true
        })
        .select('*')
        .single()

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return NextResponse.json({ error: `Room number "${room_number}" already exists at this outlet` }, { status: 400 })
        }
        console.error('Error creating room:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error('Error in POST /api/booking/rooms:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove room
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('treatment_rooms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting room:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/rooms:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
