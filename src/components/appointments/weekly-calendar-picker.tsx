'use client'

import { useState, useEffect } from 'react'
import type { TimeSlot } from '@/lib/appointments/types'
import { getTranslation, Language } from '@/lib/translations'

interface WeeklyCalendarPickerProps {
  businessUnitId: string
  serviceId: string
  staffId: string
  outletId: string
  onSlotSelect: (date: string, slot: TimeSlot) => void
  onSlotsChange?: (date: string, slots: TimeSlot[]) => void
  selectedDate?: string
  selectedTime?: string
  language?: Language
}

interface DaySlots {
  date: string
  dayName: string
  dayNumber: number
  slots: TimeSlot[]
}

export default function WeeklyCalendarPicker({
  businessUnitId,
  serviceId,
  staffId,
  outletId,
  onSlotSelect,
  onSlotsChange,
  language = 'en'
}: WeeklyCalendarPickerProps) {
  const t = getTranslation(language)
  const [weekStart, setWeekStart] = useState<Date>(getStartOfCurrentWeek())
  const [weekData, setWeekData] = useState<DaySlots[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string }[]>([])
  const [selectionStart, setSelectionStart] = useState<{ date: string; time: string } | null>(null)

  // Get start of current week (today)
  function getStartOfCurrentWeek(): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  // Format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get day name
  function getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Get date display (e.g., "25")
  function getDayNumber(date: Date): number {
    return date.getDate()
  }

  // Fetch availability for the entire week (IN PARALLEL for speed)
  async function fetchWeekAvailability() {
    setLoading(true)

    try {
      console.log('🔄 Fetching 7 days in parallel...')
      const startTime = Date.now()

      // Create all 7 fetch promises at once
      const fetchPromises = []
      const dates = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        const dateStr = formatDate(date)
        dates.push({ date: dateStr, dayName: getDayName(date), dayNumber: getDayNumber(date) })

        // Start fetch immediately (don't await yet)
        fetchPromises.push(
          fetch('/api/appointments/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessUnitId,
              serviceId,
              date: dateStr,
              staffId,
              outletId
            })
          })
            .then(async (response) => {
              if (!response.ok) {
                console.error(`Failed to fetch for ${dateStr}:`, response.statusText)
                return { slots: [] }
              }
              return response.json()
            })
            .catch((error) => {
              console.error(`Error fetching ${dateStr}:`, error)
              return { slots: [] }
            })
        )
      }

      // Wait for ALL 7 days to finish at once
      const results = await Promise.all(fetchPromises)

      // Combine dates with results
      const days: DaySlots[] = dates.map((dateInfo, index) => ({
        ...dateInfo,
        slots: results[index]?.slots || []
      }))

      const endTime = Date.now()
      console.log(`✅ Loaded ${days.length} days in ${(endTime - startTime) / 1000}s`)

      setWeekData(days)
    } catch (error) {
      console.error('Error fetching week availability:', error)
      setWeekData([])
    }

    setLoading(false)
  }

  // Load week data when component mounts or week changes
  useEffect(() => {
    if (businessUnitId && serviceId && staffId && outletId) {
      console.log('🔄 Loading weekly calendar...', { businessUnitId, serviceId, staffId, outletId })
      fetchWeekAvailability()
    }
  }, [weekStart, businessUnitId, serviceId, staffId, outletId])

  // Navigate to next week
  function nextWeek() {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + 7)
    setWeekStart(newStart)
  }

  // Handle slot selection (support multi-select on same date)
  function handleSlotClick(date: string, slot: TimeSlot) {
    if (!slot.available) return

    const slotKey = { date, time: slot.time }

    // Check if this slot is already selected
    const isAlreadySelected = selectedSlots.some(
      s => s.date === date && s.time === slot.time
    )

    let newSelectedSlots: { date: string; time: string }[]

    if (isAlreadySelected) {
      // Deselect this slot
      newSelectedSlots = selectedSlots.filter(s => !(s.date === date && s.time === slot.time))
    } else {
      // Check if selecting on a different date - clear previous selection
      if (selectedSlots.length > 0 && selectedSlots[0].date !== date) {
        newSelectedSlots = [slotKey]
      } else {
        // Add to selection (same date)
        newSelectedSlots = [...selectedSlots, slotKey].sort((a, b) => a.time.localeCompare(b.time))
      }
    }

    setSelectedSlots(newSelectedSlots)

    // Notify parent with all selected slots
    if (onSlotsChange && newSelectedSlots.length > 0) {
      // Find all TimeSlot objects for the selected times
      const day = weekData.find(d => d.date === date)
      if (day) {
        const timeSlots = newSelectedSlots
          .map(s => day.slots.find(slot => slot.time === s.time))
          .filter((s): s is TimeSlot => s !== undefined)
        onSlotsChange(date, timeSlots)
      }
    }

    // Notify parent with the first slot (for compatibility)
    onSlotSelect(date, slot)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">{t.loadingAvailability}</p>
        </div>
      </div>
    )
  }

  const today = formatDate(new Date())

  // Get all unique time slots across all days
  const allTimeSlots = Array.from(
    new Set(weekData.flatMap(day => day.slots.map(slot => slot.time)))
  ).sort()

  // Helper to find slot for a specific day and time
  function findSlot(day: DaySlots, time: string): TimeSlot | undefined {
    return day.slots.find(slot => slot.time === time)
  }

  return (
    <div className="space-y-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-300">
        <div className="text-lg font-semibold text-gray-800">
          {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={nextWeek}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium text-sm"
        >
          {t.nextWeek} →
        </button>
      </div>

      {/* Compact Weekly Grid with Time Axis */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        {/* Header Row - Days */}
        <div className="grid grid-cols-8 border-b border-gray-300">
          <div className="p-2 bg-gray-50 border-r border-gray-300"></div>
          {weekData.map((day) => {
            const isToday = today === day.date
            return (
              <div
                key={day.date}
                className={`p-2 text-center font-semibold text-sm border-r border-gray-300 last:border-r-0 ${
                  isToday ? 'bg-blue-500 text-white' : 'bg-blue-50 text-gray-800'
                }`}
              >
                <div className="text-xs uppercase">{day.dayName}</div>
                <div className="text-lg font-bold">{day.dayNumber}</div>
              </div>
            )
          })}
        </div>

        {/* Time Grid with labels on lines */}
        <div className="relative">
          {allTimeSlots.map((time, index) => {
            const nextTime = allTimeSlots[index + 1]

            return (
              <div key={time} className="relative">
                {/* Time Label on the line */}
                <div className="absolute left-0 -top-2 bg-white px-2 text-xs font-medium text-gray-600 z-10">
                  {time}
                </div>

                {/* Appointment Row (from this time to next time) */}
                <div className="grid grid-cols-8 border-b border-gray-200">
                  {/* Empty cell for time column */}
                  <div className="h-12 bg-gray-50 border-r border-gray-300"></div>

                  {/* Day Cells */}
                  {weekData.map((day) => {
                    const slot = findSlot(day, time)
                    const isSelected = selectedSlots.some(s => s.date === day.date && s.time === time)
                    const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0))

                    if (!slot || !slot.available || isPast) {
                      return (
                        <div
                          key={`${day.date}-${time}`}
                          className="h-12 border-r border-gray-200 last:border-r-0 bg-gray-100"
                        ></div>
                      )
                    }

                    return (
                      <button
                        key={`${day.date}-${time}`}
                        onClick={() => handleSlotClick(day.date, slot)}
                        className={`h-12 border-r border-gray-200 last:border-r-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600'
                            : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Final time label at the bottom */}
          {allTimeSlots.length > 0 && (
            <div className="absolute left-0 -bottom-2 bg-white px-2 text-xs font-medium text-gray-600 z-10">
              {(() => {
                const lastTime = allTimeSlots[allTimeSlots.length - 1]
                const [hour] = lastTime.split(':').map(Number)
                return `${(hour + 1).toString().padStart(2, '0')}:00`
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Selected Slots Info */}
      {selectedSlots.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-700">{t.selectedTime}:</div>
          <div className="text-lg font-bold text-blue-900 mt-1">
            {new Date(selectedSlots[0].date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-sm text-blue-800 mt-1">
            {selectedSlots.length === 1 ? (
              <span>{selectedSlots[0].time} - {(() => {
                const [hour] = selectedSlots[0].time.split(':').map(Number)
                return `${(hour + 1).toString().padStart(2, '0')}:00`
              })()}</span>
            ) : (
              <span>
                {selectedSlots[0].time} - {(() => {
                  const lastSlot = selectedSlots[selectedSlots.length - 1]
                  const [hour] = lastSlot.time.split(':').map(Number)
                  return `${(hour + 1).toString().padStart(2, '0')}:00`
                })()}
                {' '}({selectedSlots.length} {t.hours})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
