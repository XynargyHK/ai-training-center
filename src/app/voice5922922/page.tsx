'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

const CATEGORIES = [
  {
    title: 'Communication',
    skills: [
      { id: 'whatsapp', label: 'WhatsApp', desc: 'Messages, docs, media' },
      { id: 'whatsapp-group', label: 'Group Chat', desc: 'Send to groups' },
      { id: 'call', label: 'Phone', desc: 'AI calls for you' },
      { id: 'email', label: 'Email', desc: 'Send & compose' },
      { id: 'schedule', label: 'Schedule', desc: 'Timed messages' },
    ],
  },
  {
    title: 'Travel & Maps',
    skills: [
      { id: 'map', label: 'Places', desc: 'Find restaurants, shops' },
      { id: 'directions', label: 'Directions', desc: 'A to B navigation' },
      { id: 'weather', label: 'Weather', desc: 'Real-time forecast' },
    ],
  },
  {
    title: 'Productivity',
    skills: [
      { id: 'note', label: 'Notes', desc: 'Voice memos & notes' },
      { id: 'reminder', label: 'Reminders', desc: 'Set timers' },
      { id: 'search', label: 'Search', desc: 'Web research' },
      { id: 'split', label: 'Split Bill', desc: 'Divide expenses' },
    ],
  },
  {
    title: 'Language',
    skills: [
      { id: 'translate', label: 'Translate', desc: 'Real-time interpreter' },
      { id: 'currency', label: 'Currency', desc: 'Live exchange rates' },
    ],
  },
]

