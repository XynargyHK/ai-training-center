'use client'

// ============================================================================
// BOOKING MANAGEMENT DASHBOARD (Staff View)
// Route: /booking
// Features: Calendar view, block time, confirm/edit/cancel appointments
// Updated: Multi-view with responsive layout
// ============================================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentService, TreatmentRoom } from '@/lib/appointments/types'
import EditAppointmentModal from '@/components/booking/edit-appointment-modal'
import CancelAppointmentModal from '@/components/booking/cancel-appointment-modal'
import BlockTimeModal from '@/components/booking/block-time-modal'
import { getTranslation, Language } from '@/lib/translations'

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

interface BookingDashboardProps {
  language?: Language
}

export default function BookingDashboard({ language = 'en' }: BookingDashboardProps) {
  const t = getTranslation(language)
  const supabase = createClient()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessUnitId, setBusinessUnitId] = useState<string | null>(null)
  const [filterStaffId, setFilterStaffId] = useState<string | null>(null)
  const [filterStaffName, setFilterStaffName] = useState<string | null>(null)

  // Multi-view mode states
  const [groupByMode, setGroupByMode] = useState<'staff' | 'room' | 'service'>('staff')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [allStaff, setAllStaff] = useState<RealStaff[]>([])
  const [allRooms, setAllRooms] = useState<TreatmentRoom[]>([])
  const [allServices, setAllServices] = useState<AppointmentService[]>([])

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
      const { data, error } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', 'skincoach')
        .single()

      if (data) {
        setBusinessUnitId(data.id)
        // Loading will be set to false by fetchAppointments once it runs
      } else {
        console.error('Error fetching business unit:', error)
        setLoading(false) // Stop loading if business unit fetch fails
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

  // Fetch all staff, rooms, and services for multi-select
  useEffect(() => {
    if (!businessUnitId) return

    async function fetchAllData() {
      try {
        // Fetch all staff
        const { data: staffData, error: staffError } = await supabase
          .from('real_staff')
          .select('*')
          .eq('business_unit_id', businessUnitId)
          .eq('is_active', true)
          .order('name')

        if (staffError) {
          console.error('Error fetching staff:', staffError)
        } else if (staffData) {
          setAllStaff(staffData)
        }

        // Fetch all rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('treatment_rooms')
          .select('*')
          .eq('business_unit_id', businessUnitId)
          .eq('is_active', true)
          .order('room_name')

        if (roomsError) {
          console.error('Error fetching rooms:', roomsError)
        } else if (roomsData) {
          setAllRooms(roomsData)
        }

        // Fetch all services
        const { data: servicesData, error: servicesError } = await supabase
          .from('appointment_services')
          .select('*')
          .eq('business_unit_id', businessUnitId)
          .eq('is_active', true)
          .order('name')

        if (servicesError) {
          console.error('Error fetching services:', servicesError)
        } else if (servicesData) {
          setAllServices(servicesData)
        }
      } catch (error) {
        console.error('Error in fetchAllData:', error)
      }
    }

    fetchAllData()
  }, [businessUnitId])

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

  // Get appointments that START at a specific time slot (for rendering once)
  const getAppointmentsStartingAtSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredAppointments.filter(apt => {
      if (apt.appointment_date !== dateStr) return false
      const startHour = apt.start_time.substring(0, 5)
      return startHour === time
    })
  }

  // Calculate how many hours an appointment spans
  const calculateAppointmentHeight = (apt: AppointmentWithDetails) => {
    const startHour = parseInt(apt.start_time.substring(0, 2))
    const startMin = parseInt(apt.start_time.substring(3, 5))
    const endHour = parseInt(apt.end_time.substring(0, 2))
    const endMin = parseInt(apt.end_time.substring(3, 5))

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes

    // Each hour block is 80px (min-h-[80px])
    // Return height in pixels
    return (durationMinutes / 60) * 80
  }

  // Get filtered appointments for a specific staff/room/service
  const getFilteredAppointmentsForItem = (itemId: string) => {
    return filteredAppointments.filter(apt => {
      if (groupByMode === 'staff') {
        return apt.real_staff_id === itemId
      } else if (groupByMode === 'room') {
        return apt.room_id === itemId
      } else if (groupByMode === 'service') {
        return apt.service_id === itemId
      }
      return false
    })
  }

  // Get appointments starting at slot for a specific filtered set
  const getAppointmentsStartingAtSlotForItem = (date: Date, time: string, itemId: string) => {
    const dateStr = date.toISOString().split('T')[0]
    const itemAppointments = getFilteredAppointmentsForItem(itemId)
    return itemAppointments.filter(apt => {
      if (apt.appointment_date !== dateStr) return false
      const startHour = apt.start_time.substring(0, 5)
      return startHour === time
    })
  }

  // Get items to display based on groupByMode and selections
  const getItemsToDisplay = (): Array<{id: string, name: string}> => {
    if (groupByMode === 'staff') {
      if (selectedStaffIds.length > 0) {
        return selectedStaffIds.map(id => {
          const staff = allStaff.find(s => s.id === id)
          return { id, name: staff?.name || 'Unknown Staff' }
        })
      }
      // If no selection, return empty array (don't show any calendars)
      return []
    } else if (groupByMode === 'room') {
      if (selectedRoomIds.length > 0) {
        return selectedRoomIds.map(id => {
          const room = allRooms.find(r => r.id === id)
          return { id, name: room?.room_name || room?.room_number || 'Unknown Room' }
        })
      }
      // If no selection, return empty array (don't show any calendars)
      return []
    } else if (groupByMode === 'service') {
      if (selectedServiceIds.length > 0) {
        return selectedServiceIds.map(id => {
          const service = allServices.find(s => s.id === id)
          return { id, name: service?.name || 'Unknown Service' }
        })
      }
      // If no selection, return empty array (don't show any calendars)
      return []
    }
    return []
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
          <p className="mt-4 text-gray-600">{t.loadingAppointments}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filterStaffName ? `${t.scheduleFor} ${filterStaffName}` : t.bookingDashboard}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filterStaffName ? `${t.viewingAppointmentsFor} ${filterStaffName}` : t.manageAppointmentsAndAvailability}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {filterStaffId && (
                <a
                  href="/booking"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  {t.clearFilter}
                </a>
              )}
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.today}
              </button>
            </div>
          </div>

          {/* View Mode Buttons and Selection */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{t.groupBy}:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setGroupByMode('staff')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    groupByMode === 'staff'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.staff}
                </button>
                <button
                  onClick={() => setGroupByMode('room')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    groupByMode === 'room'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.roomLabel}
                </button>
                <button
                  onClick={() => setGroupByMode('service')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    groupByMode === 'service'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.service}
                </button>
              </div>
            </div>

            {/* Checkbox selection based on groupByMode */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {groupByMode === 'staff' && (
                <>
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t.selectStaff}:</label>
                  <div className="flex gap-4 flex-wrap">
                    {allStaff.map(staff => (
                      <label key={staff.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds([...selectedStaffIds, staff.id])
                            } else {
                              setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{staff.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {groupByMode === 'room' && (
                <>
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t.selectRooms}:</label>
                  <div className="flex gap-4 flex-wrap">
                    {allRooms.map(room => (
                      <label key={room.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoomIds([...selectedRoomIds, room.id])
                            } else {
                              setSelectedRoomIds(selectedRoomIds.filter(id => id !== room.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{room.room_name || room.room_number}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {groupByMode === 'service' && (
                <>
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t.selectServices}:</label>
                  <div className="flex gap-4 flex-wrap">
                    {allServices.map(service => (
                      <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServiceIds([...selectedServiceIds, service.id])
                            } else {
                              setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
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
                ← {t.previous}
              </button>
              <div className="text-lg font-semibold min-w-[300px] text-center">
                {formatDateDisplay()}
              </div>
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {t.next} →
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
                {t.day}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.week}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.month}
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.statusPending}</option>
              <option value="confirmed">{t.statusConfirmed}</option>
              <option value="completed">{t.statusCompleted}</option>
              <option value="cancelled">{t.statusCancelled}</option>
              <option value="pending_edit">{t.statusPendingEdit}</option>
              <option value="pending_cancellation">{t.statusPendingCancellation}</option>
              <option value="blocked">{t.statusBlocked}</option>
            </select>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'week' ? (
          <div className="space-y-6">
            {getItemsToDisplay().length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.noSelectionMade}</h3>
                  <p className="text-gray-500">
                    {groupByMode === 'staff' ? t.pleaseSelectStaff : groupByMode === 'room' ? t.pleaseSelectRoom : t.pleaseSelectService}
                  </p>
                </div>
              </div>
            ) : (
              getItemsToDisplay().map((item, itemIdx) => (
                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Item Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                  <h3 className="text-xl font-bold">
                    {groupByMode === 'staff' && '👨‍⚕️ '}
                    {groupByMode === 'room' && '📍 '}
                    {groupByMode === 'service' && '💆 '}
                    {item.name}
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {getFilteredAppointmentsForItem(item.id).length} {t.appointmentsThisWeek}
                  </p>
                </div>

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
                        const appointments = getAppointmentsStartingAtSlotForItem(day, time, item.id)
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
                                    className={`p-3 rounded-lg cursor-pointer hover:opacity-90 border-2 ${
                                      apt.status === 'pending' ? 'bg-yellow-200 border-yellow-400 text-yellow-900' :
                                      apt.status === 'confirmed' ? 'bg-green-200 border-green-400 text-green-900' :
                                      apt.status === 'completed' ? 'bg-blue-200 border-blue-400 text-blue-900' :
                                      apt.status === 'cancelled' ? 'bg-red-200 border-red-400 text-red-900' :
                                      apt.status === 'blocked' ? 'bg-gray-400 border-gray-600 text-gray-900' :
                                      'bg-orange-200 border-orange-400 text-orange-900'
                                    }`}
                                  >
                                    <div className="font-bold text-base">{apt.service?.name}</div>
                                    <div className="text-sm mt-1 font-medium">👤 {t.client}: {apt.user_name}</div>
                                    <div className="text-sm mt-1 font-medium">🕐 {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}</div>
                                    {apt.staff && <div className="text-xs mt-1">👨‍⚕️ {t.staff}: {apt.staff.name}</div>}
                                    {apt.room && <div className="text-xs mt-1">📍 {t.location}: {apt.room.room_name || apt.room.room_number}</div>}
                                    <div className="text-xs mt-1 font-semibold uppercase">{t.status}: {apt.status}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Show message if no appointments for this day */}
                      {generateTimeSlots().every(time => getAppointmentsStartingAtSlotForItem(day, time, item.id).length === 0) && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {t.noAppointments}
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
                      <div className="p-4 bg-gray-50 border-r text-sm font-semibold">{t.time}</div>
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
                          const appointments = getAppointmentsStartingAtSlotForItem(day, time, item.id)
                          return (
                            <div key={dayIdx} className="border-r min-h-[80px] p-1.5 relative">
                              {appointments.map((apt) => {
                                const heightPx = calculateAppointmentHeight(apt)
                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => {
                                      setSelectedAppointment(apt)
                                      if (apt.status === 'confirmed') setEditModalOpen(true)
                                    }}
                                    style={{ height: `${heightPx}px` }}
                                    className={`absolute inset-x-1.5 top-1.5 text-xs p-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 overflow-hidden ${
                                      apt.status === 'pending' ? 'bg-yellow-200 border-yellow-400 text-yellow-900' :
                                      apt.status === 'confirmed' ? 'bg-green-200 border-green-400 text-green-900' :
                                      apt.status === 'completed' ? 'bg-blue-200 border-blue-400 text-blue-900' :
                                      apt.status === 'cancelled' ? 'bg-red-200 border-red-400 text-red-900' :
                                      apt.status === 'blocked' ? 'bg-gray-400 border-gray-600 text-gray-900' :
                                      'bg-orange-200 border-orange-400 text-orange-900'
                                    }`}
                                  >
                                    <div className="font-bold truncate">{apt.service?.name}</div>
                                    <div className="truncate mt-0.5 font-medium">👤 {apt.user_name}</div>
                                    <div className="text-[10px] mt-0.5 font-semibold">🕐 {apt.start_time.substring(0, 5)}-{apt.end_time.substring(0, 5)}</div>
                                    {apt.room && <div className="text-[10px] mt-0.5 font-semibold">📍 {apt.room.room_name || apt.room.room_number}</div>}
                                    <div className="text-[10px] mt-0.5 font-semibold uppercase">{apt.status}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        ) : (
          /* List View for Day/Month */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t.appointments} ({filteredAppointments.length})
              </h2>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {t.noAppointmentsForPeriod}
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
                            <p><strong>{t.client}:</strong> {appointment.user_name || appointment.user_identifier}</p>
                            {appointment.user_email && <p><strong>{t.email}:</strong> {appointment.user_email}</p>}
                            {appointment.user_phone && <p><strong>{t.phone}:</strong> {appointment.user_phone}</p>}
                            {appointment.staff && <p><strong>{t.staff}:</strong> {appointment.staff.name}</p>}
                            {appointment.room && <p><strong>📍 {t.location}:</strong> {appointment.room.room_name || appointment.room.room_number}</p>}
                            {appointment.customer_notes && (
                              <p><strong>{t.notes}:</strong> {appointment.customer_notes}</p>
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
                                {t.confirm}
                              </button>
                              <button
                                onClick={() => handleDecline(appointment)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                {t.decline}
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleEdit(appointment)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                {t.edit}
                              </button>
                              <button
                                onClick={() => handleCancel(appointment)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                {t.cancel}
                              </button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed text-sm" disabled>
                              {t.statusCompleted}
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
          <h2 className="text-xl font-semibold mb-4">{t.blockTime}</h2>
          <p className="text-gray-600 mb-4">
            {t.blockTimeDescription}
          </p>
          <button
            onClick={() => setBlockTimeModalOpen(true)}
            disabled={!currentStaffId || !businessUnitId}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.addBlockedTime}
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
            language={language}
          />
          <CancelAppointmentModal
            appointment={selectedAppointment}
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false)
              setSelectedAppointment(null)
            }}
            onSuccess={handleModalSuccess}
            language={language}
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
          language={language}
        />
      )}
    </div>
  )
}
