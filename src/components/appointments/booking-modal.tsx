'use client'

// ============================================================================
// BOOKING MODAL COMPONENT
// Complete booking flow: Service → Date → Time → Confirm
// ============================================================================

import { useState, useEffect } from 'react'
import { SlotPicker } from './slot-picker'
import WeeklyCalendarPicker from './weekly-calendar-picker'
import type { TimeSlot, AppointmentService } from '@/lib/appointments/types'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  businessUnitId: string
  chatSessionId?: string
  userIdentifier: string
  userName?: string
  userEmail?: string
}

export function BookingModal({
  isOpen,
  onClose,
  businessUnitId,
  chatSessionId,
  userIdentifier,
  userName,
  userEmail
}: BookingModalProps) {
  const [step, setStep] = useState<'service' | 'outlet' | 'staff' | 'datetime' | 'details' | 'confirm'>('service')
  const [services, setServices] = useState<AppointmentService[]>([])
  const [selectedService, setSelectedService] = useState<AppointmentService | null>(null)
  const [outlets, setOutlets] = useState<any[]>([])
  const [selectedOutlet, setSelectedOutlet] = useState<any | null>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null)
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]) // Staff assigned to selected service
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [customerNotes, setCustomerNotes] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchServices()
    }
  }, [isOpen, businessUnitId])

  async function fetchServices() {
    try {
      // Use the API endpoint instead of direct query
      // This handles slug to UUID conversion
      const response = await fetch(`/api/booking/services?businessUnitId=${encodeURIComponent(businessUnitId)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load services')
      }

      const result = await response.json()
      console.log('Services loaded:', result)
      setServices(result.data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching services:', err)
      setError(err.message || 'Failed to load services')
    }
  }

  async function fetchOutlets() {
    try {
      const response = await fetch(`/api/booking/outlets?businessUnitId=${encodeURIComponent(businessUnitId)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load locations')
      }

      const result = await response.json()
      console.log('Outlets loaded:', result)
      setOutlets(result.data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching outlets:', err)
      setError(err.message || 'Failed to load locations')
    }
  }

  async function fetchServiceStaffAssignments(serviceId: string) {
    try {
      const response = await fetch(`/api/booking/assignments?businessUnitId=${encodeURIComponent(businessUnitId)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load staff assignments')
      }

      const result = await response.json()
      console.log('All assignments loaded:', result)

      // Filter assignments for the selected service
      const serviceAssignments = (result.data || []).filter((assignment: any) =>
        assignment.service_id === serviceId && assignment.is_active
      )

      console.log('Assignments for service:', serviceAssignments)
      setAssignedStaff(serviceAssignments)
      setError(null)

      return serviceAssignments
    } catch (err: any) {
      console.error('Error fetching service staff assignments:', err)
      setError(err.message || 'Failed to load staff assignments')
      return []
    }
  }

  async function fetchStaff(outletId: string) {
    try {
      const response = await fetch(`/api/booking/staff?outletId=${encodeURIComponent(outletId)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load staff')
      }

      const result = await response.json()
      console.log('Staff loaded:', result)
      setStaff(result.data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching staff:', err)
      setError(err.message || 'Failed to load staff')
    }
  }

  async function handleBooking() {
    if (!selectedService || !selectedDate || !selectedSlot || !selectedStaff || !selectedOutlet) return

    setLoading(true)
    setError(null)

    try {
      // Calculate start time and duration based on selected slots
      const startTime = selectedSlots.length > 0 ? selectedSlots[0].time : selectedSlot.time
      const durationMinutes = selectedSlots.length > 0
        ? selectedSlots.length * 60
        : selectedService.duration_minutes

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          outletId: selectedOutlet.id,
          // Room will be auto-assigned by the API
          chatSessionId,
          userIdentifier,
          userName,
          userEmail,
          userPhone: customerPhone || undefined,
          appointmentDate: selectedDate,
          startTime: startTime,
          durationMinutes: durationMinutes,
          customerNotes: customerNotes || undefined
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.error('Failed to parse error response')
        }
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const data = await response.json()
      setBookingSuccess(true)
      setStep('confirm')
    } catch (err: any) {
      console.error('Booking error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function resetAndClose() {
    setStep('service')
    setSelectedService(null)
    setSelectedOutlet(null)
    setSelectedStaff(null)
    setAssignedStaff([])
    setSelectedDate('')
    setSelectedSlot(null)
    setSelectedSlots([])
    setCustomerNotes('')
    setCustomerPhone('')
    setBookingSuccess(false)
    setError(null)
    onClose()
  }

  function getMinDate() {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  function getMaxDate() {
    const today = new Date()
    const maxDate = new Date(today.setDate(today.getDate() + 30))
    return maxDate.toISOString().split('T')[0]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {bookingSuccess ? 'Booking Confirmed!' : 'Book Appointment'}
          </h2>
          <button
            onClick={resetAndClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Select Service */}
          {step === 'service' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Select a Service</h3>
              <div className="grid gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={async () => {
                      setSelectedService(service)
                      setError(null)

                      // Check service-staff assignments
                      const assignments = await fetchServiceStaffAssignments(service.id)

                      if (assignments.length === 0) {
                        // No staff assigned - show error
                        setError('No staff is assigned to this service yet. Please contact support.')
                        return
                      }

                      // Fetch outlets
                      await fetchOutlets()

                      // If only one staff assigned, auto-select and skip staff selection step
                      if (assignments.length === 1) {
                        const staffMember = assignments[0].staff
                        setSelectedStaff(staffMember)
                        console.log('Auto-selected staff:', staffMember)
                      }

                      setStep('outlet')
                    }}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{service.duration_minutes} minutes</p>
                      </div>
                      {service.price && (
                        <span className="text-lg font-bold text-gray-900">
                          ${service.price}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Outlet/Location */}
          {step === 'outlet' && selectedService && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('service')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Service
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Service</h3>
                <p className="text-gray-700">{selectedService.name}</p>
                <p className="text-sm text-gray-500">{selectedService.duration_minutes} minutes</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Location</h3>
                <div className="grid gap-4">
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={async () => {
                        setSelectedOutlet(outlet)
                        setError(null)

                        // If staff already selected (auto-selected), skip to date selection
                        if (selectedStaff) {
                          console.log('Staff already selected, skipping staff selection step')
                          setStep('datetime')
                        } else {
                          // Multiple staff assigned, show staff selection
                          await fetchStaff(outlet.id)
                          setStep('staff')
                        }
                      }}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <h4 className="font-semibold text-gray-900">{outlet.name}</h4>
                      {outlet.address && (
                        <p className="text-sm text-gray-600 mt-1">{outlet.address}</p>
                      )}
                      {outlet.city && (
                        <p className="text-xs text-gray-500 mt-1">{outlet.city}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Staff */}
          {step === 'staff' && selectedService && selectedOutlet && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('outlet')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Location
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected</h3>
                <p className="text-gray-700">{selectedService.name}</p>
                <p className="text-sm text-gray-500">at {selectedOutlet.name}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Staff Member</h3>
                <div className="grid gap-4">
                  {(() => {
                    // Filter staff to only show those assigned to this service
                    const assignedStaffIds = assignedStaff.map(a => a.staff_id)
                    const availableStaff = staff.filter(s => assignedStaffIds.includes(s.id))

                    if (availableStaff.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          No assigned staff available at this location
                        </div>
                      )
                    }

                    return availableStaff.map((staffMember) => (
                      <button
                        key={staffMember.id}
                        onClick={() => {
                          setSelectedStaff(staffMember)
                          setStep('datetime')
                        }}
                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <h4 className="font-semibold text-gray-900">{staffMember.name}</h4>
                        {staffMember.specialization && (
                          <p className="text-sm text-gray-600 mt-1">{staffMember.specialization}</p>
                        )}
                      </button>
                    ))
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Select Date & Time (Weekly Calendar) */}
          {step === 'datetime' && selectedService && selectedStaff && selectedOutlet && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('staff')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Staff
              </button>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Details</h3>
                <p className="text-gray-700">{selectedService.name}</p>
                <p className="text-sm text-gray-500">{selectedService.duration_minutes} minutes</p>
                <p className="text-sm text-gray-600 mt-1">at {selectedOutlet.name}</p>
                <p className="text-sm text-gray-600">with {selectedStaff.name}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Date & Time</h3>
                <WeeklyCalendarPicker
                  businessUnitId={businessUnitId}
                  serviceId={selectedService.id}
                  staffId={selectedStaff.id}
                  outletId={selectedOutlet.id}
                  onSlotSelect={(date, slot) => {
                    setSelectedDate(date)
                    setSelectedSlot(slot)
                  }}
                  onSlotsChange={(date, slots) => {
                    setSelectedDate(date)
                    setSelectedSlots(slots)
                    if (slots.length > 0) {
                      setSelectedSlot(slots[0])
                    }
                  }}
                  selectedDate={selectedDate}
                  selectedTime={selectedSlot?.time}
                />
              </div>
              {selectedDate && selectedSlot && (
                <button
                  onClick={() => setStep('details')}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
                >
                  Continue to Details
                </button>
              )}
            </div>
          )}

          {/* Step 6: Additional Details */}
          {step === 'details' && selectedService && selectedDate && selectedSlot && selectedStaff && selectedOutlet && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('datetime')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Date/Time
              </button>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                <p className="text-sm text-gray-700"><strong>Service:</strong> {selectedService.name}</p>
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Time:</strong> {selectedSlots.length > 0 ? (
                    selectedSlots.length === 1 ? (
                      `${selectedSlots[0].time} - ${(() => {
                        const [hour] = selectedSlots[0].time.split(':').map(Number)
                        return `${(hour + 1).toString().padStart(2, '0')}:00`
                      })()}`
                    ) : (
                      `${selectedSlots[0].time} - ${(() => {
                        const lastSlot = selectedSlots[selectedSlots.length - 1]
                        const [hour] = lastSlot.time.split(':').map(Number)
                        return `${(hour + 1).toString().padStart(2, '0')}:00`
                      })()} (${selectedSlots.length} hours)`
                    )
                  ) : selectedSlot.time}
                </p>
                <p className="text-sm text-gray-700"><strong>Location:</strong> {selectedOutlet.name}</p>
                <p className="text-sm text-gray-700"><strong>Staff:</strong> {selectedStaff.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          )}

          {/* Step 7: Confirmation */}
          {step === 'confirm' && bookingSuccess && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-green-600">Booking Confirmed!</h3>
              <p className="text-gray-700">
                Your appointment has been successfully booked.
              </p>
              <div className="bg-green-50 p-4 rounded-lg text-left">
                <p className="text-sm text-gray-700"><strong>Service:</strong> {selectedService?.name}</p>
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong> {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </p>
                <p className="text-sm text-gray-700"><strong>Time:</strong> {selectedSlot?.time}</p>
                <p className="text-sm text-gray-700"><strong>Location:</strong> {selectedOutlet?.name}</p>
                <p className="text-sm text-gray-700"><strong>Staff:</strong> {selectedStaff?.name}</p>
              </div>
              <p className="text-sm text-gray-600">
                You will receive a confirmation notification soon. A room will be assigned for your appointment.
              </p>
              <button
                onClick={resetAndClose}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
