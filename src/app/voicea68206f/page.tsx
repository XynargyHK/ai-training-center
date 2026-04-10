'use client'

import { useEffect, useRef, useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'
const LANG = 'en'  // LOCKED: commit a68206f - Deepgram multi for ALL languages, 1.5s turn

export default function VoiceA68206fPage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [transcript, setTranscript] = useState<string[]>([])
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [callStatus, setCallStatus] = useState<string>('')
  const roomRef = useRef<any>(null)

  // Browser voice via LiveKit WebRTC
  async function startBrowserVoice() {
    setStatus('connecting')
    setTranscript([])
    try {
      const res = await fetch(`${PIPECAT_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: LANG }),
      })
      const data = await res.json()
      if (!data.token) throw new Error('No token from server')

      const { Room, RoomEvent, Track } = await import('livekit-client')
      const room = new Room()
      roomRef.current = room

      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach()
          audioEl.play().catch(() => {})
          document.body.appendChild(audioEl)
        }
      })

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload))
          if (msg.type === 'stt') setTranscript(t => [...t, `You: ${msg.text}`])
          if (msg.type === 'llm') setTranscript(t => [...t.slice(0, -1), `AI: ${msg.text}`])
        } catch {}
      })

      await room.connect(data.livekit_url, data.token)
      await room.localParticipant.setMicrophoneEnabled(true)
      setStatus('connected')
    } catch (e: any) {
      setStatus('error')
      alert('Browser voice failed: ' + e.message)
    }
  }

  function stopBrowserVoice() {
    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }
    setStatus('idle')
  }

  // Phone call via LiveKit SIP
  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialouta68206f`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang: LANG }),
      })
      const data = await res.json()
      if (data.status === 'calling') {
        setCallStatus(`Calling ${phoneNumber}... (room: ${data.room_name})`)
      } else {
        setCallStatus(`Failed: ${JSON.stringify(data)}`)
      }
    } catch (e: any) {
      setCallStatus(`Error: ${e.message}`)
    }
  }

  useEffect(() => {
    return () => {
      if (roomRef.current) roomRef.current.disconnect()
    }
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI a68206f — User-Approved Multilingual</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Prototype: commit a68206f (user said "i can change languages on the phone") · Deepgram multi for ALL · 1.5s turn · LiveKit
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Browser Voice (LiveKit WebRTC)</h2>
        <p style={{ fontSize: 14, color: '#666' }}>Talk to AI through your microphone</p>
        {status === 'idle' && (
          <button onClick={startBrowserVoice} style={btnStyle}>Start Browser Voice</button>
        )}
        {status === 'connecting' && <p>Connecting...</p>}
        {status === 'connected' && (
          <button onClick={stopBrowserVoice} style={{ ...btnStyle, background: '#dc3545' }}>Stop</button>
        )}
        {status === 'error' && <p style={{ color: 'red' }}>Failed to connect</p>}
        {transcript.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
            {transcript.map((t, i) => <div key={i}>{t}</div>)}
          </div>
        )}
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call (LiveKit SIP)</h2>
        <p style={{ fontSize: 14, color: '#666' }}>AI calls a phone number and speaks Cantonese</p>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+85294740952"
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button onClick={makePhoneCall} style={{ ...btnStyle, background: '#28a745' }}>📞 Call This Number</button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 16,
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
}
