'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Message = { role: 'user' | 'ai'; text: string }
type Status = 'idle' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'error'

const BUSINESS_UNIT_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1'

// ---------------------------------------------------------------------------
// Reusable VoicePanel component
// ---------------------------------------------------------------------------

const STT_OPTIONS = [
  { value: 'deepgram', label: 'Deepgram Nova-2' },
  { value: 'elevenlabs-scribe', label: 'ElevenLabs Scribe v2 (Cantonese)' },
  { value: 'azure', label: 'Azure Speech' },
]

const LLM_OPTIONS = [
  { value: 'cerebras', label: 'Cerebras LLaMA 3.1 8B (fastest)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gemini-flash', label: 'Gemini 2.0 Flash' },
]

const TTS_OPTIONS = [
  { value: 'elevenlabs-turbo', label: 'ElevenLabs Turbo v2.5' },
  { value: 'elevenlabs-v3', label: 'ElevenLabs v3 (74 langs)' },
  { value: 'deepgram-aura', label: 'Deepgram Aura' },
  { value: 'cartesia', label: 'Cartesia Sonic' },
  { value: 'azure', label: 'Azure Speech (Cantonese)' },
]

// Voice options per TTS provider
const VOICE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'elevenlabs-turbo': [
    { value: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica (F) — Playful, Warm' },
    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (F) — Mature, Reassuring' },
    { value: 'hpp4J3VqNfWAUOO0d1Us', label: 'Bella (F) — Professional, Warm' },
    { value: 'XrExE9yKIg1WjnnlVkGX', label: 'Matilda (F) — Knowledgeable' },
    { value: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice (F) — Clear, British' },
    { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily (F) — Velvety, British' },
    { value: 'cjVigY5qzO86Huf0OWal', label: 'Eric (M) — Smooth, Trustworthy' },
    { value: 'iP95p4xoKVk53GoZ742B', label: 'Chris (M) — Charming, Friendly' },
    { value: 'CwhRBWXzGAHq8TQ4Fs17', label: 'Roger (M) — Laid-Back, Casual' },
    { value: 'bIHbv24MWmeRgasZH58o', label: 'Will (M) — Relaxed Optimist' },
    { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel (M) — Steady, British' },
  ],
  'elevenlabs-v3': [
    { value: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica (F) — Playful, Warm' },
    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (F) — Mature, Reassuring' },
    { value: 'cjVigY5qzO86Huf0OWal', label: 'Eric (M) — Smooth, Trustworthy' },
    { value: 'iP95p4xoKVk53GoZ742B', label: 'Chris (M) — Charming, Friendly' },
  ],
  'deepgram-aura': [
    { value: 'aura-asteria-en', label: 'Asteria (F) — Default' },
    { value: 'aura-luna-en', label: 'Luna (F) — Soft' },
    { value: 'aura-stella-en', label: 'Stella (F) — Confident' },
    { value: 'aura-orion-en', label: 'Orion (M) — Deep' },
    { value: 'aura-arcas-en', label: 'Arcas (M) — Warm' },
    { value: 'aura-perseus-en', label: 'Perseus (M) — Clear' },
  ],
  'cartesia': [
    { value: 'a0e99841-438c-4a64-b679-ae501e7d6091', label: 'Barbershop Man (M)' },
    { value: '79a125e8-cd45-4c13-8a67-188112f4dd22', label: 'British Lady (F)' },
    { value: 'e90c6678-f0d3-4767-9883-5d0ecf5894a8', label: 'Chinese Woman (F)' },
  ],
  'azure': [
    { value: 'zh-HK-HiuMaanNeural', label: 'HiuMaan (F) — Cantonese' },
    { value: 'zh-HK-HiuGaaiNeural', label: 'HiuGaai (F) — Cantonese' },
    { value: 'zh-HK-WanLungNeural', label: 'WanLung (M) — Cantonese' },
    { value: 'en-US-JennyNeural', label: 'Jenny (F) — English' },
    { value: 'en-US-GuyNeural', label: 'Guy (M) — English' },
  ],
}

interface VoicePanelProps {
  title: string
  lang: 'en' | 'yue'
  greeting: string
  businessUnitId: string
  defaultStt?: string
  defaultLlm?: string
  defaultTts?: string
}

function VoicePanel({ title, lang, greeting, businessUnitId, defaultStt = 'deepgram', defaultLlm = 'gpt-4o-mini', defaultTts = 'elevenlabs-turbo' }: VoicePanelProps) {
  // Persist settings in localStorage per language panel
  const storageKey = `voiceLab_${lang}`
  const loadSaved = (key: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback
    try { return localStorage.getItem(`${storageKey}_${key}`) || fallback } catch { return fallback }
  }
  const loadBool = (key: string, fallback: boolean) => {
    if (typeof window === 'undefined') return fallback
    try { const v = localStorage.getItem(`${storageKey}_${key}`); return v !== null ? v === 'true' : fallback } catch { return fallback }
  }

  const [sttProvider, setSttProvider] = useState(() => loadSaved('stt', defaultStt))
  const [llmProvider, setLlmProvider] = useState(() => loadSaved('llm', defaultLlm))
  const [ttsProvider, setTtsProvider] = useState(() => loadSaved('tts', defaultTts))
  const [voiceId, setVoiceId] = useState(() => loadSaved('voice', VOICE_OPTIONS[loadSaved('tts', defaultTts)]?.[0]?.value || ''))
  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isActive, setIsActive] = useState(false)

  // Feature toggles — persisted + sent to server
  const [bgAmbience, setBgAmbience] = useState(() => loadBool('bgAmbience', false))
  const [thinkingFillers, setThinkingFillers] = useState(() => loadBool('thinkingFillers', false))
  const [micMuteOnTts, setMicMuteOnTts] = useState(() => loadBool('micMuteOnTts', false))

  // Save settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_stt`, sttProvider)
      localStorage.setItem(`${storageKey}_llm`, llmProvider)
      localStorage.setItem(`${storageKey}_tts`, ttsProvider)
      localStorage.setItem(`${storageKey}_voice`, voiceId)
      localStorage.setItem(`${storageKey}_bgAmbience`, String(bgAmbience))
      localStorage.setItem(`${storageKey}_thinkingFillers`, String(thinkingFillers))
      localStorage.setItem(`${storageKey}_micMuteOnTts`, String(micMuteOnTts))
    } catch {}
  }, [sttProvider, llmProvider, ttsProvider, voiceId, bgAmbience, thinkingFillers, micMuteOnTts, storageKey])

  const wsRef = useRef<WebSocket | null>(null)
  const processorRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const backchannelElRef = useRef<HTMLAudioElement | null>(null) // separate channel for backchannels
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Audio queue system: each sentence becomes one blob, played sequentially
  const sentenceChunksRef = useRef<Uint8Array[]>([])
  const audioQueueRef = useRef<Blob[]>([])
  const isPlayingRef = useRef(false)
  const currentUrlRef = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const stopAudio = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.removeAttribute('src')
      audioElRef.current.load()
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    sentenceChunksRef.current = []
    audioQueueRef.current = []
    isPlayingRef.current = false
  }, [])

  // Play next blob in the queue, then recurse
  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current) return
    const blob = audioQueueRef.current.shift()
    if (!blob) return

    const audio = audioElRef.current
    if (!audio) return

    isPlayingRef.current = true
    try {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
      const url = URL.createObjectURL(blob)
      currentUrlRef.current = url
      audio.src = url
      audio.volume = 1.0
      console.log(`[VoiceLab:${lang}] Playing sentence blob: ${blob.size} bytes, queue remaining: ${audioQueueRef.current.length}`)
      await audio.play()
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = (e) => { console.error(`[VoiceLab:${lang}] Audio error:`, e); resolve() }
      })
    } catch (e) {
      console.error(`[VoiceLab:${lang}] Audio play error:`, e)
    } finally {
      isPlayingRef.current = false
      if (audioQueueRef.current.length > 0) {
        playNextInQueue()
      } else {
        setStatus(prev => prev === 'speaking' ? 'listening' : prev)
      }
    }
  }, [lang])

  // Enqueue a complete sentence blob and start playing if idle
  const enqueueSentenceAudio = useCallback(() => {
    const chunks = sentenceChunksRef.current
    if (chunks.length === 0) return
    const blob = new Blob(chunks, { type: 'audio/mpeg' })
    sentenceChunksRef.current = []
    console.log(`[VoiceLab:${lang}] Sentence complete: ${chunks.length} chunks, ${blob.size} bytes`)
    audioQueueRef.current.push(blob)
    if (!isPlayingRef.current) {
      playNextInQueue()
    }
  }, [lang, playNextInQueue])

  const startMicStream = useCallback((stream: MediaStream, ws: WebSocket) => {
    if (sttProvider === 'azure') {
      // Azure STT needs PCM 16kHz mono — use ScriptProcessorNode
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const source = audioCtx.createMediaStreamSource(stream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]))
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        ws.send(int16.buffer)
      }
      source.connect(processor)
      processor.connect(audioCtx.destination)
      processorRef.current = { stop: () => { processor.disconnect(); source.disconnect(); audioCtx.close() } } as any
    } else {
      // Deepgram — use MediaRecorder (WebM/Opus), auto-detected
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          const buffer = await e.data.arrayBuffer()
          ws.send(buffer)
        }
      }
      recorder.start(100)
      processorRef.current = recorder
    }
  }, [sttProvider])

  const startConversation = useCallback(async () => {
    try {
      setStatus('connecting')
      setMessages([])
      setLiveTranscript('')

      // Unlock audio playback on user gesture — required by browser autoplay policy
      const audio = audioElRef.current
      if (audio) {
        audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwVHAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQbAAADSAAAAAAAAANIAAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
        try { await audio.play() } catch {}
        audio.pause()
        audio.src = ''
      }

      // Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      // Connect WebSocket — auto-detect protocol and host
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProto}//${window.location.host}/api/voice/stream?businessUnitId=${businessUnitId}&lang=${lang}&stt=${sttProvider}&llm=${llmProvider}&tts=${ttsProvider}&voice=${encodeURIComponent(voiceId)}&fillers=${thinkingFillers}&ambience=${bgAmbience}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start' }))
      }

      ws.onmessage = async (event) => {
        let msg: { type: string; text?: string; final?: boolean; data?: string; message?: string }
        try {
          msg = JSON.parse(typeof event.data === 'string' ? event.data : '')
        } catch {
          return
        }

        if (msg.type === 'ready') {
          setStatus('listening')
          setIsActive(true)
          ws.send(JSON.stringify({ type: 'greeting', text: greeting }))
          try {
            startMicStream(stream, ws)
          } catch (e) {
            console.error(`[VoiceLab:${lang}] startMicStream error:`, e)
          }
        } else if (msg.type === 'transcript') {
          setLiveTranscript(msg.text ?? '')
          if (msg.final && msg.text) {
            setMessages(prev => [...prev, { role: 'user', text: msg.text! }])
            setLiveTranscript('')
          }
        } else if (msg.type === 'processing') {
          setStatus('thinking')
        } else if (msg.type === 'ai_text') {
          setMessages(prev => [...prev, { role: 'ai', text: msg.text! }])
          setStatus('speaking')
        } else if (msg.type === 'audio_chunk') {
          try {
            const binary = atob(msg.data!)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            sentenceChunksRef.current.push(bytes)
          } catch (e) {
            console.error(`[VoiceLab:${lang}] Audio chunk error:`, e)
          }
        } else if (msg.type === 'audio_chunk_end') {
          enqueueSentenceAudio()
        } else if (msg.type === 'audio_done') {
          enqueueSentenceAudio()
        } else if (msg.type === 'backchannel_audio') {
          // Play backchannel on separate audio element at lower volume — doesn't interrupt main AI audio
          try {
            const binary = atob(msg.data!)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            const blob = new Blob([bytes], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)
            const bcAudio = backchannelElRef.current
            if (bcAudio) {
              bcAudio.volume = 0.5
              bcAudio.src = url
              bcAudio.play().catch(() => {})
              bcAudio.onended = () => URL.revokeObjectURL(url)
            }
            console.log(`[VoiceLab:${lang}] Backchannel: "${(msg as any).phrase}"`)
          } catch {}
        } else if (msg.type === 'fade_out') {
          // Smooth fade-out over 150ms instead of hard cut
          const audio = audioElRef.current
          if (audio && !audio.paused) {
            const startVol = audio.volume
            const fadeSteps = 10
            const stepMs = 15 // 10 steps × 15ms = 150ms fade
            let step = 0
            const fadeInterval = setInterval(() => {
              step++
              audio.volume = Math.max(0, startVol * (1 - step / fadeSteps))
              if (step >= fadeSteps) {
                clearInterval(fadeInterval)
                audio.volume = startVol // reset for next playback
              }
            }, stepMs)
          }
        } else if (msg.type === 'barge_in') {
          stopAudio()
          setStatus('listening')
        } else if (msg.type === 'error') {
          console.error(`[VoiceLab:${lang}]`, msg.message)
        }
      }

      ws.onclose = () => {
        setStatus('idle')
        setIsActive(false)
      }

      ws.onerror = () => {
        setStatus('error')
        setIsActive(false)
      }
    } catch (err) {
      console.error(`[VoiceLab:${lang}] Start error:`, err)
      setStatus('error')
    }
  }, [lang, greeting, businessUnitId, sttProvider, llmProvider, ttsProvider, voiceId, thinkingFillers, bgAmbience, enqueueSentenceAudio, stopAudio, startMicStream])

  const stopConversation = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }))
    wsRef.current?.close()
    wsRef.current = null

    try { processorRef.current?.stop() } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop())

    stopAudio()
    setStatus('idle')
    setIsActive(false)
    setLiveTranscript('')
  }, [stopAudio])

  const statusConfig: Record<Status, { label: string; color: string; pulse: boolean }> = {
    idle:       { label: 'Click to start',   color: 'text-gray-400',   pulse: false },
    connecting: { label: 'Connecting...',     color: 'text-yellow-400', pulse: true  },
    ready:      { label: 'Ready',             color: 'text-green-400',  pulse: false },
    listening:  { label: 'Listening...',      color: 'text-green-400',  pulse: true  },
    thinking:   { label: 'Thinking...',       color: 'text-blue-400',   pulse: true  },
    speaking:   { label: 'AI speaking...',    color: 'text-purple-400', pulse: true  },
    error:      { label: 'Error — try again', color: 'text-red-400',    pulse: false },
  }

  const { label, color, pulse } = statusConfig[status]

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Hidden audio element — must be in DOM for autoplay unlock to work */}
      <audio ref={audioElRef} playsInline preload="none" style={{ display: 'none' }} />
      <audio ref={backchannelElRef} playsInline preload="none" style={{ display: 'none' }} />

      {/* Panel title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>

      {/* Split conversation: AI (left) | User (right) */}
      <div className="grid grid-cols-2 gap-3 h-64">
        {/* AI side */}
        <div className="bg-gray-900 rounded-2xl p-3 overflow-y-auto flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status === 'speaking' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            AI
          </div>
          {messages.filter(m => m.role === 'ai').length === 0 && (
            <p className="text-gray-700 text-xs text-center mt-6">Waiting...</p>
          )}
          {messages.filter(m => m.role === 'ai').map((m, i) => (
            <div key={i} className="px-3 py-2 rounded-xl text-sm bg-gray-700/60 text-gray-100">
              {m.text}
            </div>
          ))}
        </div>
        {/* User side */}
        <div className="bg-gray-900 rounded-2xl p-3 overflow-y-auto flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
            You
          </div>
          {messages.filter(m => m.role === 'user').length === 0 && !liveTranscript && (
            <p className="text-gray-700 text-xs text-center mt-6">Start talking...</p>
          )}
          {messages.filter(m => m.role === 'user').map((m, i) => (
            <div key={i} className="px-3 py-2 rounded-xl text-sm bg-blue-600/40 text-blue-100">
              {m.text}
            </div>
          ))}
          {liveTranscript && (
            <div className="px-3 py-2 rounded-xl text-sm bg-blue-600/20 text-blue-300 italic">
              {liveTranscript}...
            </div>
          )}
        </div>
      </div>
      {/* Combined timeline below (shows interleaved conversation) */}
      <div className="bg-gray-900/40 rounded-xl p-3 max-h-32 overflow-y-auto flex flex-col gap-1.5">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs ${m.role === 'user' ? 'text-blue-300' : 'text-gray-400'}`}>
            <span className="font-medium">{m.role === 'user' ? 'You' : 'AI'}:</span> {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isActive ? stopConversation : startConversation}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900'
          } ${pulse ? 'animate-pulse' : ''}`}
        >
          {isActive ? (
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          )}
        </button>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>

      {/* Provider selectors */}
      <div className="bg-gray-900/60 rounded-xl px-4 py-3 flex flex-col gap-2 text-xs border border-gray-800">
        <ProviderSelect label="STT" value={sttProvider} onChange={setSttProvider} options={STT_OPTIONS} disabled={isActive} />
        <ProviderSelect label="LLM" value={llmProvider} onChange={setLlmProvider} options={LLM_OPTIONS} disabled={isActive} />
        <ProviderSelect label="TTS" value={ttsProvider} onChange={(v) => { setTtsProvider(v); setVoiceId(VOICE_OPTIONS[v]?.[0]?.value || '') }} options={TTS_OPTIONS} disabled={isActive} />
        {VOICE_OPTIONS[ttsProvider] && (
          <ProviderSelect label="Voice" value={voiceId} onChange={setVoiceId} options={VOICE_OPTIONS[ttsProvider]} disabled={isActive} />
        )}
      </div>

      {/* Feature toggles (UI placeholders) */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Feature Toggles</p>
        <ToggleRow
          label="Background Ambience"
          checked={bgAmbience}
          onChange={setBgAmbience}
        />
        <ToggleRow
          label="Backchanneling (mhm, right...)"
          checked={thinkingFillers}
          onChange={setThinkingFillers}
        />
        <ToggleRow
          label="Mic Mute on TTS"
          checked={micMuteOnTts}
          onChange={setMicMuteOnTts}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Provider dropdown selector
// ---------------------------------------------------------------------------

interface ProviderSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

function ProviderSelect({ label, value, onChange, options, disabled }: ProviderSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-8 font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small toggle switch helper
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-xs text-gray-400">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VoiceLabPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col gap-8">
      {/* Page header */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold text-white">Voice AI Lab</h1>
        <p className="text-gray-500 text-sm mt-2">
          Side-by-side comparison of English and Cantonese voice AI pipelines
        </p>
      </div>

      {/* Two-panel layout — side by side on md+, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
        {/* Left panel — English */}
        <div className="flex-1 bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
          <VoicePanel
            title="English Voice AI"
            lang="en"
            greeting="Hello! I'm your Breast Guardian AI assistant. How can I help you today?"
            businessUnitId={BUSINESS_UNIT_ID}
            defaultStt="deepgram"
            defaultLlm="gpt-4o-mini"
            defaultTts="elevenlabs-turbo"
          />
        </div>

        {/* Divider — visible only on desktop */}
        <div className="hidden md:block w-px bg-gray-800 self-stretch" />

        {/* Right panel — Cantonese */}
        <div className="flex-1 bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
          <VoicePanel
            title="廣東話 Voice AI"
            lang="yue"
            greeting="你好！我係Breast Guardian嘅AI助手，有咩可以幫到你？"
            businessUnitId={BUSINESS_UNIT_ID}
            defaultStt="azure"
            defaultLlm="gpt-4o-mini"
            defaultTts="azure"
          />
        </div>
      </div>
    </div>
  )
}
