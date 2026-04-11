'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceTelnyxPage() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling via Telnyx...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialtelnyx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang: 'yue' }),
      })
      const data = await res.json()
      if (data.status === 'calling') {
        setCallStatus(`Calling ${phoneNumber}... (call_control_id: ${data.call_control_id})`)
      } else {
        setCallStatus(`Failed: ${JSON.stringify(data)}`)
      }
    } catch (e: any) {
      setCallStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Telnyx Phone Prototype</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Telnyx Call Control API + Telnyx Media Streams (bidirectional WebSocket).
        Raw mulaw 8 kHz audio, no transcoding — Telnyx&apos;s private backbone has Singapore PoP, ~50% cheaper than Twilio.
        Cantonese only (Azure zh-HK STT + Azure WanLung male TTS + Gemini 2.0 Flash).
      </p>

      <div style={{ marginTop: 16, padding: 12, background: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: 4, fontSize: 13 }}>
        <strong>⚠️ Setup needed before this works:</strong>
        <ol style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Buy a Telnyx phone number (US free-tier is fine for outbound)</li>
          <li>Create a Telnyx Voice API Application in the Telnyx portal → Call Control → Applications</li>
          <li>Set these env vars on Railway Pipecat Voice service:
            <ul>
              <li><code>TELNYX_API_KEY</code> (already set)</li>
              <li><code>TELNYX_PHONE_NUMBER</code> (e.g. +1XXXXXXXXXX)</li>
              <li><code>TELNYX_CONNECTION_ID</code> (the Connection ID from the Voice API App)</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call (Telnyx Call Control + Media Streams)</h2>
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
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Call This Number (Telnyx)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#333' }}>
        <h3 style={{ marginTop: 0 }}>Setup</h3>

        <h4>Files & Endpoints</h4>
        <ul>
          <li><strong>Bot file:</strong> <code>infra/pipecat-agent/phone_bot_telnyx.py</code></li>
          <li><strong>Dial endpoint:</strong> <code>POST /dialtelnyx</code> body <code>{'{to, lang}'}</code></li>
          <li><strong>WebSocket endpoint:</strong> <code>/ws-telnyx</code></li>
          <li><strong>Entry function:</strong> <code>run_phone_bot_fastapi()</code></li>
        </ul>

        <h4>Transport — Telnyx Call Control + Media Streams</h4>
        <ul>
          <li>Server POSTs to <code>https://api.telnyx.com/v2/calls</code> with <code>connection_id</code>, <code>to</code>, <code>from</code>, <code>stream_url</code>, <code>stream_track=both_tracks</code>, <code>stream_bidirectional_mode=rtp</code></li>
          <li>Telnyx dials the PSTN number</li>
          <li>When call connects, Telnyx opens a bidirectional WebSocket to <code>stream_url</code> (= <code>wss://railway/ws-telnyx</code>)</li>
          <li>Pipecat <code>FastAPIWebsocketTransport</code> + <code>TelnyxFrameSerializer</code> handles raw mulaw 8 kHz frames in both directions</li>
          <li>No transcoding — same clean audio quality as Twilio Media Streams</li>
        </ul>

        <h4>STT</h4>
        <ul><li>Azure STT fixed <code>zh-HK</code>, sample rate 8000, region eastus</li></ul>

        <h4>LLM</h4>
        <ul><li>Gemini 2.0 Flash (default) or Cerebras (if <code>LLM_PROVIDER=cerebras</code>)</li></ul>

        <h4>TTS</h4>
        <ul><li>Azure <code>zh-HK-WanLungNeural</code> from <code>config/voices.py</code> LANGUAGE_VOICES table</li></ul>

        <h4>Why test this</h4>
        <p>
          Telnyx claims ~50% cheaper than Twilio ($0.007/min vs $0.014/min) and has a Singapore PoP for lower HK latency.
          Compare against <code>/voicedaily</code> (Daily SIP) and <code>/voicecantonese</code> (LiveKit SIP) by making the same Cantonese call on each.
          Same Pipecat pipeline, only the transport differs — so the latency delta is purely the network path.
        </p>

        <h4>Env vars</h4>
        <ul>
          <li><code>TELNYX_API_KEY</code></li>
          <li><code>TELNYX_PHONE_NUMBER</code> — your Telnyx-purchased number</li>
          <li><code>TELNYX_CONNECTION_ID</code> — Voice API Application Connection ID</li>
          <li><code>AZURE_SPEECH_KEY</code>, <code>AZURE_SPEECH_REGION</code></li>
          <li><code>GOOGLE_GEMINI_API_KEY</code></li>
        </ul>
      </div>
    </div>
  )
}
