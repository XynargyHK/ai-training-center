// ============================================================================
// APPOINTMENT CONFIRMATION API (Provider Side)
// POST /api/appointments/confirm
// Allows providers to confirm or decline appointments
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ConfirmAppointmentRequest } from '@/lib/appointments/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmAppointmentRequest = await request.json()
    const { appointmentId, staffId, confirmed, staffNotes, rescheduleDate, rescheduleTime } = body

    if (!appointmentId || !staffId) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, staffId' },
        { status: 400 }
      )
    }

    // Get the appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify the staff member is assigned to this appointment
    if (appointment.real_staff_id !== staffId) {
      return NextResponse.json(
        { error: 'Not authorized to modify this appointment' },
        { status: 403 }
      )
    }

    // Can only confirm pending appointments
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot confirm appointment with status: ${appointment.status}` },
        { status: 400 }
      )
    }

    // Update appointment based on confirmation
    const updateData: any = {
      staff_notes: staffNotes || appointment.staff_notes
    }

    if (confirmed) {
      updateData.status = 'confirmed'
      updateData.confirmed_at = new Date().toISOString()
    } else {
      updateData.status = 'cancelled'
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancellation_reason = staffNotes || 'Declined by provider'
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        service:appointment_services(*),
        staff:real_staff(id, name, avatar_url),
        room:treatment_rooms(*)
      `)
      .single()

    if (updateError || !updatedAppointment) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment', details: updateError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: confirmed ? 'Appointment confirmed' : 'Appointment declined'
    })
  } catch (error: any) {
    console.error('Error in appointment confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to process confirmation', details: error.message },
      { status: 500 }
    )
  }
}
