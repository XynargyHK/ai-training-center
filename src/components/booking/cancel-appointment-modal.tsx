'use client'

// ============================================================================
// CANCEL APPOINTMENT MODAL
// Used by staff to request appointment cancellation
// ============================================================================

import { useState } from 'react'
import type { Appointment, AppointmentService } from '@/lib/appointments/types'
import { getTranslation, Language } from '@/lib/translations'

interface CancelAppointmentModalProps {
  appointment: Appointment & {
    service: AppointmentService | null
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  language?: Language
}

export default function CancelAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
  language = 'en'
}: CancelAppointmentModalProps) {
  const t = getTranslation(language)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!reason.trim()) {
        alert('Please provide a reason for cancellation')
        setLoading(false)
        return
      }

      const payload = {
        appointmentId: appointment.id,
        requestType: 'cancel' as const,
        staffId: appointment.real_staff_id!,
        reason: reason.trim()
      }

      const response = await fetch('/api/appointments/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create cancellation request')
      }

      alert('Cancellation request submitted successfully! Awaiting manager approval.')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting cancellation request:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit cancellation request')
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
            <h2 className="text-2xl font-bold text-gray-900">{t.cancelAppointment}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Appointment Details */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-red-900 mb-2">{t.appointmentToCancel}</h3>
              <p className="text-sm text-red-800">{t.service}: {appointment.service?.name}</p>
              <p className="text-sm text-red-800">{t.date}: {new Date(appointment.appointment_date).toLocaleDateString()}</p>
              <p className="text-sm text-red-800">{t.time}: {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</p>
              <p className="text-sm text-red-800">{t.client}: {appointment.user_name || appointment.user_identifier}</p>
              {appointment.user_email && (
                <p className="text-sm text-red-800">{t.email}: {appointment.user_email}</p>
              )}
              {appointment.user_phone && (
                <p className="text-sm text-red-800">{t.phone}: {appointment.user_phone}</p>
              )}
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.reasonForCancellation} *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.cancellationPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={4}
                required
              />
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ {t.importantNotice}
              </p>
              <p className="text-sm text-yellow-700">
                {t.cancellationWarning}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? t.submitting : t.submitCancellationRequest}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t.keepAppointment}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
