'use client'

// ============================================================================
// BLOCK TIME MODAL
// Used by staff to block availability for holidays, breaks, or personal time
// ============================================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BlockTimeModalProps {
  businessUnitId: string
  staffId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BlockTimeModal({
  businessUnitId,
  staffId,
  isOpen,
  onClose,
  onSuccess
}: BlockTimeModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    blockReason: '',
    isRecurring: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.startDate || !formData.endDate) {
        alert('Please select start and end dates')
        setLoading(false)
        return
      }

      if (!formData.blockReason.trim()) {
        alert('Please provide a reason for blocking this time')
        setLoading(false)
        return
      }

      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (endDate < startDate) {
        alert('End date must be after start date')
        setLoading(false)
        return
      }

      // Create blocked appointments for each date in the range
      const blockedDates: Date[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        blockedDates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Insert blocked appointments (using appointments table with status 'blocked')
      const insertData = blockedDates.map(date => ({
        business_unit_id: businessUnitId,
        real_staff_id: staffId,
        appointment_date: date.toISOString().split('T')[0],
        start_time: `${formData.startTime}:00`,
        end_time: `${formData.endTime}:00`,
        status: 'blocked',
        user_identifier: `blocked_${staffId}_${date.getTime()}`,
        user_name: 'BLOCKED TIME',
        customer_notes: formData.blockReason,
        is_recurring: formData.isRecurring
      }))

      const { error: insertError } = await supabase
        .from('appointments')
        .insert(insertData)

      if (insertError) {
        console.error('Error blocking time:', insertError)
        throw new Error(insertError.message || 'Failed to block time')
      }

      alert(`Successfully blocked ${blockedDates.length} day(s)`)
      onSuccess()
      onClose()

      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        blockReason: '',
        isRecurring: false
      })
    } catch (error) {
      console.error('Error blocking time:', error)
      alert(error instanceof Error ? error.message : 'Failed to block time')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Block Time</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Block Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Blocking *
              </label>
              <textarea
                value={formData.blockReason}
                onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                placeholder="e.g., Vacation, Training, Personal Time Off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
                required
              />
            </div>

            {/* Recurring Option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isRecurring" className="text-sm text-gray-700">
                Recurring (same time every week)
              </label>
            </div>

            {/* Info Message */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                During this blocked time, new appointments cannot be booked.
                Existing appointments are not affected.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Blocking Time...' : 'Block Time'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
