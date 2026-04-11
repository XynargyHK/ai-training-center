'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceDailyPage() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialdaily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang: 'yue' }),
      })
      const data = await res.json()
      if (data.status === 'calling') {
        setCallStatus(`Calling ${phoneNumber}... (mode: ${data.mode}, room: ${data.room_name})`)
      } else {
        setCallStatus(`Failed: ${JSON.stringify(data)}`)
      }
    } catch (e: any) {
      setCallStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Daily SIP Phone Prototype (pre-LiveKit)</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Restored verbatim from <code>bot.py @v18</code> (file-history snapshot Apr 9 05:31 HKT,
        the last bot.py before the LiveKit migration at Apr 9 06:43 HKT).
        Uses <strong>DailyTransport + Daily SIP dialout</strong> via Twilio SIP Domain — the original pre-LiveKit phone path.
        Useful for comparing latency vs the current <code>/voicecantonese</code> LiveKit SIP path.
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call (Daily SIP → Twilio SIP Domain → PSTN)</h2>
        <p style={{ fontSize: 14, color: '#666' }}>
          AI calls your phone in Cantonese using the original Daily-era setup.
        </p>
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
            background: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Call This Number (Daily SIP)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#333' }}>
        <h3 style={{ marginTop: 0 }}>Setup</h3>

        <h4>Files & Endpoints</h4>
        <ul>
          <li><strong>Bot file:</strong> <code>infra/pipecat-agent/bot_phone_daily.py</code> (verbatim from <code>a4ede1f92d7f7a63@v18</code>)</li>
          <li><strong>Endpoint:</strong> <code>POST /dialdaily</code> body <code>{'{to, lang}'}</code></li>
        </ul>

        <h4>Transport — Daily WebRTC + SIP dialout</h4>
        <ul>
          <li><code>DailyTransport</code> with <code>DailyParams(api_key=DAILY_API_KEY, ...)</code></li>
          <li>Server creates Daily room with <code>enable_dialout=True</code></li>
          <li>Server creates Daily owner token (required for dialout)</li>
          <li>Bot joins room → calls <code>transport.start_dialout(sipUri)</code></li>
          <li>SIP URI: <code>sip:+{'{number}'}@{'{TWILIO_SIP_DOMAIN}'}</code> → Twilio SIP Domain → PSTN</li>
        </ul>

        <h4>STT</h4>
        <ul>
          <li><strong>Azure STT</strong> fixed <code>zh-HK</code> for Cantonese (when lang=&quot;yue&quot;)</li>
          <li>Region <code>eastus</code> (Railway env)</li>
        </ul>

        <h4>LLM</h4>
        <ul>
          <li><strong>Gemini 2.0 Flash</strong></li>
        </ul>

        <h4>TTS</h4>
        <ul>
          <li><strong>Azure <code>zh-HK-WanLungNeural</code> (male)</strong> — hardcoded in v18 bot file</li>
          <li>Region <code>eastus</code>, sample rate 24 kHz</li>
        </ul>

        <h4>Pipeline (phone mode)</h4>
        <pre style={{ background: '#fff', padding: 8, borderRadius: 4, fontSize: 11 }}>
{`transport.input()
  → stt (Azure zh-HK)
  → user_aggregator
  → llm (Gemini Flash)
  → reasoning_logger
  → CJKSpaceFixer
  → tts (Azure WanLung)
  → transport.output()
  → assistant_aggregator`}
        </pre>

        <h4>Event handlers (phone mode)</h4>
        <ul>
          <li><code>on_first_participant_joined</code> → calls <code>transport.start_dialout(dialout_settings)</code></li>
          <li><code>on_dialout_answered</code> → triggers Cantonese greeting via <code>LLMRunFrame</code></li>
          <li><code>on_dialout_error</code> → logs error, ends pipeline</li>
        </ul>

        <h4>Env vars consumed</h4>
        <ul>
          <li><code>DAILY_API_KEY</code></li>
          <li><code>AZURE_SPEECH_KEY</code>, <code>AZURE_SPEECH_REGION</code> (default eastus)</li>
          <li><code>GOOGLE_GEMINI_API_KEY</code></li>
          <li><code>TWILIO_SIP_DOMAIN</code> (= aistaffs-voice.sip.twilio.com)</li>
          <li><code>TWILIO_PHONE_NUMBER</code></li>
        </ul>

        <h4>Why test this</h4>
        <p>
          To compare phone latency Daily SIP (this) vs LiveKit SIP (<code>/voicecantonese</code>) directly,
          using the same Cantonese language pair. Daily measured ~2.0–2.8s pre-optimization;
          LiveKit measured ~1.0–1.3s. This page lets you verify on real audio.
        </p>
      </div>
    </div>
  )
}
