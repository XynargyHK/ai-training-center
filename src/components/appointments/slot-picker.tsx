'use client'

// ============================================================================
// SLOT PICKER COMPONENT
// Hour-based grid for selecting appointment time
// Shows available/blocked/booked slots
// ============================================================================

import { useState, useEffect } from 'react'
import type { TimeSlot } from '@/lib/appointments/types'

interface SlotPickerProps {
  businessUnitId: string
  serviceId: string
  selectedDate: string // YYYY-MM-DD
  onSlotSelect: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot
}

export function SlotPicker({
  businessUnitId,
  serviceId,
  selectedDate,
  onSlotSelect,
  selectedSlot
}: SlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailability()
  }, [businessUnitId, serviceId, selectedDate])

  async function fetchAvailability() {
    if (!businessUnitId || !serviceId || !selectedDate) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          serviceId,
          date: selectedDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      setSlots(data.slots || [])
    } catch (err: any) {
      console.error('Error fetching availability:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getSlotClassName(slot: TimeSlot, isSelected: boolean) {
    const baseClasses = 'px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer'

    if (isSelected) {
      return `${baseClasses} bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300`
    }

    if (!slot.available) {
      return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`
    }

    return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading availability...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading slots: {error}</p>
        <button
          onClick={fetchAvailability}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">No appointments available on this date.</p>
        <p className="text-sm text-yellow-600 mt-2">Please select a different date.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Select a Time</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.time === slot.time

          return (
            <button
              key={slot.time}
              onClick={() => slot.available && onSlotSelect(slot)}
              disabled={!slot.available}
              className={getSlotClassName(slot, isSelected)}
              title={slot.available ? `${slot.staffName || 'Staff available'}` : slot.reason}
            >
              {slot.time}
            </button>
          )
        })}
      </div>

      {selectedSlot && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Selected: {selectedSlot.time}
          </p>
          {selectedSlot.staffName && (
            <p className="text-xs text-blue-700 mt-1">
              Provider: {selectedSlot.staffName}
            </p>
          )}
          {selectedSlot.roomName && (
            <p className="text-xs text-blue-700">
              Room: {selectedSlot.roomName}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
