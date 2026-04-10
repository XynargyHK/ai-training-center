'use client'

import { useState } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

export default function VoiceCantonesePage() {
  const [phoneNumber, setPhoneNumber] = useState('+85294740952')
  const [voice, setVoice] = useState<'HiuMaan' | 'HiuGaai' | 'WanLung'>('HiuMaan')
  const [callStatus, setCallStatus] = useState<string>('')

  async function makePhoneCall() {
    if (!phoneNumber) {
      alert('Enter a phone number')
      return
    }
    setCallStatus('Calling...')
    try {
      const res = await fetch(`${PIPECAT_URL}/dialcantonese`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, voice }),
      })
      const data = await res.json()
      if (data.status === 'calling') {
        setCallStatus(`Calling ${phoneNumber}... (voice: ${data.voice}, room: ${data.room_name})`)
      } else {
        setCallStatus(`Failed: ${JSON.stringify(data)}`)
      }
    } catch (e: any) {
      setCallStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Voice AI — Cantonese Phone (Female + Colloquial Guardrail)</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Forked from the confirmed <code>/voice5922922</code> phone config. Same transport (LiveKit SIP → Twilio SIP Domain → PSTN),
        same STT (Azure zh-HK), same LLM (Gemini 2.0 Flash). Changes:
        <strong> (1)</strong> swap male WanLung for your choice of two Azure female voices;
        <strong> (2)</strong> upgraded Cantonese colloquial guardrail with 20+口語 substitutions and a hard English ban.
      </p>

      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20 }}>
        <h2>Phone Call</h2>

        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Phone number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+85294740952"
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        />

        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Cantonese voice</label>
        <select
          value={voice}
          onChange={e => setVoice(e.target.value as 'HiuMaan' | 'HiuGaai' | 'WanLung')}
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="HiuMaan">HiuMaan (zh-HK-HiuMaanNeural) — female, warm</option>
          <option value="HiuGaai">HiuGaai (zh-HK-HiuGaaiNeural) — female, bright</option>
          <option value="WanLung">WanLung (zh-HK-WanLungNeural) — male</option>
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
          Call This Number (Cantonese Female)
        </button>
        {callStatus && <p style={{ marginTop: 12, fontSize: 14 }}>{callStatus}</p>}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#333' }}>
        <h3 style={{ marginTop: 0 }}>Full Setup</h3>

        <h4>Files & Endpoints</h4>
        <ul>
          <li><strong>Bot file:</strong> <code>infra/pipecat-agent/bot_phone_cantonese.py</code></li>
          <li><strong>Dial endpoint:</strong> <code>POST /dialcantonese</code> body <code>{'{to, voice}'}</code></li>
          <li><strong>Entry:</strong> <code>run_pipeline(lang="yue", mode="phone")</code></li>
        </ul>

        <h4>Transport</h4>
        <ul>
          <li>LiveKit SIP trunk <code>ST_o8KnVKmSW74n</code> → Twilio SIP Domain <code>aistaffs-voice.sip.twilio.com</code> → PSTN</li>
          <li><code>LiveKitTransport</code> with Silero VAD, audio out 24 kHz</li>
        </ul>

        <h4>STT</h4>
        <ul>
          <li><strong>Azure STT</strong> fixed language <code>zh-HK</code>, region <code>eastasia</code> (default)</li>
        </ul>

        <h4>LLM</h4>
        <ul>
          <li><strong>Gemini 2.0 Flash</strong> (<code>gemini-2.0-flash</code>)</li>
        </ul>

        <h4>TTS — selectable voice (3 options)</h4>
        <ul>
          <li><code>zh-HK-HiuMaanNeural</code> — female, warm tone</li>
          <li><code>zh-HK-HiuGaaiNeural</code> — female, bright tone</li>
          <li><code>zh-HK-WanLungNeural</code> — male</li>
          <li>Selection passed via <code>VOICE_CANTONESE_FEMALE</code> env var set by the dial endpoint</li>
          <li>Fallback to HiuMaan if invalid</li>
          <li>Region <code>eastus</code>, sample rate 24 kHz</li>
        </ul>

        <h4>Cantonese colloquial guardrail (in system prompt)</h4>
        <ol>
          <li><strong>20+ written→spoken substitutions:</strong> 係/嘅/咗/唔/咁/而家/點解/點樣/邊度/幾多/睇/食/飲/畀/喺/同/嚟/識 …</li>
          <li><strong>Hard English ban</strong> with full substitution table (check→睇吓, OK→好嘅, sorry→唔好意思, appointment→預約, tomorrow→聽日, etc.)</li>
          <li><strong>Natural 語氣詞:</strong> 嗯/哦/係喎/唉呀/好嘅/冇問題嘅/明白明白/咁</li>
          <li><strong>句尾語氣詞:</strong> 呀/啦/喎/囉/咯/㗎/嘅 — required for realism</li>
          <li><strong>Style rules:</strong> 1–2 sentences max, no markdown/lists/symbols, use 你 not 您</li>
          <li><strong>Pronunciation notes:</strong> 睇下/睇吓, 食飯 (not 吃飯), 少少 (not 一點), etc.</li>
        </ol>

        <h4>What changed vs /voice5922922</h4>
        <ul>
          <li>Voice: male WanLung → selectable female (HiuMaan or HiuGaai)</li>
          <li>Cantonese prompt: ~5 bullet rules → comprehensive guardrail with口語 table, English ban, 語氣詞 examples, pronunciation notes</li>
          <li>Everything else (transport, STT, LLM, pipeline, tools, event handlers) is identical to <code>/voice5922922</code></li>
        </ul>

        <h4>Env vars</h4>
        <ul>
          <li><code>VOICE_CANTONESE_FEMALE</code> (new, set by /dialcantonese)</li>
          <li><code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>, <code>LIVEKIT_API_SECRET</code>, <code>LIVEKIT_SIP_TRUNK_ID</code></li>
          <li><code>AZURE_SPEECH_KEY</code>, <code>AZURE_SPEECH_REGION</code></li>
          <li><code>GOOGLE_GEMINI_API_KEY</code></li>
          <li><code>TWILIO_PHONE_NUMBER</code></li>
        </ul>
      </div>
    </div>
  )
}
