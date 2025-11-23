// ============================================================================
// APPOINTMENT BOOKING API
// POST /api/appointments - Create new booking
// GET /api/appointments - List appointments (with filters)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAvailability, autoAssignResources } from '@/lib/appointments/availability'
import type { BookingRequest, BookingResponse } from '@/lib/appointments/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// POST - Create Appointment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()
    const {
      businessUnitId,
      serviceId,
      staffId,
      roomId,
      outletId,
      chatSessionId,
      userIdentifier,
      userName,
      userEmail,
      userPhone,
      appointmentDate,
      startTime,
      durationMinutes,
      customerNotes,
      timezone = 'UTC'
    } = body

    // Validation
    if (!businessUnitId || !serviceId || !userIdentifier || !appointmentDate || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert business unit slug to UUID if needed
    let businessUnitUuid = businessUnitId
    if (!businessUnitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // It's a slug, convert to UUID
      const { data: bu, error: buError } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', businessUnitId)
        .single()

      if (buError || !bu) {
        return NextResponse.json(
          { error: 'Invalid business unit' },
          { status: 400 }
        )
      }
      businessUnitUuid = bu.id
    }

    // If using new flow, staff is required but room is optional (will be auto-assigned)
    if (outletId && !staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required when outlet is specified' },
        { status: 400 }
      )
    }

    // Get service details for duration
    const { data: service, error: serviceError } = await supabase
      .from('appointment_services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      )
    }

    // Use custom duration if provided, otherwise use service duration
    const duration = durationMinutes || service.duration_minutes

    // Calculate end time
    const [hour, minute] = startTime.split(':').map(Number)
    const endHour = hour + Math.ceil(duration / 60)
    const endMinute = minute + (duration % 60)
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`
    const startTimeFormatted = `${startTime}:00`

    // Auto-assign room if not provided
    let assignedStaffId = staffId
    let assignedRoomId = roomId

    // New flow: Staff is provided, auto-assign room only
    if (staffId && outletId && !roomId) {
      // Call database function to auto-assign room
      const { data: autoAssignedRoom, error: autoAssignError } = await supabase
        .rpc('auto_assign_room', {
          p_outlet_id: outletId,
          p_service_id: serviceId,
          p_appointment_date: appointmentDate,
          p_start_time: startTimeFormatted,
          p_end_time: endTime
        })

      if (autoAssignError || !autoAssignedRoom) {
        console.error('Auto-assign room error:', autoAssignError)
        return NextResponse.json(
          { error: 'No compatible room available at this time. Please select a different time slot.' },
          { status: 409 }
        )
      }

      assignedRoomId = autoAssignedRoom
    }
    // Old flow: Auto-assign both staff and room if not provided
    else if (!staffId || !roomId) {
      const autoAssigned = await autoAssignResources(
        businessUnitUuid,
        serviceId,
        appointmentDate,
        startTime
      )

      if (!autoAssigned) {
        return NextResponse.json(
          { error: 'No staff or room available at this time' },
          { status: 409 }
        )
      }

      assignedStaffId = autoAssigned.staffId
      assignedRoomId = autoAssigned.roomId
    }

    // Final availability check with assigned resources
    const availabilityCheck = await checkAvailability({
      businessUnitId: businessUnitUuid,
      date: appointmentDate,
      startTime: startTimeFormatted,
      endTime,
      staffId: assignedStaffId,
      roomId: assignedRoomId
    })

    if (!availabilityCheck.available) {
      return NextResponse.json(
        { error: 'Time slot no longer available', reason: availabilityCheck.reason },
        { status: 409 }
      )
    }

    // Get appointment settings to determine if confirmation is required
    const { data: settings } = await supabase
      .from('business_unit_settings')
      .select('appointments_require_confirmation')
      .eq('business_unit_id', businessUnitUuid)
      .single()

    const requiresConfirmation = settings?.appointments_require_confirmation ?? true
    const initialStatus = requiresConfirmation ? 'pending' : 'confirmed'

    // Create the appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        business_unit_id: businessUnitUuid,
        real_staff_id: assignedStaffId,
        room_id: assignedRoomId,
        service_id: serviceId,
        chat_session_id: chatSessionId,
        user_identifier: userIdentifier,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        appointment_date: appointmentDate,
        start_time: startTimeFormatted,
        end_time: endTime,
        duration_minutes: duration,
        timezone,
        status: initialStatus,
        customer_notes: customerNotes,
        booking_source: chatSessionId ? 'chat' : 'api',
        booked_at: new Date().toISOString(),
        confirmed_at: requiresConfirmation ? null : new Date().toISOString()
      })
      .select(`
        *,
        service:appointment_services(*),
        staff:real_staff(id, name, avatar_url),
        room:treatment_rooms(*)
      `)
      .single()

    if (createError || !appointment) {
      console.error('Error creating appointment:', createError)
      return NextResponse.json(
        { error: 'Failed to create appointment', details: createError?.message },
        { status: 500 }
      )
    }

    const response: BookingResponse = {
      success: true,
      appointmentId: appointment.id,
      appointment: appointment as any,
      requiresConfirmation
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error in appointment booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking', details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - List Appointments
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userIdentifier = searchParams.get('userIdentifier')

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        service:appointment_services(*),
        staff:real_staff(id, name, avatar_url),
        room:treatment_rooms(*)
      `)
      .eq('business_unit_id', businessUnitId)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (staffId) {
      query = query.eq('real_staff_id', staffId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('appointment_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('appointment_date', dateTo)
    }

    if (userIdentifier) {
      query = query.eq('user_identifier', userIdentifier)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointments: appointments || [] })
  } catch (error: any) {
    console.error('Error in GET appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments', details: error.message },
      { status: 500 }
    )
  }
}
