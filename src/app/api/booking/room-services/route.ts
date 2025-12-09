import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load room-service assignments for a room or all rooms
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (roomId) {
      // Get services assigned to a specific room
      const { data, error } = await supabase
        .from('room_services')
        .select(`
          id,
          room_id,
          service_id,
          appointment_services (
            id,
            name,
            description,
            duration_minutes,
            price
          )
        `)
        .eq('room_id', roomId)

      if (error) {
        console.error('Error loading room services:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Get all room-service assignments
      const { data, error } = await supabase
        .from('room_services')
        .select(`
          id,
          room_id,
          service_id,
          treatment_rooms (
            id,
            room_number,
            room_name
          ),
          appointment_services (
            id,
            name
          )
        `)
        .order('room_id')

      if (error) {
        console.error('Error loading all room services:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error('Error in GET /api/booking/room-services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Assign services to a room (replaces all existing assignments)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { roomId, serviceIds } = body

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
    }

    if (!serviceIds || !Array.isArray(serviceIds)) {
      return NextResponse.json({ error: 'Service IDs array is required' }, { status: 400 })
    }

    // Delete existing assignments for this room
    const { error: deleteError } = await supabase
      .from('room_services')
      .delete()
      .eq('room_id', roomId)

    if (deleteError) {
      console.error('Error deleting existing room services:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // If serviceIds is empty, we're done (room can handle any service)
    if (serviceIds.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'Room can now handle any service'
      })
    }

    // Insert new assignments
    const assignments = serviceIds.map(serviceId => ({
      room_id: roomId,
      service_id: serviceId
    }))

    const { data, error: insertError } = await supabase
      .from('room_services')
      .insert(assignments)
      .select(`
        id,
        room_id,
        service_id,
        appointment_services (
          id,
          name,
          description
        )
      `)

    if (insertError) {
      console.error('Error creating room service assignments:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in POST /api/booking/room-services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove a specific room-service assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('room_services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting room service assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/room-services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
