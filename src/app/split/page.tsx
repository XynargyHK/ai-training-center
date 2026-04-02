'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SplitHomePage() {
  const [tripName, setTripName] = useState('')
  const [myName, setMyName] = useState('')
  const [myPhone, setMyPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createTrip = async () => {
    if (!tripName.trim() || !myName.trim()) return
    setLoading(true)
    try {
      const slug = tripName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      const { data: trip, error: tripErr } = await supabase
        .from('split_trips')
        .insert({ name: tripName, slug, created_by_phone: myPhone || null })
        .select()
        .single()

      if (tripErr) throw tripErr

      await supabase
        .from('split_members')
        .insert({ trip_id: trip.id, name: myName, phone: myPhone || null })

      router.push(`/split/${slug}`)
    } catch (err: any) {
      alert('Error: ' + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px',
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Split Bills</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '40px' }}>Share expenses with friends</p>

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#12121c', border: '1px solid #1e1e2e',
        borderRadius: '16px', padding: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Create a Trip</h2>

        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Trip Name</label>
        <input
          value={tripName}
          onChange={e => setTripName(e.target.value)}
          placeholder="e.g. Kyoto Trip 2026"
          style={{
            width: '100%', padding: '12px', background: '#0a0a0f',
            border: '1px solid #2a2a3a', borderRadius: '10px',
            color: '#fff', fontSize: '15px', marginBottom: '16px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Your Name</label>
        <input
          value={myName}
          onChange={e => setMyName(e.target.value)}
          placeholder="e.g. Denny"
          style={{
            width: '100%', padding: '12px', background: '#0a0a0f',
            border: '1px solid #2a2a3a', borderRadius: '10px',
            color: '#fff', fontSize: '15px', marginBottom: '16px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Your Phone (optional)</label>
        <input
          value={myPhone}
          onChange={e => setMyPhone(e.target.value)}
          placeholder="e.g. 85296099766"
          style={{
            width: '100%', padding: '12px', background: '#0a0a0f',
            border: '1px solid #2a2a3a', borderRadius: '10px',
            color: '#fff', fontSize: '15px', marginBottom: '24px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        <button
          onClick={createTrip}
          disabled={loading || !tripName.trim() || !myName.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            border: 'none', background: loading ? '#333' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', fontSize: '16px', fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Trip'}
        </button>
      </div>
    </div>
  )
}
