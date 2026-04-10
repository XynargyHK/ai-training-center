'use client'

import { useEffect, useRef, useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceApr9WebPage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [transcript, setTranscript] = useState<string[]>([])
  const roomRef = useRef<any>(null)

  async function startBrowserVoice() {
    setStatus('connecting')
    setTranscript([])
    try {
      const res = await fetch(`${PIPECAT_URL}/startapr9web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'en' }),
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

  useEffect(() => {
    return () => {
      if (roomRef.current) roomRef.current.disconnect()
    }
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Apr 9 Web Prototype (06:39 HKT)</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Rebuilt from file-history snapshot <code>bot.py @v19</code> (last edit Apr 9 06:39 HKT).
        Your message at <strong>09:58 HKT</strong>: <em>"now it can use multi lingual much better"</em>.
        STT: Azure zh-HK for Cantonese, Deepgram multi for everything else. LiveKit WebRTC transport.
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Browser Voice</h2>
        <p style={{ fontSize: 14, color: '#666' }}>Talk to AI through your microphone. Try English, Cantonese, Mandarin, Japanese, Korean, French, Spanish, German.</p>
        {status === 'idle' && (
          <button onClick={startBrowserVoice} style={btnStyle}>Start Browser Voice</button>
        )}
        {status === 'connecting' && <p>Connecting...</p>}
        {status === 'connected' && (
          <button onClick={stopBrowserVoice} style={{ ...btnStyle, background: '#dc3545' }}>Stop</button>
        )}
        {status === 'error' && <p style={{ color: 'red' }}>Failed to connect</p>}
        {transcript.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
            {transcript.map((t, i) => <div key={i}>{t}</div>)}
          </div>
        )}
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
