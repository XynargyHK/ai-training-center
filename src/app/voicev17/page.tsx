'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceV17Page() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [lang, setLang] = useState('en')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialv17`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang }),
      })
      const data = await res.json()
      if (data.status === 'calling') {
        setCallStatus(`Calling ${phoneNumber}... (call_sid: ${data.call_sid})`)
      } else {
        setCallStatus(`Failed: ${JSON.stringify(data)}`)
      }
    } catch (e: any) {
      setCallStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI v17 — PROVEN Phone Config</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Built from file-history snapshot <code>2c8f54782a175fb3@v17</code> (Apr 9 15:22 HKT) ·
        Twilio Media Streams · Deepgram multi STT (auto-detect ALL languages) · Azure TTS auto-swap voice per detected language · Gemini 2.0 Flash
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call (Twilio Media Streams)</h2>
        <p style={{ fontSize: 14, color: '#666' }}>
          AI calls a phone number. Say anything in any language — STT auto-detects, TTS voice auto-swaps to match.
        </p>

        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Phone number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+85294740952"
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        />

        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Initial greeting language</label>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="en">English (greeting only — STT auto-detects after)</option>
          <option value="yue">Cantonese (greeting only — STT auto-detects after)</option>
        </select>

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
          Call This Number (v17)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: '#f9f9f9', borderRadius: 4, fontSize: 13, color: '#555' }}>
        <strong>v17 spec recap:</strong>
        <ul style={{ marginTop: 8 }}>
          <li>Transport: FastAPIWebsocketTransport + TwilioFrameSerializer (mulaw 8kHz)</li>
          <li>STT: Deepgram multi (HARDCODED — no per-call language switch)</li>
          <li>LLM: Gemini 2.0 Flash</li>
          <li>TTS: Azure with AutoTTSVoiceSwapper (reads TranscriptionFrame.language)</li>
          <li>File: <code>infra/pipecat-agent/phone_bot_v17.py</code> (isolated copy, do not modify)</li>
          <li>Endpoints: <code>/dialv17</code>, <code>/twiml-v17</code>, <code>/ws-v17</code></li>
        </ul>
      </div>
    </div>
  )
}
