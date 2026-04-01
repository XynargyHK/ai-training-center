'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

const CATEGORIES = [
  {
    title: 'Communication',
    icon: '📞',
    skills: [
      { id: 'whatsapp', icon: '💬', label: 'WhatsApp', desc: 'Messages, docs, media' },
      { id: 'call', icon: '📞', label: 'Phone', desc: 'AI calls for you' },
      { id: 'email', icon: '📧', label: 'Email', desc: 'Send & compose' },
    ],
  },
  {
    title: 'Travel & Maps',
    icon: '🗺️',
    skills: [
      { id: 'map', icon: '🗺️', label: 'Places', desc: 'Find restaurants, shops' },
      { id: 'directions', icon: '🧭', label: 'Directions', desc: 'A to B navigation' },
      { id: 'weather', icon: '🌤️', label: 'Weather', desc: 'Real-time forecast' },
    ],
  },
  {
    title: 'Productivity',
    icon: '📊',
    skills: [
      { id: 'note', icon: '📝', label: 'Notes', desc: 'Voice memos & notes' },
      { id: 'reminder', icon: '⏰', label: 'Reminders', desc: 'Set timers' },
      { id: 'search', icon: '🔍', label: 'Search', desc: 'Web research' },
    ],
  },
  {
    title: 'Language',
    icon: '🌐',
    skills: [
      { id: 'translate', icon: '🌐', label: 'Translate', desc: 'Real-time interpreter' },
      { id: 'currency', icon: '💱', label: 'Currency', desc: 'Live exchange rates' },
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

declare const DailyIframe: any

export default function VoicePage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [sttText, setSttText] = useState('')
  const [llmText, setLlmText] = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [lang, setLang] = useState('en')
  const [visionMode, setVisionMode] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment')
  const [dailyLoaded, setDailyLoaded] = useState(false)
  const callRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCall = useCallback(async () => {
    if (!dailyLoaded) return
    setStatus('connecting')
    setSttText('')
    setLlmText('')
    try {
      // For vision mode: request camera permission FIRST (required on Safari iOS)
      if (visionMode) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: true
          })
          // Show preview immediately
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
          // Stop the tracks — Daily will create its own
          stream.getTracks().forEach(t => t.stop())
        } catch (permErr) {
          console.error('Camera permission denied:', permErr)
          setStatus('idle')
          return
        }
      }

      const endpoint = visionMode ? '/start-vision' : '/start'
      const res = await fetch(`${PIPECAT_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, tts_provider: 'azure', tts_voice: '' }),
      })
      const data = await res.json()
      if (data.error) { setStatus('idle'); return }

      if (callRef.current) {
        try { await callRef.current.leave() } catch(e) {}
        try { callRef.current.destroy() } catch(e) {}
      }

      const co = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: visionMode ? { facingMode: cameraFacing } : false,
        subscribeToTracksAutomatically: true,
      })
      co.on('track-started', (e: any) => {
        if (e.track.kind === 'audio' && !e.participant.local) {
          const a = new Audio(); a.srcObject = new MediaStream([e.track]); a.autoplay = true; a.play().catch(() => {})
        }
        // Show local camera preview
        if (e.track.kind === 'video' && e.participant.local && videoRef.current) {
          videoRef.current.srcObject = new MediaStream([e.track])
          videoRef.current.play().catch(() => {})
        }
      })
      co.on('app-message', (e: any) => {
        const d = e.data; if (!d?.type) return
        if (d.type === 'stt') setSttText(d.text)
        else if (d.type === 'llm') setLlmText(d.text)
        else if (d.type === 'switch-language' && d.lang) {
          setLang(d.lang); endCall(); setTimeout(() => startCall(), 500)
        }
      })
      co.on('joined-meeting', () => setStatus('connected'))
      co.on('left-meeting', () => { setStatus('idle'); callRef.current = null })
      await co.join({ url: data.room_url })
      callRef.current = co
    } catch { setStatus('idle') }
  }, [dailyLoaded, lang, visionMode, cameraFacing])

  const toggleCamera = useCallback(async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(newFacing)
    if (callRef.current && visionMode) {
      await callRef.current.setInputDevicesAsync({ videoSource: { facingMode: newFacing } })
    }
  }, [cameraFacing, visionMode])

  const endCall = useCallback(async () => {
    if (callRef.current) { await callRef.current.leave(); callRef.current.destroy(); callRef.current = null }
    setStatus('idle')
  }, [])

  // Detect active skill
  useEffect(() => {
    const t = llmText.toLowerCase()
    if (t.includes('whatsapp') || t.includes('sent message')) setActiveSkill('whatsapp')
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
      <Script src="https://unpkg.com/@daily-co/daily-js" onLoad={() => setDailyLoaded(true)} />
      <div style={{
        minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex', flexDirection: 'column', maxWidth: '500px', margin: '0 auto',
        padding: '16px 16px env(safe-area-inset-bottom)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              {visionMode ? 'AI Vision + Voice' : 'AI Voice Assistant'}
            </h1>
            <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 0' }}>Powered by AI Staffs</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setVisionMode(!visionMode)} disabled={status !== 'idle'}
              style={{
                padding: '6px 10px', background: visionMode ? '#1a3a1a' : '#1a1a24',
                color: visionMode ? '#4ade80' : '#aaa',
                border: `1px solid ${visionMode ? '#2a5a2a' : '#2a2a3a'}`,
                borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              }}>
              {visionMode ? '👁️ Vision ON' : '👁️ Vision'}
            </button>
            {!visionMode && (
              <select value={lang} onChange={e => setLang(e.target.value)} disabled={status !== 'idle'}
                style={{ padding: '6px 10px', background: '#1a1a24', color: '#aaa', border: '1px solid #2a2a3a',
                  borderRadius: '8px', fontSize: '12px', outline: 'none' }}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Camera Preview (Vision Mode) */}
        {visionMode && (
          <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '16px', overflow: 'hidden',
            background: '#111', aspectRatio: status === 'connected' ? '4/3' : undefined,
            minHeight: status === 'connected' ? undefined : '80px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #2a2a3a',
          }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
                display: status === 'connected' ? 'block' : 'none',
              }} />
            {status !== 'connected' && (
              <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                Camera will activate when call starts
              </div>
            )}
            {status === 'connected' && (
              <button onClick={toggleCamera}
                style={{
                  position: 'absolute', bottom: '12px', right: '12px',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '18px', cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}>
                🔄
              </button>
            )}
            {/* Subtitle overlay */}
            {status === 'connected' && llmText && (
              <div style={{
                position: 'absolute', bottom: '60px', left: '8px', right: '8px',
                background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
                padding: '8px 12px', fontSize: '13px', color: '#fff',
                backdropFilter: 'blur(4px)', maxHeight: '80px', overflow: 'hidden',
              }}>
                {llmText}
              </div>
            )}
          </div>
        )}

        {/* Skill Categories */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: visionMode && status === 'connected' ? 'none' : undefined }}>
          {CATEGORIES.map(cat => (
            <div key={cat.title} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#666', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{cat.icon}</span> {cat.title}
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {cat.skills.map(skill => (
                  <div key={skill.id} style={{
                    minWidth: '120px', flex: '0 0 auto',
                    background: isActive(skill.id) ? '#1a2a4a' : '#12121c',
                    border: `1px solid ${isActive(skill.id) ? '#3b82f6' : '#1e1e2e'}`,
                    borderRadius: '12px', padding: '12px',
                    transition: 'all 0.3s',
                    transform: isActive(skill.id) ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: isActive(skill.id) ? '0 0 15px rgba(59,130,246,0.2)' : 'none',
                  }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{skill.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isActive(skill.id) ? '#fff' : '#ccc' }}>{skill.label}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{skill.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Voice Button + Transcripts — fixed bottom */}
        <div style={{ borderTop: '1px solid #1a1a2a', paddingTop: '12px' }}>
          {/* Mic Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', position: 'relative' }}>
            {status === 'connected' && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', width: '100px', height: '100px',
                borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            )}
            <button onClick={status === 'idle' ? startCall : endCall}
              disabled={status === 'connecting' || !dailyLoaded}
              style={{
                width: '80px', height: '80px', borderRadius: '50%', border: 'none',
                cursor: status === 'connecting' ? 'wait' : 'pointer',
                fontSize: '32px', position: 'relative', zIndex: 1,
                transition: 'all 0.3s',
                background: status === 'idle' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : status === 'connecting' ? '#333'
                  : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                boxShadow: status === 'connected' ? '0 0 25px rgba(59,130,246,0.4)' : '0 4px 15px rgba(0,0,0,0.3)',
              }}>
              {status === 'idle' ? '🎙️' : status === 'connecting' ? '⏳' : '🔴'}
            </button>
          </div>

          {/* Status */}
          <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '10px',
            color: status === 'connected' ? '#4ade80' : '#555', fontWeight: 500 }}>
            {status === 'idle' ? 'Tap to start' : status === 'connecting' ? 'Connecting...' : 'Listening... speak now'}
          </div>

          {/* Transcripts */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              flex: 1, background: '#0a1a0a', border: '1px solid #1a2a1a',
              borderRadius: '10px', padding: '10px', minHeight: '60px',
            }}>
              <div style={{ fontSize: '9px', color: '#4a8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>You</div>
              <div style={{ fontSize: '12px', color: '#afa', lineHeight: 1.3 }}>{sttText || '...'}</div>
            </div>
            <div style={{
              flex: 1, background: '#0a0a1a', border: '1px solid #1a1a2a',
              borderRadius: '10px', padding: '10px', minHeight: '60px',
            }}>
              <div style={{ fontSize: '9px', color: '#88f', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>AI</div>
              <div style={{ fontSize: '12px', color: '#ccf', lineHeight: 1.3 }}>{llmText || '...'}</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        body { margin: 0; background: #0a0a0f; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </>
  )
}
