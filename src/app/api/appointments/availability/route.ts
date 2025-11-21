// ============================================================================
// APPOINTMENT AVAILABILITY API
// GET /api/appointments/availability
// Returns available time slots for booking
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/appointments/availability'
import type { AvailabilityRequest, AvailabilityResponse } from '@/lib/appointments/types'

export async function POST(request: NextRequest) {
  try {
    const body: AvailabilityRequest = await request.json()
    const { businessUnitId, serviceId, date } = body

    // Validation
    if (!businessUnitId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: businessUnitId, serviceId, date' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check if date is in the past
    const requestedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      )
    }

    // Get available slots
    const slots = await getAvailableSlots(businessUnitId, serviceId, date)

    const response: AvailabilityResponse = {
      date,
      slots,
      businessHours: {
        open: slots.length > 0 ? slots[0].time : '09:00',
        close: slots.length > 0 ? slots[slots.length - 1].time : '18:00'
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability', details: error.message },
      { status: 500 }
    )
  }
}
