'use client'

// ============================================================================
// PROVIDER DASHBOARD
// For beauticians/doctors to view and confirm appointments
// ============================================================================

import { useState, useEffect } from 'react'
import type { Appointment } from '@/lib/appointments/types'

export default function ProviderDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'confirmed' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // NOTE: In production, get this from auth context
  const [businessUnitId] = useState('YOUR_BUSINESS_UNIT_ID') // TODO: Get from auth
  const [staffId] = useState('YOUR_STAFF_ID') // TODO: Get from auth

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  async function fetchAppointments() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        businessUnitId,
        staffId,
        ...(filter !== 'all' && { status: filter })
      })

      const response = await fetch(`/api/appointments?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (err: any) {
      console.error('Error fetching appointments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(appointmentId: string, confirmed: boolean, notes?: string) {
    try {
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          staffId,
          confirmed,
          staffNotes: notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update appointment')
      }

      // Refresh appointments
      await fetchAppointments()

      alert(confirmed ? 'Appointment confirmed!' : 'Appointment declined')
    } catch (err: any) {
      console.error('Error updating appointment:', err)
      alert('Error: ' + err.message)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatTime(timeStr: string) {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your appointments</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  filter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({appointments.filter(a => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  filter === 'confirmed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All
              </button>
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading appointments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Appointments List */}
        {!loading && !error && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">No {filter !== 'all' && filter} appointments found</p>
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Status Badge */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status.toUpperCase()}
                          </span>
                          {appointment.booking_source && (
                            <span className="text-xs text-gray-500">
                              via {appointment.booking_source}
                            </span>
                          )}
                        </div>

                        {/* Service & Date/Time */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {appointment.service?.name || 'Service'}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">📅</span>
                            {formatDate(appointment.appointment_date)} at {formatTime(appointment.start_time)}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-medium">⏱️</span>
                            {appointment.duration_minutes} minutes
                          </p>
                          {appointment.room && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">🏠</span>
                              {appointment.room.room_name || appointment.room.room_number}
                            </p>
                          )}
                        </div>

                        {/* Customer Info */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-1">Customer Details</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>👤 {appointment.user_name || appointment.user_identifier}</p>
                            {appointment.user_email && <p>✉️ {appointment.user_email}</p>}
                            {appointment.user_phone && <p>📞 {appointment.user_phone}</p>}
                          </div>
                        </div>

                        {/* Customer Notes */}
                        {appointment.customer_notes && (
                          <div className="mt-4 bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">Special Requests:</p>
                            <p className="text-sm text-blue-800">{appointment.customer_notes}</p>
                          </div>
                        )}

                        {/* Staff Notes */}
                        {appointment.staff_notes && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">Your Notes:</p>
                            <p className="text-sm text-gray-700">{appointment.staff_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {appointment.status === 'pending' && (
                        <div className="ml-6 flex flex-col gap-2">
                          <button
                            onClick={() => {
                              const notes = prompt('Add any notes (optional):')
                              handleConfirm(appointment.id, true, notes || undefined)
                            }}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium whitespace-nowrap"
                          >
                            ✓ Confirm
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Reason for declining (optional):')
                              if (confirm('Are you sure you want to decline this appointment?')) {
                                handleConfirm(appointment.id, false, notes || undefined)
                              }
                            }}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium whitespace-nowrap"
                          >
                            ✗ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
