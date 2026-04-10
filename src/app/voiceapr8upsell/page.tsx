'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceApr8UpsellPage() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialapr8upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, lang: 'yue' }),
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
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Apr 8 Upsell Phone Prototype</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Rebuilt verbatim from file-history snapshot <code>phone_bot.py @v11</code> (saved Apr 8 11:17 HKT,
        matches git commit <code>664b338</code> &ldquo;feat: add upsell capability to phone bot&rdquo; at Apr 8 11:19 HKT).
        This is the <strong>pre-LiveKit</strong> era — uses Twilio Media Streams directly, no LiveKit SIP involved.
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call (Twilio Media Streams)</h2>
        <p style={{ fontSize: 14, color: '#666' }}>
          AI calls your phone in Cantonese, confirms an appointment with SPA Collection,
          then naturally upsells an add-on service (neck care / oil upgrade / eye treatment / new-client package).
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
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Call This Number (Apr 8 Upsell)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#333' }}>
        <h3 style={{ marginTop: 0 }}>Full Setup (verified against the actual file)</h3>

        <h4>Files &amp; Endpoints</h4>
        <ul>
          <li><strong>Bot file:</strong> <code>infra/pipecat-agent/phone_bot_apr8_upsell.py</code></li>
          <li><strong>Dial endpoint:</strong> <code>POST /dialapr8upsell</code></li>
          <li><strong>TwiML endpoint:</strong> <code>GET /twiml-apr8upsell</code></li>
          <li><strong>WebSocket endpoint:</strong> <code>/ws-apr8upsell</code></li>
          <li><strong>Entry function:</strong> <code>run_phone_bot_fastapi()</code></li>
        </ul>

        <h4>Transport</h4>
        <ul>
          <li><strong>Twilio Programmable Voice + Media Streams</strong> (NOT LiveKit SIP)</li>
          <li><code>FastAPIWebsocketTransport</code> + <code>TwilioFrameSerializer</code></li>
          <li>Raw mulaw 8 kHz, no transcoding — cleanest phone audio</li>
          <li>Flow: Twilio REST API dials number → <code>/twiml-apr8upsell</code> returns <code>&lt;Stream&gt;</code> → opens WebSocket to <code>/ws-apr8upsell</code> → bot joins</li>
        </ul>

        <h4>STT (dual path based on lang param)</h4>
        <ul>
          <li>If <code>lang</code> in {'{en, yue, zh, ja, ko, fr, es, de, vi}'}  → <strong>Azure STT fixed language</strong></li>
          <li>Otherwise → <strong>AutoDetectAzureSTTService</strong> (continuous language ID) with candidates: <code>en-US, zh-HK, zh-CN, vi-VN, ja-JP, ko-KR, fr-FR, es-ES, de-DE</code></li>
          <li>For Cantonese (default on this page) → Azure fixed <code>zh-HK</code>, <code>sample_rate=8000</code>, region <code>eastus</code></li>
        </ul>

        <h4>LLM</h4>
        <ul>
          <li>Default: <strong>Gemini 2.0 Flash</strong> (<code>gemini-2.0-flash</code>) via <code>GoogleLLMService</code></li>
          <li>Optional: set env <code>LLM_PROVIDER=cerebras</code> → Cerebras <code>qwen-3-235b-a22b-instruct-2507</code> (note: Cerebras version ignored some Cantonese instructions in testing)</li>
        </ul>

        <h4>TTS</h4>
        <ul>
          <li><strong>Azure TTS</strong>, <code>sample_rate=8000</code>, region <code>eastus</code></li>
          <li>Voice picked from <code>config/voices.py</code> LANGUAGE_VOICES table based on lang</li>
          <li>For Cantonese → <strong><code>zh-HK-HiuMaanNeural</code> (female)</strong> ← the female voice you asked for</li>
          <li>Chosen once at call start — no live voice swapping</li>
        </ul>

        <h4>Cantonese system prompt highlights</h4>
        <ul>
          <li>Strict Cantonese colloquial rules: 係/嘅/咗/唔 (not 是/的/了/不)</li>
          <li><strong>Absolute English ban</strong> — full substitution table baked in (check=睇吓, OK=好嘅, sorry=唔好意思, appointment=預約, etc.)</li>
          <li>Reason: WanLung/HiuMaan can&apos;t pronounce English words cleanly</li>
          <li>Context: calling to confirm an appointment with SPA Collection</li>
          <li>1–2 sentence replies, natural fillers (嗯/哦/好嘅)</li>
        </ul>

        <h4>Upsell flow (Cantonese, triggered after appointment confirmation)</h4>
        <ol>
          <li>Confirm appointment details first (do not upsell before confirmation)</li>
          <li>Recommend naturally, not pushy — like a friend&apos;s suggestion</li>
          <li>Example line: <em>「順便同你講，而家加配頸部護理有八折優惠，只需要多四百蚊，有冇興趣呀？」</em></li>
          <li>If customer declines → back off, say <em>「冇問題嘅，聽日見！」</em></li>
          <li>If interested → confirm add-on + new total price</li>
        </ol>

        <h4>Upsell catalog in the prompt</h4>
        <ol>
          <li>頸部護理加配 — 原價 HK$500，八折 HK$400</li>
          <li>精油升級 — 加 HK$150</li>
          <li>眼部護理 — 加 HK$200</li>
          <li>新客套餐 — 首次七折</li>
        </ol>

        <h4>Tools available to the LLM (only 3 in this version)</h4>
        <ul>
          <li><code>search_web(query)</code></li>
          <li><code>send_whatsapp(phone, message)</code> — for post-call follow-up</li>
          <li><code>send_email(to, subject, body)</code> — for post-call follow-up</li>
        </ul>

        <h4>Extras baked in</h4>
        <ul>
          <li><strong>STTLatencyMonitor</strong> — forces Azure STT reconnection if TTFB exceeds 3 s (the lagging investigation from Apr 8)</li>
          <li><strong>Unicode escape greetings</strong> — avoids UTF-8 corruption through env vars</li>
          <li><strong>Env-var param passing</strong> (<code>VOICE_LANG_APR8</code>, <code>VOICE_TO_APR8</code>, <code>VOICE_FROM_APR8</code>) — workaround because Twilio strips WebSocket query params</li>
        </ul>

        <h4>Env vars consumed</h4>
        <ul>
          <li><code>AZURE_SPEECH_KEY</code>, <code>AZURE_SPEECH_REGION</code> (default eastus)</li>
          <li><code>GOOGLE_GEMINI_API_KEY</code></li>
          <li><code>LLM_PROVIDER</code> (default gemini), optional <code>CEREBRAS_API_KEY</code> / <code>CEREBRAS_MODEL</code></li>
          <li><code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, <code>TWILIO_PHONE_NUMBER</code></li>
        </ul>
      </div>
    </div>
  )
}
