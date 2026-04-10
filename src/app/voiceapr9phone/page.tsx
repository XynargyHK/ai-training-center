'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceApr9PhonePage() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialapr9phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang: 'en' }),
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

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Apr 9 Phone Prototype (14:35 HKT)</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Rebuilt from file-history snapshot <code>bot.py @v25</code> (saved Apr 9 14:35 HKT, ~9 minutes after your 14:26 HKT message:
        <em> "the first one deepgram multi was good, but you left out so much!!!! what about livekit?"</em>).
        STT: Deepgram multi (unconditional auto-detect — no Cantonese split). Transport: LiveKit SIP.
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call</h2>
        <p style={{ fontSize: 14, color: '#666' }}>AI calls your phone. Speak any language — Deepgram multi auto-detects and AI replies.</p>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+85294740952"
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button
          onClick={makePhoneCall}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Call This Number (Apr 9 14:35 Phone)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>
    </div>
  )
}
