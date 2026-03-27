'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Message = { role: 'user' | 'ai'; text: string }
type Status = 'idle' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'error'

// Breast Guardian BU ID — change this to test other business units
const BUSINESS_UNIT_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1'
const GREETING = 'Hello! I\'m your Breast Guardian AI assistant. How can I help you today?'

export default function VoiceDemoPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isActive, setIsActive] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const processorRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Audio queue system: each sentence becomes one blob, played sequentially
  const sentenceChunksRef = useRef<Uint8Array[]>([])  // chunks for current sentence
  const audioQueueRef = useRef<Blob[]>([])             // queue of sentence blobs
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
      console.log(`[VoiceDemo] Playing sentence blob: ${blob.size} bytes, queue remaining: ${audioQueueRef.current.length}`)
      await audio.play()
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = (e) => { console.error('[VoiceDemo] Audio error:', e); resolve() }
      })
    } catch (e) {
      console.error('[VoiceDemo] Audio play error:', e)
    } finally {
      isPlayingRef.current = false
      // Play next sentence if queued
      if (audioQueueRef.current.length > 0) {
        playNextInQueue()
      } else {
        setStatus(prev => prev === 'speaking' ? 'listening' : prev)
      }
    }
  }, [])

  // Enqueue a complete sentence blob and start playing if idle
  const enqueueSentenceAudio = useCallback(() => {
    const chunks = sentenceChunksRef.current
    if (chunks.length === 0) return
    const blob = new Blob(chunks, { type: 'audio/mpeg' })
    sentenceChunksRef.current = []
    console.log(`[VoiceDemo] Sentence complete: ${chunks.length} chunks, ${blob.size} bytes`)
    audioQueueRef.current.push(blob)
    if (!isPlayingRef.current) {
      playNextInQueue()
    }
  }, [playNextInQueue])

  const startConversation = useCallback(async () => {
    try {
      setStatus('connecting')
      setMessages([])
      setLiveTranscript('')

      // Unlock audio playback on user gesture — required by browser autoplay policy
      // Playing a silent snippet inside the click handler marks the <audio> element as user-activated
      const audio = audioElRef.current
      if (audio) {
        // Tiny silent MP3 (1 frame) encoded as base64
        audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwVHAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQbAAADSAAAAAAAAANIAAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
        try { await audio.play() } catch {}
        audio.pause()
        audio.src = ''
      }

      // Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream

      // Connect WebSocket — auto-detect protocol and host
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProto}//${window.location.host}/api/voice/stream?businessUnitId=${BUSINESS_UNIT_ID}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start' }))
      }

      ws.onmessage = async (event) => {
        let msg: any
        try {
          msg = JSON.parse(typeof event.data === 'string' ? event.data : '')
        } catch {
          return
        }

        if (msg.type === 'ready') {
          setStatus('listening')
          setIsActive(true)
          ws.send(JSON.stringify({ type: 'greeting', text: GREETING }))
          try {
            startMicStream(stream, ws)
          } catch (e) {
            console.error('[VoiceDemo] startMicStream error:', e)
          }
        } else if (msg.type === 'transcript') {
          setLiveTranscript(msg.text)
          if (msg.final && msg.text) {
            setMessages(prev => [...prev, { role: 'user', text: msg.text }])
            setLiveTranscript('')
          }
        } else if (msg.type === 'processing') {
          setStatus('thinking')
        } else if (msg.type === 'ai_text') {
          setMessages(prev => [...prev, { role: 'ai', text: msg.text }])
          setStatus('speaking')
        } else if (msg.type === 'audio_chunk') {
          // Accumulate chunks for current sentence
          try {
            const binary = atob(msg.data)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            sentenceChunksRef.current.push(bytes)
          } catch (e) {
            console.error('[VoiceDemo] Audio chunk error:', e)
          }
        } else if (msg.type === 'audio_chunk_end') {
          // Sentence complete — enqueue blob and start playing if idle
          enqueueSentenceAudio()
        } else if (msg.type === 'audio_done') {
          // Flush any remaining chunks and let the queue finish naturally
          enqueueSentenceAudio()
        } else if (msg.type === 'barge_in') {
          stopAudio()
          setStatus('listening')
        } else if (msg.type === 'error') {
          console.error('[VoiceDemo]', msg.message)
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
      console.error('[VoiceDemo] Start error:', err)
      setStatus('error')
    }
  }, [enqueueSentenceAudio, stopAudio])

  const startMicStream = (stream: MediaStream, ws: WebSocket) => {
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

    recorder.start(100) // Send mic audio every 100ms for faster transcription
    processorRef.current = recorder

    // Barge-in: monitor mic volume even while muted
    // If user speaks loudly while AI is talking, interrupt
    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const checkVolume = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      analyser.getByteTimeDomainData(dataArray)
      const volume = Math.max(...Array.from(dataArray).map(v => Math.abs(v - 128)))
      // If volume > 25 while AI speaking and mic is muted → barge-in
      const track = stream.getAudioTracks()[0]
      if (!track?.enabled && volume > 25) {
        track.enabled = true // unmute mic
        wsRef.current?.send(JSON.stringify({ type: 'barge_in' }))
        stopAudio()
        setStatus('listening')
      }
      requestAnimationFrame(checkVolume)
    }
    requestAnimationFrame(checkVolume)
  }

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
    idle:       { label: 'Click to start',      color: 'text-gray-400',  pulse: false },
    connecting: { label: 'Connecting...',        color: 'text-yellow-400', pulse: true },
    ready:      { label: 'Ready',                color: 'text-green-400', pulse: false },
    listening:  { label: 'Listening...',         color: 'text-green-400', pulse: true },
    thinking:   { label: 'Thinking...',          color: 'text-blue-400',  pulse: true },
    speaking:   { label: 'AI speaking...',       color: 'text-purple-400', pulse: true },
    error:      { label: 'Error — try again',    color: 'text-red-400',   pulse: false },
  }

  const { label, color, pulse } = statusConfig[status]

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Hidden audio element — must be in DOM for autoplay unlock to work */}
      <audio ref={audioElRef} playsInline preload="none" style={{ display: 'none' }} />
      <div className="w-full max-w-lg flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Breast Guardian Voice AI</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time AI conversation</p>
        </div>

        {/* Conversation */}
        <div className="bg-gray-900 rounded-2xl p-4 h-72 overflow-y-auto flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-gray-600 text-sm text-center mt-8">Start talking to see the conversation here</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-700 text-gray-100 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {liveTranscript && (
            <div className="flex justify-end">
              <div className="max-w-xs px-4 py-2 rounded-2xl text-sm bg-blue-600/40 text-blue-200 rounded-br-sm italic">
                {liveTranscript}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={isActive ? stopConversation : startConversation}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900'
            } ${pulse ? 'animate-pulse' : ''}`}
          >
            {isActive ? (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            )}
          </button>
          <span className={`text-sm font-medium ${color}`}>{label}</span>
        </div>

        {/* Info */}
        <p className="text-center text-gray-600 text-xs">
          Powered by Deepgram · Gemini · ElevenLabs
        </p>
      </div>
    </div>
  )
}
