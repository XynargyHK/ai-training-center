// ============================================================================
// CLIENT CONFIRMATION API FOR CHANGE REQUESTS
// POST: Client confirms or rejects change request
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ClientConfirmPayload } from '@/lib/appointments/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const payload: ClientConfirmPayload = await request.json()

    // Validate required fields
    if (typeof payload.confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required field: confirmed' },
        { status: 400 }
      )
    }

    // Fetch the change request
    const { data: changeRequest, error: fetchError } = await supabase
      .from('appointment_change_requests')
      .select(`
        *,
        appointment:appointments(*)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !changeRequest) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      )
    }

    // Check if request is in correct status
    if (changeRequest.status !== 'pending_client_confirmation') {
      return NextResponse.json(
        { error: `Cannot confirm request with status: ${changeRequest.status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = payload.confirmed ? 'client_confirmed' : 'client_rejected'

    // Update change request with client decision
    const { data: updatedRequest, error: updateError } = await supabase
      .from('appointment_change_requests')
      .update({
        status: newStatus,
        client_confirmed_at: now,
        client_response: payload.clientResponse || null,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating change request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update change request', details: updateError.message },
        { status: 500 }
      )
    }

    // Create history record
    await supabase
      .from('appointment_change_history')
      .insert({
        appointment_id: changeRequest.appointment_id,
        change_request_id: id,
        change_type: 'status_changed',
        changed_by_type: 'client',
        changed_by_identifier: changeRequest.appointment.user_identifier,
        reason: payload.confirmed ? 'Client confirmed change request' : 'Client rejected change request',
        notes: payload.clientResponse || null,
        old_values: { status: changeRequest.status },
        new_values: { status: newStatus }
      })

    // Handle client confirmation
    if (payload.confirmed) {
      // Apply the changes based on request type
      if (changeRequest.request_type === 'cancel') {
        // Cancel the appointment
        const { error: cancelError } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancelled_at: now,
            cancellation_reason: changeRequest.reason,
            updated_at: now
          })
          .eq('id', changeRequest.appointment_id)

        if (cancelError) {
          console.error('Error cancelling appointment:', cancelError)
          return NextResponse.json(
            { error: 'Failed to cancel appointment', details: cancelError.message },
            { status: 500 }
          )
        }

        // Mark request as completed
        await supabase
          .from('appointment_change_requests')
          .update({ status: 'completed' })
          .eq('id', id)

        // Create history record for cancellation
        await supabase
          .from('appointment_change_history')
          .insert({
            appointment_id: changeRequest.appointment_id,
            change_request_id: id,
            change_type: 'cancelled',
            changed_by_type: 'system',
            reason: changeRequest.reason,
            notes: 'Appointment cancelled after client confirmation',
            old_values: { status: 'pending_cancellation' },
            new_values: { status: 'cancelled', cancelled_at: now }
          })

        return NextResponse.json({
          success: true,
          changeRequest: updatedRequest,
          message: 'Appointment successfully cancelled.',
          appointmentStatus: 'cancelled'
        })
      } else if (changeRequest.request_type === 'edit') {
        // Apply the proposed changes
        const updates: any = {
          status: 'confirmed',
          updated_at: now
        }

        if (changeRequest.proposed_date) {
          updates.appointment_date = changeRequest.proposed_date
        }
        if (changeRequest.proposed_start_time) {
          updates.start_time = changeRequest.proposed_start_time
        }
        if (changeRequest.proposed_end_time) {
          updates.end_time = changeRequest.proposed_end_time
        }
        if (changeRequest.proposed_staff_id) {
          updates.real_staff_id = changeRequest.proposed_staff_id
        }
        if (changeRequest.proposed_room_id) {
          updates.room_id = changeRequest.proposed_room_id
        }

        const { error: updateAppointmentError } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', changeRequest.appointment_id)

        if (updateAppointmentError) {
          console.error('Error updating appointment:', updateAppointmentError)
          return NextResponse.json(
            { error: 'Failed to update appointment', details: updateAppointmentError.message },
            { status: 500 }
          )
        }

        // Mark request as completed
        await supabase
          .from('appointment_change_requests')
          .update({ status: 'completed' })
          .eq('id', id)

        // Create history record for edit
        await supabase
          .from('appointment_change_history')
          .insert({
            appointment_id: changeRequest.appointment_id,
            change_request_id: id,
            change_type: 'rescheduled',
            changed_by_type: 'system',
            reason: changeRequest.reason,
            notes: 'Appointment updated after client confirmation',
            old_values: {
              date: changeRequest.appointment.appointment_date,
              start_time: changeRequest.appointment.start_time,
              end_time: changeRequest.appointment.end_time,
              staff_id: changeRequest.appointment.real_staff_id,
              room_id: changeRequest.appointment.room_id
            },
            new_values: updates
          })

        return NextResponse.json({
          success: true,
          changeRequest: updatedRequest,
          message: 'Appointment successfully updated.',
          appointmentStatus: 'confirmed',
          updates
        })
      }
    } else {
      // Client rejected - restore appointment to confirmed status
      await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: now
        })
        .eq('id', changeRequest.appointment_id)

      return NextResponse.json({
        success: true,
        changeRequest: updatedRequest,
        message: 'Change request rejected. Appointment restored to confirmed status.',
        appointmentStatus: 'confirmed'
      })
    }

  } catch (error) {
    console.error('Error in client confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
