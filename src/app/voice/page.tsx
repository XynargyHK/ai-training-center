'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'

const PIPECAT_URL = 'https://pretty-alignment-production-891e.up.railway.app'

const SKILLS = [
  { id: 'whatsapp', icon: '💬', label: 'WhatsApp', color: '#25D366' },
  { id: 'map', icon: '🗺️', label: 'Maps', color: '#4285F4' },
  { id: 'weather', icon: '🌤️', label: 'Weather', color: '#FF9500' },
  { id: 'currency', icon: '💱', label: 'Currency', color: '#AF52DE' },
  { id: 'search', icon: '🔍', label: 'Search', color: '#FF3B30' },
  { id: 'note', icon: '📝', label: 'Notes', color: '#FFD60A' },
  { id: 'translate', icon: '🌐', label: 'Translate', color: '#30D158' },
  { id: 'call', icon: '📞', label: 'Phone', color: '#007AFF' },
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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking'>('idle')
  const [sttText, setSttText] = useState('')
  const [llmText, setLlmText] = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [lang, setLang] = useState('en')
  const [dailyLoaded, setDailyLoaded] = useState(false)
  const callRef = useRef<any>(null)

  const startCall = useCallback(async () => {
    if (!dailyLoaded) return
    setStatus('connecting')
    setSttText('')
    setLlmText('')

    try {
      const ttsProvider = lang === 'yue' || lang === 'vi' ? 'azure' : 'azure'
      const res = await fetch(`${PIPECAT_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, tts_provider: ttsProvider, tts_voice: '' }),
      })
      const data = await res.json()
      if (data.error) { setStatus('idle'); return }

      if (callRef.current) {
        try { await callRef.current.leave() } catch(e) {}
        try { callRef.current.destroy() } catch(e) {}
      }

      const callObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false,
        subscribeToTracksAutomatically: true,
      })

      callObject.on('track-started', (event: any) => {
        if (event.track.kind === 'audio' && !event.participant.local) {
          const audio = new Audio()
          audio.srcObject = new MediaStream([event.track])
          audio.autoplay = true
          audio.play().catch(() => {})
        }
      })

      callObject.on('app-message', (event: any) => {
        const d = event.data
        if (!d || !d.type) return
        if (d.type === 'stt') setSttText(d.text)
        else if (d.type === 'llm') setLlmText(d.text)
        else if (d.type === 'switch-language' && d.lang) {
          setLang(d.lang)
          endCall()
          setTimeout(() => startCall(), 500)
        }
      })

      callObject.on('joined-meeting', () => setStatus('connected'))
      callObject.on('left-meeting', () => {
        setStatus('idle')
        callRef.current = null
      })

      await callObject.join({ url: data.room_url })
      callRef.current = callObject
    } catch (err) {
      setStatus('idle')
    }
  }, [dailyLoaded, lang])

  const endCall = useCallback(async () => {
    if (callRef.current) {
      await callRef.current.leave()
      callRef.current.destroy()
      callRef.current = null
    }
    setStatus('idle')
  }, [])

  const toggleCall = () => {
    if (status === 'idle') startCall()
    else endCall()
  }

  // Detect active skill from LLM text
  useEffect(() => {
    const t = llmText.toLowerCase()
    if (t.includes('whatsapp') || t.includes('sent')) setActiveSkill('whatsapp')
    else if (t.includes('map') || t.includes('direction') || t.includes('restaurant')) setActiveSkill('map')
    else if (t.includes('weather') || t.includes('temperature') || t.includes('rain')) setActiveSkill('weather')
    else if (t.includes('convert') || t.includes('dollar') || t.includes('currency')) setActiveSkill('currency')
    else if (t.includes('search') || t.includes('found')) setActiveSkill('search')
    else if (t.includes('note') || t.includes('memo') || t.includes('remind')) setActiveSkill('note')
    else if (t.includes('translat')) setActiveSkill('translate')
    else if (t.includes('call') || t.includes('phone') || t.includes('dial')) setActiveSkill('call')
    else setActiveSkill(null)
  }, [llmText])

  return (
    <>
      <Script
        src="https://unpkg.com/@daily-co/daily-js"
        onLoad={() => setDailyLoaded(true)}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            AI Voice Assistant
          </h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>
            Powered by AI Staffs
          </p>
        </div>

        {/* Language selector */}
        <div style={{ marginBottom: '20px', width: '100%' }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={status !== 'idle'}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Skill cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          width: '100%',
          marginBottom: '30px',
        }}>
          {SKILLS.map(skill => (
            <div
              key={skill.id}
              style={{
                background: activeSkill === skill.id ? skill.color + '30' : '#1a1a2e',
                border: `1px solid ${activeSkill === skill.id ? skill.color : '#2a2a3e'}`,
                borderRadius: '14px',
                padding: '12px 6px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                transform: activeSkill === skill.id ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{skill.icon}</div>
              <div style={{ fontSize: '10px', color: activeSkill === skill.id ? skill.color : '#888' }}>
                {skill.label}
              </div>
            </div>
          ))}
        </div>

        {/* Voice button */}
        <div style={{ marginBottom: '30px', position: 'relative' }}>
          {/* Pulse animation when connected */}
          {status === 'connected' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.2)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          )}
          <button
            onClick={toggleCall}
            disabled={status === 'connecting' || !dailyLoaded}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: 'none',
              cursor: status === 'connecting' ? 'wait' : 'pointer',
              fontSize: '40px',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.3s ease',
              background: status === 'idle' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : status === 'connecting' ? '#555'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              boxShadow: status === 'connected'
                ? '0 0 30px rgba(37, 99, 235, 0.5)'
                : '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {status === 'idle' ? '🎙️' : status === 'connecting' ? '⏳' : '🔴'}
          </button>
        </div>

        {/* Status */}
        <div style={{
          fontSize: '14px',
          color: status === 'connected' ? '#4ade80' : '#888',
          marginBottom: '20px',
          fontWeight: 500,
        }}>
          {status === 'idle' ? 'Tap to start' :
           status === 'connecting' ? 'Connecting...' :
           'Listening... speak now'}
        </div>

        {/* Transcript panels */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '20px' }}>
          <div style={{
            flex: 1,
            background: '#0d1f0d',
            border: '1px solid #1a3a1a',
            borderRadius: '14px',
            padding: '12px',
            minHeight: '80px',
          }}>
            <div style={{ fontSize: '10px', color: '#4a8', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              You said
            </div>
            <div style={{ fontSize: '13px', color: '#cfc', lineHeight: 1.4 }}>
              {sttText || '...'}
            </div>
          </div>
          <div style={{
            flex: 1,
            background: '#0d0d1f',
            border: '1px solid #1a1a3a',
            borderRadius: '14px',
            padding: '12px',
            minHeight: '80px',
          }}>
            <div style={{ fontSize: '10px', color: '#88f', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              AI said
            </div>
            <div style={{ fontSize: '13px', color: '#ccf', lineHeight: 1.4 }}>
              {llmText || '...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: '11px', color: '#444', textAlign: 'center' }}>
          Full-duplex voice AI with 14 skills
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }
        body { margin: 0; background: #0a0a1a; }
      `}</style>
    </>
  )
}
