// ============================================================================
// APPOINTMENT BOOKING SYSTEM - TYPE DEFINITIONS
// NOTE: Keep this file independent - do NOT import from chat/ or other modules
// ============================================================================

export type AppointmentStatus =
  | 'pending'      // Waiting for provider confirmation
  | 'confirmed'    // Provider accepted
  | 'completed'    // Service finished
  | 'cancelled'    // Cancelled by user or provider
  | 'no_show'      // User didn't show up
  | 'rescheduled'  // Moved to different time

export type BookingSource = 'chat' | 'admin' | 'api' | 'phone' | 'walk-in'

export type RoomType = 'facial' | 'massage' | 'consultation' | 'general' | string

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sunday, 6=Saturday

// ============================================================================
// DATABASE MODEL TYPES
// ============================================================================

export interface TreatmentRoom {
  id: string
  business_unit_id: string
  room_number: string
  room_name: string | null
  room_type: RoomType | null
  capacity: number
  floor_level: string | null
  equipment: Record<string, any>
  amenities: string[] | null
  is_active: boolean
  maintenance_notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentService {
  id: string
  business_unit_id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
  currency: string
  required_room_type: RoomType | null
  required_equipment: Record<string, any>
  display_order: number
  image_url: string | null
  color_hex: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StaffAvailability {
  id: string
  business_unit_id: string
  real_staff_id: string | null
  day_of_week: DayOfWeek | null
  start_time: string // HH:MM:SS format
  end_time: string   // HH:MM:SS format
  specific_date: string | null // YYYY-MM-DD format
  is_available: boolean
  block_reason: string | null
  preferred_room_ids: string[] | null
  requires_specific_room: boolean
  is_recurring: boolean
  effective_from: string | null
  effective_until: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  business_unit_id: string
  real_staff_id: string | null
  room_id: string | null
  service_id: string | null
  chat_session_id: string | null
  user_identifier: string
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  appointment_date: string // YYYY-MM-DD format
  start_time: string // HH:MM:SS format
  end_time: string   // HH:MM:SS format
  duration_minutes: number
  timezone: string
  status: AppointmentStatus
  booking_source: BookingSource
  confirmation_sent_at: string | null
  reminder_sent_at: string | null
  customer_notes: string | null
  staff_notes: string | null
  cancellation_reason: string | null
  booked_at: string
  confirmed_at: string | null
  cancelled_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface AvailabilityRequest {
  businessUnitId: string
  serviceId: string
  date: string // YYYY-MM-DD
  staffId?: string // Optional: check specific staff
}

export interface TimeSlot {
  time: string // HH:MM format (e.g., "14:00")
  available: boolean
  staffId?: string
  staffName?: string
  roomId?: string
  roomName?: string
  reason?: string // Why not available
}

export interface AvailabilityResponse {
  date: string
  slots: TimeSlot[]
  businessHours: {
    open: string
    close: string
  }
}

export interface BookingRequest {
  businessUnitId: string
  serviceId: string
  staffId?: string // Optional: system auto-assigns if not provided
  roomId?: string  // Optional: system auto-assigns if not provided
  chatSessionId?: string
  userIdentifier: string
  userName?: string
  userEmail?: string
  userPhone?: string
  appointmentDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  customerNotes?: string
  timezone?: string
}

export interface BookingResponse {
  success: boolean
  appointmentId?: string
  appointment?: Appointment & {
    service?: AppointmentService
    staff?: {
      id: string
      name: string
      avatar_url: string | null
    }
    room?: TreatmentRoom
  }
  error?: string
  requiresConfirmation?: boolean
}

export interface ConfirmAppointmentRequest {
  appointmentId: string
  staffId: string // Must be the assigned staff
  confirmed: boolean
  staffNotes?: string
  rescheduleDate?: string
  rescheduleTime?: string
}

// ============================================================================
// UI/FRONTEND TYPES
// ============================================================================

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId?: string // staff or room ID
  status: AppointmentStatus
  appointment: Appointment
  color?: string
}

export interface BookingFormData {
  serviceId: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes: string
}

export interface ProviderDashboardFilters {
  status?: AppointmentStatus[]
  dateFrom?: string
  dateTo?: string
  staffId?: string
  roomId?: string
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface AppointmentSettings {
  enable_appointments: boolean
  appointments_require_confirmation: boolean
  appointments_allow_room_selection: boolean
  appointments_send_reminders: boolean
  appointments_booking_window_days: number
  appointments_business_hours: {
    monday: { open: string; close: string; enabled: boolean }
    tuesday: { open: string; close: string; enabled: boolean }
    wednesday: { open: string; close: string; enabled: boolean }
    thursday: { open: string; close: string; enabled: boolean }
    friday: { open: string; close: string; enabled: boolean }
    saturday: { open: string; close: string; enabled: boolean }
    sunday: { open: string; close: string; enabled: boolean }
  }
  appointments_ui_config: {
    calendar_view: 'day' | 'week' | 'month'
    slot_duration_minutes: number
    show_provider_photos: boolean
    show_prices: boolean
    require_phone: boolean
    require_email: boolean
    allow_cancellation_hours_before: number
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface BusinessHours {
  open: string // HH:MM
  close: string // HH:MM
  enabled: boolean
}

export type WeekSchedule = Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', BusinessHours>

export interface AvailabilityCheckParams {
  businessUnitId: string
  date: string
  startTime: string
  endTime: string
  staffId?: string
  roomId?: string
  excludeAppointmentId?: string // For rescheduling
}

export interface AvailabilityCheckResult {
  available: boolean
  reason?: string
  conflictingAppointment?: Appointment
}
