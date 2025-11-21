'use client'

// ============================================================================
// BOOKING MANAGEMENT DASHBOARD (Staff View)
// Route: /booking
// Features: Calendar view, block time, confirm/edit/cancel appointments
// ============================================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentService, TreatmentRoom } from '@/lib/appointments/types'

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

  // Fetch business unit (skincoach)
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
    fetchBusinessUnit()
  }, [])

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

      const { data, error } = await supabase
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
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
      } else {
        setAppointments(data || [])
      }

      setLoading(false)
    }

    fetchAppointments()
  }, [businessUnitId, selectedDate, viewMode])

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

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending_edit': return 'bg-orange-100 text-orange-800'
      case 'pending_cancellation': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Booking Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage appointments and availability</p>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Today
            </button>
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
            </select>
          </div>
        </div>

        {/* Appointments List */}
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
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
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
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                              Confirm
                            </button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                              Decline
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                              Edit
                            </button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
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

        {/* Block Time Section */}
        <div className="bg-white rounded-lg shadow mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Block Time</h2>
          <p className="text-gray-600 mb-4">
            Block specific time slots for holidays, breaks, or personal time
          </p>
          <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Add Blocked Time
          </button>
        </div>
      </div>
    </div>
  )
}
