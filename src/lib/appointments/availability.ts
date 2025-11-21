// ============================================================================
// AVAILABILITY CALCULATION UTILITY
// Core logic for checking staff + room availability
// NOTE: Independent module - does NOT import from chat or other modules
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import type {
  TimeSlot,
  AvailabilityCheckParams,
  AvailabilityCheckResult,
  StaffAvailability,
  Appointment,
  DayOfWeek,
  AppointmentSettings
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert date to day of week (0=Sunday, 6=Saturday)
 */
function getDayOfWeek(dateString: string): DayOfWeek {
  const date = new Date(dateString)
  return date.getDay() as DayOfWeek
}

/**
 * Check if time is within a range
 */
function isTimeInRange(time: string, start: string, end: string): boolean {
  return time >= start && time < end
}

/**
 * Generate hour slots for a given business hours range
 */
function generateHourSlots(openTime: string, closeTime: string, slotDuration: number = 60): string[] {
  const slots: string[] = []
  const [openHour] = openTime.split(':').map(Number)
  const [closeHour] = closeTime.split(':').map(Number)

  for (let hour = openHour; hour < closeHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  return slots
}

/**
 * Get business hours for a specific date
 */
async function getBusinessHours(
  businessUnitId: string,
  date: string
): Promise<{ open: string; close: string } | null> {
  const dayOfWeek = getDayOfWeek(date)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]

  const { data: settings } = await supabase
    .from('business_unit_settings')
    .select('appointments_business_hours')
    .eq('business_unit_id', businessUnitId)
    .single()

  if (!settings?.appointments_business_hours) {
    // Default business hours
    return { open: '09:00', close: '18:00' }
  }

  const dayHours = settings.appointments_business_hours[dayName]

  if (!dayHours?.enabled) {
    return null // Closed on this day
  }

  return {
    open: dayHours.open,
    close: dayHours.close
  }
}

// ============================================================================
// STAFF AVAILABILITY CHECK
// ============================================================================

/**
 * Check if a staff member is available at a specific time
 */
async function isStaffAvailable(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<{ available: boolean; reason?: string }> {
  const dayOfWeek = getDayOfWeek(date)

  // 1. Check staff availability schedule
  const { data: availability } = await supabase
    .from('appointment_staff_availability')
    .select('*')
    .eq('real_staff_id', staffId)
    .or(`specific_date.eq.${date},and(day_of_week.eq.${dayOfWeek},is_recurring.eq.true)`)

  if (!availability || availability.length === 0) {
    return { available: false, reason: 'Staff has no availability schedule for this time' }
  }

  // Check if time falls within any available slot
  const hasAvailableSlot = availability.some((slot: StaffAvailability) => {
    // Check if specific date takes precedence
    if (slot.specific_date === date) {
      return slot.is_available && isTimeInRange(startTime, slot.start_time, slot.end_time)
    }
    // Check recurring weekly schedule
    if (slot.day_of_week === dayOfWeek && slot.is_recurring) {
      // Check if effective dates apply
      if (slot.effective_from && date < slot.effective_from) return false
      if (slot.effective_until && date > slot.effective_until) return false

      return slot.is_available && isTimeInRange(startTime, slot.start_time, slot.end_time)
    }
    return false
  })

  if (!hasAvailableSlot) {
    // Check if it's a blocked slot
    const blockedSlot = availability.find((slot: StaffAvailability) =>
      !slot.is_available &&
      ((slot.specific_date === date) || (slot.day_of_week === dayOfWeek && slot.is_recurring))
    )

    return {
      available: false,
      reason: blockedSlot?.block_reason || 'Staff not available at this time'
    }
  }

  // 2. Check for existing appointments (conflicts)
  let query = supabase
    .from('appointments')
    .select('id, start_time, end_time, status')
    .eq('real_staff_id', staffId)
    .eq('appointment_date', date)
    .not('status', 'in', ['cancelled', 'rescheduled'])

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data: existingAppointments } = await query

  if (existingAppointments && existingAppointments.length > 0) {
    // Check for time conflicts
    const hasConflict = existingAppointments.some((apt: Appointment) => {
      // Appointments overlap if: (start1 < end2) AND (end1 > start2)
      return startTime < apt.end_time && endTime > apt.start_time
    })

    if (hasConflict) {
      return { available: false, reason: 'Staff already has an appointment at this time' }
    }
  }

  return { available: true }
}

// ============================================================================
// ROOM AVAILABILITY CHECK
// ============================================================================

/**
 * Check if a room is available at a specific time
 */
async function isRoomAvailable(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<{ available: boolean; reason?: string }> {
  // 1. Check if room is active
  const { data: room } = await supabase
    .from('treatment_rooms')
    .select('is_active, maintenance_notes')
    .eq('id', roomId)
    .single()

  if (!room?.is_active) {
    return { available: false, reason: room?.maintenance_notes || 'Room not available' }
  }

  // 2. Check for existing bookings
  let query = supabase
    .from('appointments')
    .select('id, start_time, end_time, status')
    .eq('room_id', roomId)
    .eq('appointment_date', date)
    .not('status', 'in', ['cancelled', 'rescheduled'])

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data: existingAppointments } = await query

  if (existingAppointments && existingAppointments.length > 0) {
    const hasConflict = existingAppointments.some((apt: Appointment) => {
      return startTime < apt.end_time && endTime > apt.start_time
    })

    if (hasConflict) {
      return { available: false, reason: 'Room already booked at this time' }
    }
  }

  return { available: true }
}

// ============================================================================
// MAIN AVAILABILITY CHECK
// ============================================================================

/**
 * Check if a specific time slot is available (both staff AND room)
 */
export async function checkAvailability(
  params: AvailabilityCheckParams
): Promise<AvailabilityCheckResult> {
  const { businessUnitId, date, startTime, endTime, staffId, roomId, excludeAppointmentId } = params

  // Must have either staff or room to check
  if (!staffId && !roomId) {
    return { available: false, reason: 'Must specify either staff or room to check' }
  }

  // Check staff availability
  if (staffId) {
    const staffCheck = await isStaffAvailable(staffId, date, startTime, endTime, excludeAppointmentId)
    if (!staffCheck.available) {
      return { available: false, reason: staffCheck.reason }
    }
  }

  // Check room availability
  if (roomId) {
    const roomCheck = await isRoomAvailable(roomId, date, startTime, endTime, excludeAppointmentId)
    if (!roomCheck.available) {
      return { available: false, reason: roomCheck.reason }
    }
  }

  return { available: true }
}

// ============================================================================
// GET AVAILABLE SLOTS FOR A DATE
// ============================================================================

/**
 * Get all available time slots for a given date and service
 * Returns hour-based slots with staff+room combinations
 */
export async function getAvailableSlots(
  businessUnitId: string,
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  // 1. Get business hours for this date
  const businessHours = await getBusinessHours(businessUnitId, date)

  if (!businessHours) {
    return [] // Closed on this day
  }

  // 2. Get service details (duration, room requirements)
  const { data: service } = await supabase
    .from('appointment_services')
    .select('duration_minutes, required_room_type')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (!service) {
    return []
  }

  const duration = service.duration_minutes

  // 3. Get available staff for this service
  const { data: allStaff } = await supabase
    .from('real_staff')
    .select('id, name')
    .eq('business_unit_id', businessUnitId)
    .eq('is_active', true)

  if (!allStaff || allStaff.length === 0) {
    return []
  }

  // 4. Get available rooms (matching service requirements)
  let roomQuery = supabase
    .from('treatment_rooms')
    .select('id, room_name, room_number')
    .eq('business_unit_id', businessUnitId)
    .eq('is_active', true)

  if (service.required_room_type) {
    roomQuery = roomQuery.eq('room_type', service.required_room_type)
  }

  const { data: availableRooms } = await roomQuery

  if (!availableRooms || availableRooms.length === 0) {
    return []
  }

  // 5. Generate time slots
  const slots: TimeSlot[] = []
  const hourSlots = generateHourSlots(businessHours.open, businessHours.close)

  for (const timeSlot of hourSlots) {
    const startTime = `${timeSlot}:00`
    const [hour, minute] = timeSlot.split(':').map(Number)
    const endHour = hour + Math.ceil(duration / 60)
    const endTime = `${endHour.toString().padStart(2, '0')}:00:00`

    // Check if this time is past business hours
    if (endHour > parseInt(businessHours.close.split(':')[0])) {
      slots.push({
        time: timeSlot,
        available: false,
        reason: 'Extends beyond business hours'
      })
      continue
    }

    // Try to find any available staff + room combination
    let foundAvailable = false

    for (const staff of allStaff) {
      if (foundAvailable) break

      for (const room of availableRooms) {
        const result = await checkAvailability({
          businessUnitId,
          date,
          startTime,
          endTime,
          staffId: staff.id,
          roomId: room.id
        })

        if (result.available) {
          slots.push({
            time: timeSlot,
            available: true,
            staffId: staff.id,
            staffName: staff.name,
            roomId: room.id,
            roomName: room.room_name || room.room_number
          })
          foundAvailable = true
          break
        }
      }
    }

    if (!foundAvailable) {
      slots.push({
        time: timeSlot,
        available: false,
        reason: 'No staff or room available'
      })
    }
  }

  return slots
}

// ============================================================================
// AUTO-ASSIGN STAFF AND ROOM
// ============================================================================

/**
 * Automatically assign an available staff member and room for a booking
 */
export async function autoAssignResources(
  businessUnitId: string,
  serviceId: string,
  date: string,
  startTime: string
): Promise<{ staffId: string; roomId: string } | null> {
  const duration = 60 // Default, should fetch from service
  const [hour] = startTime.split(':').map(Number)
  const endHour = hour + Math.ceil(duration / 60)
  const endTime = `${endHour.toString().padStart(2, '0')}:00:00`

  // Get available staff
  const { data: allStaff } = await supabase
    .from('real_staff')
    .select('id')
    .eq('business_unit_id', businessUnitId)
    .eq('is_active', true)

  if (!allStaff || allStaff.length === 0) return null

  // Get available rooms
  const { data: availableRooms } = await supabase
    .from('treatment_rooms')
    .select('id')
    .eq('business_unit_id', businessUnitId)
    .eq('is_active', true)

  if (!availableRooms || availableRooms.length === 0) return null

  // Find first available combination
  for (const staff of allStaff) {
    for (const room of availableRooms) {
      const result = await checkAvailability({
        businessUnitId,
        date,
        startTime: `${startTime}:00`,
        endTime,
        staffId: staff.id,
        roomId: room.id
      })

      if (result.available) {
        return { staffId: staff.id, roomId: room.id }
      }
    }
  }

  return null
}
