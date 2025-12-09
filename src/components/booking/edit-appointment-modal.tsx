'use client'

// ============================================================================
// EDIT APPOINTMENT MODAL
// Used by staff to request changes to confirmed appointments
// ============================================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentService, TreatmentRoom } from '@/lib/appointments/types'
import { getTranslation, Language } from '@/lib/translations'

interface RealStaff {
  id: string
  name: string
  email: string | null
  staff_type: string | null
}

interface EditAppointmentModalProps {
  appointment: Appointment & {
    service: AppointmentService | null
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  language?: Language
}

export default function EditAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
  language = 'en'
}: EditAppointmentModalProps) {
  const t = getTranslation(language)
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<RealStaff[]>([])
  const [availableRooms, setAvailableRooms] = useState<TreatmentRoom[]>([])

  const [formData, setFormData] = useState({
    date: appointment.appointment_date,
    startTime: appointment.start_time.substring(0, 5),
    endTime: appointment.end_time.substring(0, 5),
    staffId: appointment.real_staff_id || '',
    roomId: appointment.room_id || '',
    reason: ''
  })

  // Fetch available staff and rooms
  useEffect(() => {
    if (!isOpen) return

    async function fetchData() {
      // Fetch staff
      const { data: staff } = await supabase
        .from('real_staff')
        .select('id, name, email, staff_type')
        .eq('business_unit_id', appointment.business_unit_id)
        .eq('is_active', true)

      if (staff) setAvailableStaff(staff)

      // Fetch rooms
      const { data: rooms } = await supabase
        .from('treatment_rooms')
        .select('*')
        .eq('business_unit_id', appointment.business_unit_id)
        .eq('is_active', true)

      if (rooms) setAvailableRooms(rooms)
    }

    fetchData()
  }, [isOpen, appointment.business_unit_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if any changes were made
      const hasChanges =
        formData.date !== appointment.appointment_date ||
        formData.startTime !== appointment.start_time.substring(0, 5) ||
        formData.staffId !== appointment.real_staff_id ||
        formData.roomId !== appointment.room_id

      if (!hasChanges) {
        alert('No changes detected')
        setLoading(false)
        return
      }

      if (!formData.reason.trim()) {
        alert('Please provide a reason for the change')
        setLoading(false)
        return
      }

      const payload = {
        appointmentId: appointment.id,
        requestType: 'edit' as const,
        staffId: appointment.real_staff_id!,
        reason: formData.reason,
        proposedDate: formData.date !== appointment.appointment_date ? formData.date : undefined,
        proposedStartTime: formData.startTime !== appointment.start_time.substring(0, 5) ? `${formData.startTime}:00` : undefined,
        proposedEndTime: formData.endTime !== appointment.end_time.substring(0, 5) ? `${formData.endTime}:00` : undefined,
        proposedStaffId: formData.staffId !== appointment.real_staff_id ? formData.staffId : undefined,
        proposedRoomId: formData.roomId !== appointment.room_id ? formData.roomId : undefined
      }

      const response = await fetch('/api/appointments/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create change request')
      }

      alert('Edit request submitted successfully! Awaiting manager approval.')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting edit request:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit edit request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t.editAppointment}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t.currentDetails}</h3>
              <p className="text-sm text-gray-600">{t.service}: {appointment.service?.name}</p>
              <p className="text-sm text-gray-600">{t.date}: {new Date(appointment.appointment_date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">{t.time}: {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</p>
              <p className="text-sm text-gray-600">{t.client}: {appointment.user_name || appointment.user_identifier}</p>
            </div>

            {/* New Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.newDate}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* New Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startTime}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endTime}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.assignedStaff}
              </label>
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.selectStaffOption}</option>
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} {staff.staff_type ? `(${staff.staff_type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.treatmentRoom}
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.selectRoomOption}</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name || room.room_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.reasonForChange} *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t.reasonPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {t.editRequestInfo}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t.submitting : t.submitEditRequest}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
