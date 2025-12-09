// ============================================================================
// APPOINTMENT CHANGE REQUEST API
// POST: Create edit/cancel request (staff)
// GET: List change requests
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateChangeRequestPayload } from '@/lib/appointments/types'

// ============================================================================
// POST: Create Change Request
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const payload: CreateChangeRequestPayload = await request.json()

    // Validate required fields
    if (!payload.appointmentId || !payload.requestType || !payload.staffId || !payload.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, requestType, staffId, reason' },
        { status: 400 }
      )
    }

    // Validate request type
    if (!['edit', 'cancel'].includes(payload.requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type. Must be "edit" or "cancel"' },
        { status: 400 }
      )
    }

    // Fetch the appointment to validate
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', payload.appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if appointment is in a valid state for change requests
    if (!['confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: `Cannot create change request for appointment with status: ${appointment.status}` },
        { status: 400 }
      )
    }

    // Verify staff is assigned to this appointment
    if (appointment.real_staff_id !== payload.staffId) {
      return NextResponse.json(
        { error: 'Staff member is not assigned to this appointment' },
        { status: 403 }
      )
    }

    // For edit requests, validate proposed changes
    if (payload.requestType === 'edit') {
      if (!payload.proposedDate && !payload.proposedStartTime && !payload.proposedStaffId && !payload.proposedRoomId) {
        return NextResponse.json(
          { error: 'Edit request must include at least one proposed change' },
          { status: 400 }
        )
      }
    }

    // Create the change request
    const { data: changeRequest, error: createError } = await supabase
      .from('appointment_change_requests')
      .insert({
        appointment_id: payload.appointmentId,
        business_unit_id: appointment.business_unit_id,
        request_type: payload.requestType,
        requested_by_staff_id: payload.staffId,
        reason: payload.reason,
        proposed_date: payload.proposedDate || null,
        proposed_start_time: payload.proposedStartTime || null,
        proposed_end_time: payload.proposedEndTime || null,
        proposed_staff_id: payload.proposedStaffId || null,
        proposed_room_id: payload.proposedRoomId || null,
        staff_notes: payload.staffNotes || null,
        status: 'pending_manager_approval'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating change request:', createError)
      return NextResponse.json(
        { error: 'Failed to create change request', details: createError.message },
        { status: 500 }
      )
    }

    // Update appointment status
    const newStatus = payload.requestType === 'edit' ? 'pending_edit' : 'pending_cancellation'
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', payload.appointmentId)

    if (updateError) {
      console.error('Error updating appointment status:', updateError)
      // Note: Change request is created but appointment status not updated
    }

    // Create history record
    await supabase
      .from('appointment_change_history')
      .insert({
        appointment_id: payload.appointmentId,
        change_request_id: changeRequest.id,
        change_type: payload.requestType === 'edit' ? 'rescheduled' : 'cancelled',
        changed_by_type: 'staff',
        changed_by_identifier: payload.staffId,
        reason: payload.reason,
        notes: `Change request created by staff`,
        new_values: {
          request_type: payload.requestType,
          proposed_date: payload.proposedDate,
          proposed_start_time: payload.proposedStartTime
        }
      })

    return NextResponse.json({
      success: true,
      changeRequest,
      message: `${payload.requestType === 'edit' ? 'Edit' : 'Cancellation'} request created successfully. Awaiting manager approval.`
    })

  } catch (error) {
    console.error('Error in change request creation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: List Change Requests
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const businessUnitId = searchParams.get('businessUnitId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const appointmentId = searchParams.get('appointmentId')

    let query = supabase
      .from('appointment_change_requests')
      .select(`
        *,
        appointment:appointments(
          id,
          appointment_date,
          start_time,
          end_time,
          user_name,
          user_email,
          user_phone,
          status,
          service:appointment_services(name, duration_minutes),
          staff:real_staff(id, name, email),
          room:treatment_rooms(room_number, room_name)
        ),
        requested_by:real_staff!appointment_change_requests_requested_by_staff_id_fkey(
          id, name, email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    if (staffId) {
      query = query.eq('requested_by_staff_id', staffId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching change requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch change requests', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      changeRequests: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error in change request listing:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
