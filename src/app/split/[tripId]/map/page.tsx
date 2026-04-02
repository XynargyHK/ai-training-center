'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Member = { id: string; name: string; phone: string | null }
type Location = { member_id: string; lat: number; lng: number; updated_at: string }

export default function TripMapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})

  const [trip, setTrip] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [myMemberId, setMyMemberId] = useState('')
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const watchRef = useRef<number | null>(null)

  // Load trip data
  const loadData = useCallback(async () => {
    const { data: t } = await supabase.from('split_trips').select('*').eq('slug', tripId).single()
    if (!t) { setLoading(false); return }
    setTrip(t)

    const { data: m } = await supabase.from('split_members').select('*').eq('trip_id', t.id).order('created_at')
    setMembers(m || [])

    const memberIds = (m || []).map(x => x.id)
    if (memberIds.length > 0) {
      const { data: locs } = await supabase.from('split_member_locations').select('*').in('member_id', memberIds)
      setLocations(locs || [])
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => { loadData() }, [loadData])

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=initMap`
    script.async = true
    ;(window as any).initMap = () => {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 22.28, lng: 114.15 }, // Hong Kong default
        zoom: 14,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8888aa' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a1f' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      })
      googleMapRef.current = map
    }
    // If no API key, use a simple fallback
    if (!script.src.includes('key=&')) {
      document.head.appendChild(script)
    }
  }, [loading])

  // Update markers when locations change
  useEffect(() => {
    if (!googleMapRef.current) return
    const map = googleMapRef.current
    const google = (window as any).google

    locations.forEach(loc => {
      const member = members.find(m => m.id === loc.member_id)
      if (!member) return

      if (markersRef.current[loc.member_id]) {
        markersRef.current[loc.member_id].setPosition({ lat: loc.lat, lng: loc.lng })
      } else {
        const marker = new google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map,
          title: member.name,
          label: { text: member.name[0], color: '#fff', fontWeight: 'bold' },
        })
        markersRef.current[loc.member_id] = marker
      }
    })

    // Fit bounds to all markers
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }))
      map.fitBounds(bounds, 50)
    }
  }, [locations, members])

  // Supabase realtime subscription
  useEffect(() => {
    if (!trip) return
    const memberIds = members.map(m => m.id)
    if (memberIds.length === 0) return

    const channel = supabase
      .channel('locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'split_member_locations',
      }, (payload: any) => {
        const newLoc = payload.new as Location
        if (memberIds.includes(newLoc.member_id)) {
          setLocations(prev => {
            const filtered = prev.filter(l => l.member_id !== newLoc.member_id)
            return [...filtered, newLoc]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [trip, members])

  // Share my location
  const startSharing = (memberId: string) => {
    setMyMemberId(memberId)
    setSharing(true)

    if (!navigator.geolocation) {
      alert('Geolocation not supported')
      return
    }

    // Immediate update
    navigator.geolocation.getCurrentPosition(
      pos => updateLocation(memberId, pos.coords.latitude, pos.coords.longitude),
      err => console.error('Geo error:', err),
      { enableHighAccuracy: true },
    )

    // Watch position
    watchRef.current = navigator.geolocation.watchPosition(
      pos => updateLocation(memberId, pos.coords.latitude, pos.coords.longitude),
      err => console.error('Watch error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    )
  }

  const stopSharing = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setSharing(false)
  }

  const updateLocation = async (memberId: string, lat: number, lng: number) => {
    await supabase.from('split_member_locations').upsert({
      member_id: memberId,
      lat,
      lng,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id' })
  }

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  if (!trip) return <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#f66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Trip not found</div>

  const timeAgo = (ts: string) => {
    const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (secs < 60) return `${secs}s ago`
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    return `${Math.floor(secs / 3600)}h ago`
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#fff', fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{trip.name}</h1>
          <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0' }}>Live Location</p>
        </div>
        <button onClick={() => router.push(`/split/${tripId}`)}
          style={{ padding: '6px 14px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#aaa', fontSize: '12px', cursor: 'pointer' }}>
          Back
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, minHeight: '400px', background: '#1a1a2e' }}>
        {/* Fallback if no Google Maps API key */}
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          {locations.length > 0 ? locations.map(loc => {
            const m = members.find(x => x.id === loc.member_id)
            return (
              <div key={loc.member_id} style={{ padding: '8px', background: '#12121c', borderRadius: '8px', margin: '8px', display: 'inline-block' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{m?.name || '?'}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</div>
                <div style={{ fontSize: '10px', color: '#4ade80' }}>{timeAgo(loc.updated_at)}</div>
                <a href={`https://uri.amap.com/marker?position=${loc.lng},${loc.lat}&name=${encodeURIComponent(m?.name || '')}`} target="_blank"
                  style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', marginRight: '8px' }}>Amap</a>
                <a href={`https://api.map.baidu.com/marker?location=${loc.lat},${loc.lng}&title=${encodeURIComponent(m?.name || '')}&output=html`} target="_blank"
                  style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', marginRight: '8px' }}>Baidu</a>
                <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank"
                  style={{ fontSize: '11px', color: '#888', textDecoration: 'none' }}>Google</a>
              </div>
            )
          }) : 'No one sharing location yet'}
        </div>
      </div>

      {/* Member list + share toggle */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a2a' }}>
        <h3 style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>SHARE YOUR LOCATION</h3>
        {!sharing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {members.map(m => (
              <button key={m.id} onClick={() => startSharing(m.id)}
                style={{
                  padding: '10px', background: '#12121c', border: '1px solid #1e1e2e',
                  borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer',
                  textAlign: 'left',
                }}>
                I am {m.name}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#4ade80', fontSize: '14px' }}>
              Sharing as {members.find(m => m.id === myMemberId)?.name}...
            </span>
            <button onClick={stopSharing}
              style={{ padding: '8px 16px', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
