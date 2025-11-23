'use client'

// ============================================================================
// BOOKING MANAGEMENT DASHBOARD (Staff View)
// Route: /booking
// Features: Calendar view, block time, confirm/edit/cancel appointments
// ============================================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentService, TreatmentRoom } from '@/lib/appointments/types'
import EditAppointmentModal from '@/components/booking/edit-appointment-modal'
import CancelAppointmentModal from '@/components/booking/cancel-appointment-modal'
import BlockTimeModal from '@/components/booking/block-time-modal'

interface RealStaff {
  id: string
  name: string
  email: string | null
  staff_type: string | null
  avatar_url: string | null
}

interface AppointmentWithDetails extends Appointment {
  service: AppointmentService | null
  staff: RealStaff | null
  room: TreatmentRoom | null
}

export default function BookingDashboard() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessUnitId, setBusinessUnitId] = useState<string | null>(null)
  const [filterStaffId, setFilterStaffId] = useState<string | null>(null)
  const [filterStaffName, setFilterStaffName] = useState<string | null>(null)

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [blockTimeModalOpen, setBlockTimeModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null)

  // Read staff filter from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const staffParam = params.get('staff')
      if (staffParam) {
        setFilterStaffId(staffParam)
      }
    }
  }, [])

  // Fetch business unit and current staff (simplified - in real app, get from auth)
  useEffect(() => {
    async function fetchBusinessUnit() {
      const { data } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', 'skincoach')
        .single()

      if (data) {
        setBusinessUnitId(data.id)
      }
    }

    async function fetchCurrentStaff() {
      // For now, get the first active staff member
      // In production, this would come from auth context
      const { data } = await supabase
        .from('real_staff')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (data) {
        setCurrentStaffId(data.id)
      }
    }

    fetchBusinessUnit()
    fetchCurrentStaff()
  }, [])

  // Fetch staff name when filterStaffId changes
  useEffect(() => {
    if (!filterStaffId) {
      setFilterStaffName(null)
      return
    }

    async function fetchStaffName() {
      const { data } = await supabase
        .from('real_staff')
        .select('name')
        .eq('id', filterStaffId)
        .single()

      if (data) {
        setFilterStaffName(data.name)
      }
    }

    fetchStaffName()
  }, [filterStaffId])

  // Fetch appointments
  useEffect(() => {
    if (!businessUnitId) return

    async function fetchAppointments() {
      setLoading(true)

      // Calculate date range based on view mode
      let dateFrom = new Date(selectedDate)
      let dateTo = new Date(selectedDate)

      if (viewMode === 'day') {
        dateFrom.setHours(0, 0, 0, 0)
        dateTo.setHours(23, 59, 59, 999)
      } else if (viewMode === 'week') {
        const dayOfWeek = dateFrom.getDay()
        dateFrom.setDate(dateFrom.getDate() - dayOfWeek)
        dateTo.setDate(dateFrom.getDate() + 6)
      } else if (viewMode === 'month') {
        dateFrom = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        dateTo = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      }

      const dateFromStr = dateFrom.toISOString().split('T')[0]
      const dateToStr = dateTo.toISOString().split('T')[0]

      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:appointment_services(*),
          staff:real_staff(id, name, email, staff_type, avatar_url),
          room:treatment_rooms(*)
        `)
        .eq('business_unit_id', businessUnitId)
        .gte('appointment_date', dateFromStr)
        .lte('appointment_date', dateToStr)

      // Apply staff filter if present
      if (filterStaffId) {
        query = query.eq('real_staff_id', filterStaffId)
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
      } else {
        console.log('📅 Fetched appointments:', {
          count: data?.length || 0,
          dateRange: `${dateFromStr} to ${dateToStr}`,
          businessUnitId,
          filterStaffId,
          appointments: data
        })
        setAppointments(data || [])
      }

      setLoading(false)
    }

    fetchAppointments()
  }, [businessUnitId, selectedDate, viewMode, filterStaffId])

  // Filter appointments by status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredAppointments(appointments)
    } else {
      setFilteredAppointments(appointments.filter(apt => apt.status === statusFilter))
    }
  }, [appointments, statusFilter])

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setSelectedDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Format date for display
  const formatDateDisplay = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    if (viewMode === 'week') {
      const start = new Date(selectedDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    } else if (viewMode === 'month') {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return selectedDate.toLocaleDateString('en-US', options)
  }

  // Generate time slots for calendar view (1-hour intervals)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  // Generate days for week view
  const generateWeekDays = () => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Get appointments for a specific time slot
  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredAppointments.filter(apt => {
      if (apt.appointment_date !== dateStr) return false
      const startHour = apt.start_time.substring(0, 5)
      return startHour === time
    })
  }

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending_edit': return 'bg-orange-100 text-orange-800'
      case 'pending_cancellation': return 'bg-pink-100 text-pink-800'
      case 'blocked': return 'bg-gray-400 text-gray-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Refresh appointments list
  const refreshAppointments = async () => {
    if (!businessUnitId) return
    setLoading(true)

    let dateFrom = new Date(selectedDate)
    let dateTo = new Date(selectedDate)

    if (viewMode === 'day') {
      dateFrom.setHours(0, 0, 0, 0)
      dateTo.setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      const dayOfWeek = dateFrom.getDay()
      dateFrom.setDate(dateFrom.getDate() - dayOfWeek)
      dateTo.setDate(dateFrom.getDate() + 6)
    } else if (viewMode === 'month') {
      dateFrom = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      dateTo = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = dateTo.toISOString().split('T')[0]

    let query = supabase
      .from('appointments')
      .select(`
        *,
        service:appointment_services(*),
        staff:real_staff(id, name, email, staff_type, avatar_url),
        room:treatment_rooms(*)
      `)
      .eq('business_unit_id', businessUnitId)
      .gte('appointment_date', dateFromStr)
      .lte('appointment_date', dateToStr)

    // Apply staff filter if present
    if (filterStaffId) {
      query = query.eq('real_staff_id', filterStaffId)
    }

    const { data, error } = await query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) {
      setAppointments(data)
    }
    setLoading(false)
  }

  // Confirm appointment
  const handleConfirm = async (appointment: AppointmentWithDetails) => {
    if (!appointment.real_staff_id) {
      alert('No staff assigned to this appointment')
      return
    }

    try {
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          staffId: appointment.real_staff_id,
          confirmed: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm appointment')
      }

      alert('Appointment confirmed successfully!')
      await refreshAppointments()
    } catch (error) {
      console.error('Error confirming appointment:', error)
      alert(error instanceof Error ? error.message : 'Failed to confirm appointment')
    }
  }

  // Decline appointment
  const handleDecline = async (appointment: AppointmentWithDetails) => {
    if (!appointment.real_staff_id) {
      alert('No staff assigned to this appointment')
      return
    }

    const reason = prompt('Please provide a reason for declining:')
    if (!reason) return

    try {
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          staffId: appointment.real_staff_id,
          confirmed: false,
          staffNotes: reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline appointment')
      }

      alert('Appointment declined')
      await refreshAppointments()
    } catch (error) {
      console.error('Error declining appointment:', error)
      alert(error instanceof Error ? error.message : 'Failed to decline appointment')
    }
  }

  // Open edit modal
  const handleEdit = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setEditModalOpen(true)
  }

  // Open cancel modal
  const handleCancel = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setCancelModalOpen(true)
  }

  // Handle modal success
  const handleModalSuccess = () => {
    refreshAppointments()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filterStaffName ? `${filterStaffName}'s Schedule` : 'Booking Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filterStaffName ? `Viewing appointments for ${filterStaffName}` : 'Manage appointments and availability'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {filterStaffId && (
                <a
                  href="/booking"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Filter
                </a>
              )}
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevious}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ← Previous
              </button>
              <div className="text-lg font-semibold min-w-[300px] text-center">
                {formatDateDisplay()}
              </div>
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                Next →
              </button>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_edit">Pending Edit</option>
              <option value="pending_cancellation">Pending Cancellation</option>
              <option value="blocked">Blocked Time</option>
            </select>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'week' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Mobile View - Stack by day */}
            <div className="block lg:hidden">
              {generateWeekDays().map((day, dayIdx) => (
                <div key={dayIdx} className="border-b last:border-b-0">
                  {/* Day Header */}
                  <div className="bg-gray-50 p-3 border-b sticky top-0 z-10">
                    <div className="text-sm font-semibold">{day.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                    <div className="text-xs text-gray-600">{day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>

                  {/* Time Slots for this day */}
                  {generateTimeSlots().map((time) => {
                    const appointments = getAppointmentsForSlot(day, time)
                    if (appointments.length === 0) return null // Hide empty slots on mobile

                    return (
                      <div key={time} className="border-b last:border-b-0">
                        <div className="flex">
                          <div className="w-20 flex-shrink-0 p-2 bg-gray-50 border-r text-xs text-gray-600 font-medium">
                            {time}
                          </div>
                          <div className="flex-1 p-2 space-y-2">
                            {appointments.map((apt) => (
                              <div
                                key={apt.id}
                                onClick={() => {
                                  setSelectedAppointment(apt)
                                  if (apt.status === 'confirmed') setEditModalOpen(true)
                                }}
                                className={`p-3 rounded-lg cursor-pointer hover:opacity-80 ${getStatusColor(apt.status)}`}
                              >
                                <div className="font-semibold">{apt.service?.name}</div>
                                <div className="text-sm mt-1">{apt.user_name}</div>
                                <div className="text-xs mt-1">{apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}</div>
                                {apt.staff && <div className="text-xs mt-1">Staff: {apt.staff.name}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Show message if no appointments for this day */}
                  {generateTimeSlots().every(time => getAppointmentsForSlot(day, time).length === 0) && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No appointments
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View - Grid */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="min-w-[1000px]">
                {/* Week Header */}
                <div className="grid grid-cols-8 border-b">
                  <div className="p-4 bg-gray-50 border-r text-sm font-semibold">Time</div>
                  {generateWeekDays().map((day, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border-r text-center">
                      <div className="text-sm font-semibold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xs text-gray-600">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {generateTimeSlots().map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b hover:bg-gray-50 transition-colors">
                    <div className="p-3 bg-gray-50 border-r text-sm text-gray-600 font-medium">{time}</div>
                    {generateWeekDays().map((day, dayIdx) => {
                      const appointments = getAppointmentsForSlot(day, time)
                      return (
                        <div key={dayIdx} className="border-r min-h-[80px] p-1.5">
                          {appointments.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => {
                                setSelectedAppointment(apt)
                                if (apt.status === 'confirmed') setEditModalOpen(true)
                              }}
                              className={`text-xs p-2 rounded-lg mb-1 cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(apt.status)}`}
                            >
                              <div className="font-semibold truncate">{apt.service?.name}</div>
                              <div className="truncate mt-0.5">{apt.user_name}</div>
                              <div className="text-[10px] mt-0.5">{apt.start_time.substring(0, 5)}-{apt.end_time.substring(0, 5)}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* List View for Day/Month */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Appointments ({filteredAppointments.length})
              </h2>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No appointments found for this period
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                              {appointment.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </span>
                            <span className="text-sm font-medium">
                              {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {appointment.service?.name || 'Unknown Service'}
                          </h3>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Client:</strong> {appointment.user_name || appointment.user_identifier}</p>
                            {appointment.user_email && <p><strong>Email:</strong> {appointment.user_email}</p>}
                            {appointment.user_phone && <p><strong>Phone:</strong> {appointment.user_phone}</p>}
                            {appointment.staff && <p><strong>Staff:</strong> {appointment.staff.name}</p>}
                            {appointment.room && <p><strong>Room:</strong> {appointment.room.room_name || appointment.room.room_number}</p>}
                            {appointment.customer_notes && (
                              <p><strong>Notes:</strong> {appointment.customer_notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(appointment)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleDecline(appointment)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleEdit(appointment)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancel(appointment)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed text-sm" disabled>
                              Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block Time Section */}
        <div className="bg-white rounded-lg shadow mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Block Time</h2>
          <p className="text-gray-600 mb-4">
            Block specific time slots for holidays, breaks, or personal time
          </p>
          <button
            onClick={() => setBlockTimeModalOpen(true)}
            disabled={!currentStaffId || !businessUnitId}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Blocked Time
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedAppointment && (
        <>
          <EditAppointmentModal
            appointment={selectedAppointment}
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedAppointment(null)
            }}
            onSuccess={handleModalSuccess}
          />
          <CancelAppointmentModal
            appointment={selectedAppointment}
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false)
              setSelectedAppointment(null)
            }}
            onSuccess={handleModalSuccess}
          />
        </>
      )}

      {/* Block Time Modal */}
      {businessUnitId && currentStaffId && (
        <BlockTimeModal
          businessUnitId={businessUnitId}
          staffId={currentStaffId}
          isOpen={blockTimeModalOpen}
          onClose={() => setBlockTimeModalOpen(false)}
          onSuccess={() => {
            refreshAppointments()
          }}
        />
      )}
    </div>
  )
}
