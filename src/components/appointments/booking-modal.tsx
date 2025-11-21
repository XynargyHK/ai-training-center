'use client'

// ============================================================================
// BOOKING MODAL COMPONENT
// Complete booking flow: Service → Date → Time → Confirm
// ============================================================================

import { useState, useEffect } from 'react'
import { SlotPicker } from './slot-picker'
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
  const [step, setStep] = useState<'service' | 'date' | 'time' | 'details' | 'confirm'>('service')
  const [services, setServices] = useState<AppointmentService[]>([])
  const [selectedService, setSelectedService] = useState<AppointmentService | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
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
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('appointment_services')
        .select('*')
        .eq('business_unit_id', businessUnitId)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      console.error('Error fetching services:', err)
      setError('Failed to load services')
    }
  }

  async function handleBooking() {
    if (!selectedService || !selectedDate || !selectedSlot) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          serviceId: selectedService.id,
          staffId: selectedSlot.staffId,
          roomId: selectedSlot.roomId,
          chatSessionId,
          userIdentifier,
          userName,
          userEmail,
          userPhone: customerPhone || undefined,
          appointmentDate: selectedDate,
          startTime: selectedSlot.time,
          customerNotes: customerNotes || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
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
    setSelectedDate('')
    setSelectedSlot(null)
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
                    onClick={() => {
                      setSelectedService(service)
                      setStep('date')
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

          {/* Step 2: Select Date */}
          {step === 'date' && selectedService && (
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Date</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={() => setStep('time')}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
                >
                  Continue to Select Time
                </button>
              )}
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === 'time' && selectedService && selectedDate && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('date')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Date
              </button>
              <div>
                <p className="text-sm text-gray-600">
                  {selectedService.name} on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <SlotPicker
                businessUnitId={businessUnitId}
                serviceId={selectedService.id}
                selectedDate={selectedDate}
                onSlotSelect={setSelectedSlot}
                selectedSlot={selectedSlot || undefined}
              />
              {selectedSlot && (
                <button
                  onClick={() => setStep('details')}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
                >
                  Continue to Details
                </button>
              )}
            </div>
          )}

          {/* Step 4: Additional Details */}
          {step === 'details' && selectedService && selectedDate && selectedSlot && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('time')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Time
              </button>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                <p className="text-sm text-gray-700">{selectedService.name}</p>
                <p className="text-sm text-gray-700">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-700">{selectedSlot.time}</p>
                {selectedSlot.staffName && (
                  <p className="text-xs text-gray-600 mt-1">Provider: {selectedSlot.staffName}</p>
                )}
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

          {/* Step 5: Confirmation */}
          {step === 'confirm' && bookingSuccess && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-green-600">Booking Confirmed!</h3>
              <p className="text-gray-700">
                Your appointment has been successfully booked.
              </p>
              <div className="bg-green-50 p-4 rounded-lg text-left">
                <p className="text-sm text-gray-700"><strong>Service:</strong> {selectedService?.name}</p>
                <p className="text-sm text-gray-700"><strong>Date:</strong> {selectedDate}</p>
                <p className="text-sm text-gray-700"><strong>Time:</strong> {selectedSlot?.time}</p>
                {selectedSlot?.staffName && (
                  <p className="text-sm text-gray-700"><strong>Provider:</strong> {selectedSlot.staffName}</p>
                )}
              </div>
              <p className="text-sm text-gray-600">
                You will receive a confirmation notification soon.
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
