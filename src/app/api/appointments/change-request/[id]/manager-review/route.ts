// ============================================================================
// MANAGER REVIEW API FOR CHANGE REQUESTS
// POST: Manager approves or rejects change request
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ManagerReviewPayload } from '@/lib/appointments/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const payload: ManagerReviewPayload = await request.json()

    // Validate required fields
    if (typeof payload.approved !== 'boolean' || !payload.managerIdentifier) {
      return NextResponse.json(
        { error: 'Missing required fields: approved, managerIdentifier' },
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
    if (changeRequest.status !== 'pending_manager_approval') {
      return NextResponse.json(
        { error: `Cannot review request with status: ${changeRequest.status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = payload.approved ? 'manager_approved' : 'manager_rejected'

    // Update change request with manager decision
    const { data: updatedRequest, error: updateError } = await supabase
      .from('appointment_change_requests')
      .update({
        status: newStatus,
        manager_approved_at: now,
        manager_approved_by: payload.managerIdentifier,
        manager_notes: payload.managerNotes || null,
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
        changed_by_type: 'manager',
        changed_by_identifier: payload.managerIdentifier,
        reason: payload.approved ? 'Manager approved change request' : 'Manager rejected change request',
        notes: payload.managerNotes || null,
        old_values: { status: changeRequest.status },
        new_values: { status: newStatus }
      })

    // Handle approved requests
    if (payload.approved) {
      // If approved, move to pending client confirmation
      await supabase
        .from('appointment_change_requests')
        .update({
          status: 'pending_client_confirmation'
        })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        changeRequest: updatedRequest,
        message: 'Change request approved. Awaiting client confirmation.',
        nextStep: 'client_confirmation'
      })
    } else {
      // If rejected, restore appointment to confirmed status
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
        nextStep: 'none'
      })
    }

  } catch (error) {
    console.error('Error in manager review:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