const LANGUAGES = [
  { value: 'auto', label: 'Auto-Detect' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '普通话' },
  { value: 'yue', label: '廣東話' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

export default function VoicePage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [sttText, setSttText] = useState('')
  const [llmText, setLlmText] = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [lang, setLang] = useState('en')
  const [visionMode, setVisionMode] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment')
  const roomRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCall = useCallback(async () => {
    setStatus('connecting')
    setSttText('')
    setLlmText('')
    try {
      const { Room, RoomEvent, Track } = await import('livekit-client')

      if (roomRef.current) {
        try { await roomRef.current.disconnect() } catch(e) {}
        roomRef.current = null
      }

      const endpoint = visionMode ? '/start-vision' : '/start'
      const res = await fetch(`${PIPECAT_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, tts_provider: 'azure', tts_voice: '' }),
      })
      const data = await res.json()
      if (data.error) { setStatus('idle'); alert('Error: ' + data.error); return }

      const room = new Room()

      // Handle remote audio (AI voice)
      room.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach()
          el.autoplay = true
          document.body.appendChild(el)
        }
      })

      // Handle data messages (STT/LLM transcripts from bot)
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const d = JSON.parse(new TextDecoder().decode(payload))
          if (d.type === 'stt') setSttText(d.text)
          else if (d.type === 'llm') setLlmText(d.text)
          else if (d.type === 'switch-language' && d.lang) {
            setLang(d.lang); endCall(); setTimeout(() => startCall(), 500)
          }
        } catch(e) {}
      })

      room.on(RoomEvent.Connected, () => setStatus('connected'))
      room.on(RoomEvent.Disconnected, () => {
        setStatus('idle')
        roomRef.current = null
      })

      // Connect to LiveKit room
      await room.connect(data.livekit_url, data.token)

      // Publish microphone
      await room.localParticipant.setMicrophoneEnabled(true)

      // Publish camera if vision mode
      if (visionMode) {
        await room.localParticipant.setCameraEnabled(true)
      }

      roomRef.current = room
    } catch (err: any) {
      console.error('Call failed:', err)
      alert('Call failed: ' + (err?.message || err))
      setStatus('idle')
    }
  }, [lang, visionMode, cameraFacing])

  const toggleCamera = useCallback(async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(newFacing)
  }, [cameraFacing, visionMode])

  const endCall = useCallback(async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }
    } catch(e) {}
    setStatus('idle')
  }, [])

  // Detect active skill from AI response
  useEffect(() => {
    const t = llmText.toLowerCase()
    if (t.includes('whatsapp') && t.includes('group')) setActiveSkill('whatsapp-group')
    else if (t.includes('whatsapp') || t.includes('sent message')) setActiveSkill('whatsapp')
    else if (t.includes('schedule') || t.includes('scheduled')) setActiveSkill('schedule')
    else if (t.includes('split') || t.includes('per person') || t.includes('each person')) setActiveSkill('split')
    else if (t.includes('direction') || t.includes('route')) setActiveSkill('directions')
    else if (t.includes('map') || t.includes('restaurant') || t.includes('place')) setActiveSkill('map')
    else if (t.includes('weather') || t.includes('temperature') || t.includes('rain')) setActiveSkill('weather')
    else if (t.includes('convert') || t.includes('dollar') || t.includes('currency') || t.includes('exchange')) setActiveSkill('currency')
    else if (t.includes('search') || t.includes('found') || t.includes('result')) setActiveSkill('search')
    else if (t.includes('note') || t.includes('memo')) setActiveSkill('note')
    else if (t.includes('remind') || t.includes('timer')) setActiveSkill('reminder')
    else if (t.includes('translat')) setActiveSkill('translate')
    else if (t.includes('call') || t.includes('phone') || t.includes('dial')) setActiveSkill('call')
    else if (t.includes('email')) setActiveSkill('email')
    else setActiveSkill(null)
  }, [llmText])

  const isActive = (id: string) => activeSkill === id

  return (
    <>
      {/* LiveKit client loaded dynamically via import() */}
      <div className="voice-root">
        <div className="voice-layout">
          {/* Left / Top: Controls + Skills */}
          <div className="voice-panel-left">
            {/* Header */}
            <div className="voice-header">
              <div>
                <h1>{visionMode ? 'AI Vision + Voice' : 'AI Voice Assistant'}</h1>
                <p className="subtitle">Powered by AI Staffs</p>
              </div>
              <div className="header-controls">
                <button
                  onClick={() => setVisionMode(!visionMode)}
                  disabled={status !== 'idle'}
                  className={`btn-vision ${visionMode ? 'active' : ''}`}
                >
                  {visionMode ? 'Vision ON' : 'Vision'}
                </button>
                {!visionMode && (
                  <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    disabled={status !== 'idle'}
                    className="lang-select"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Camera Preview (Vision Mode) */}
            {visionMode && (
              <div className="camera-preview">
                <video ref={videoRef} autoPlay playsInline muted
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
                    display: status === 'connected' ? 'block' : 'none',
                  }} />
                {status !== 'connected' && (
                  <div className="camera-placeholder">Camera will activate when call starts</div>
                )}
                {status === 'connected' && (
                  <button onClick={toggleCamera} className="btn-flip-camera">Flip</button>
                )}
                {status === 'connected' && llmText && (
                  <div className="camera-subtitle">{llmText}</div>
                )}
              </div>
            )}

            {/* Skill Categories */}
            <div className="skills-grid" style={{ display: visionMode && status === 'connected' ? 'none' : undefined }}>
              {CATEGORIES.map(cat => (
                <div key={cat.title} className="skill-category">
                  <div className="category-title">{cat.title}</div>
                  <div className="skill-chips">
                    {cat.skills.map(skill => (
                      <div key={skill.id} className={`skill-chip ${isActive(skill.id) ? 'active' : ''}`}>
                        <div className="skill-label">{skill.label}</div>
                        <div className="skill-desc">{skill.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right / Bottom: Mic + Transcripts */}
          <div className="voice-panel-right">
            {/* Mic Button */}
            <div className="mic-area">
              {status === 'connected' && <div className="pulse-ring" />}
              <button
                onClick={status === 'idle' ? startCall : endCall}
                disabled={status === 'connecting'}
                className={`mic-btn ${status}`}
              >
                {status === 'idle' ? 'Start' : status === 'connecting' ? '...' : 'End'}
              </button>
              <div className={`mic-status ${status}`}>
                {status === 'idle' ? 'Tap to start' : status === 'connecting' ? 'Connecting...' : 'Listening...'}
              </div>
            </div>

            {/* Transcripts */}
            <div className="transcripts">
              <div className="transcript-box user">
                <div className="transcript-label">You</div>
                <div className="transcript-text">{sttText || '...'}</div>
              </div>
              <div className="transcript-box ai">
                <div className="transcript-label">AI</div>
                <div className="transcript-text">{llmText || '...'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { margin: 0; background: #0a0a0f; }

        .voice-root {
          min-height: 100dvh;
          background: #0a0a0f;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 20px;
        }

        /* Desktop: side by side. Mobile: stacked */
        .voice-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .voice-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .voice-root { padding: 12px 12px env(safe-area-inset-bottom); }
        }

        .voice-panel-left { min-width: 0; }

        .voice-panel-right {
          position: sticky;
          top: 20px;
        }
        @media (max-width: 768px) {
          .voice-panel-right { position: static; }
        }

        /* Header */
        .voice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .voice-header h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
        }
        .subtitle {
          font-size: 11px;
          color: #555;
          margin: 2px 0 0;
        }
        .header-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-vision {
          padding: 6px 14px;
          background: #1a1a24;
          color: #aaa;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-vision.active {
          background: #1a3a1a;
          color: #4ade80;
          border-color: #2a5a2a;
        }
        .lang-select {
          padding: 6px 10px;
          background: #1a1a24;
          color: #aaa;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          font-size: 12px;
          outline: none;
        }

        /* Camera */
        .camera-preview {
          position: relative;
          margin-bottom: 16px;
          border-radius: 16px;
          overflow: hidden;
          background: #111;
          aspect-ratio: 16/9;
          border: 1px solid #2a2a3a;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .camera-placeholder {
          color: #555;
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }
        .btn-flip-camera {
          position: absolute;
          bottom: 12px;
          right: 12px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .camera-subtitle {
          position: absolute;
          bottom: 50px;
          left: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: #fff;
          backdrop-filter: blur(4px);
          max-height: 80px;
          overflow: hidden;
        }

        /* Skills */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        @media (max-width: 768px) {
          .skills-grid { grid-template-columns: 1fr; }
        }

        .skill-category { margin-bottom: 4px; }
        .category-title {
          font-size: 12px;
          color: #555;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .skill-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill-chip {
          background: #12121c;
          border: 1px solid #1e1e2e;
          border-radius: 10px;
          padding: 10px 14px;
          transition: all 0.3s;
          min-width: 100px;
        }
        .skill-chip.active {
          background: #1a2a4a;
          border-color: #3b82f6;
          box-shadow: 0 0 12px rgba(59,130,246,0.15);
        }
        .skill-label {
          font-size: 13px;
          font-weight: 600;
          color: #ccc;
        }
        .skill-chip.active .skill-label { color: #fff; }
        .skill-desc {
          font-size: 10px;
          color: #555;
          margin-top: 2px;
        }

        /* Mic area */
        .mic-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          position: relative;
        }
        .pulse-ring {
          position: absolute;
          top: 0;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(59,130,246,0.15);
          animation: pulse 2s ease-in-out infinite;
        }
        .mic-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
          transition: all 0.3s;
          cursor: pointer;
          color: #fff;
        }
        .mic-btn.idle {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 4px 15px rgba(37,99,235,0.3);
        }
        .mic-btn.connecting {
          background: #333;
          cursor: wait;
        }
        .mic-btn.connected {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 0 25px rgba(220,38,38,0.3);
        }
        .mic-status {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 500;
          color: #555;
        }
        .mic-status.connected { color: #4ade80; }

        /* Transcripts */
        .transcripts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .transcript-box {
          border-radius: 10px;
          padding: 12px;
          min-height: 60px;
        }
        .transcript-box.user {
          background: #0a1a0a;
          border: 1px solid #1a2a1a;
        }
        .transcript-box.ai {
          background: #0a0a1a;
          border: 1px solid #1a1a2a;
        }
        .transcript-label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .transcript-box.user .transcript-label { color: #4a8; }
        .transcript-box.ai .transcript-label { color: #88f; }
        .transcript-text {
          font-size: 13px;
          line-height: 1.4;
        }
        .transcript-box.user .transcript-text { color: #afa; }
        .transcript-box.ai .transcript-text { color: #ccf; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }

        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </>
  )
}
