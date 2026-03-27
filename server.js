// Custom Next.js server with WebSocket support for real-time voice AI
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // WebSocket server for real-time voice
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url)
    if (pathname === '/api/voice/stream') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', async (ws, req) => {
    console.log('[VoiceWS] Client connected')

    // Parse businessUnitId from query
    const { query } = parse(req.url, true)
    const businessUnitId = query.businessUnitId || null

    let deepgramLive = null
    let fullTranscript = ''
    let silenceTimer = null
    let isAISpeaking = false
    let currentAudioChunks = []
    let keepAliveInterval = null
    let hasConnectedOnce = false
    const conversationHistory = [] // [{role:'user'|'model', parts:[{text}]}]

    // Safe send — never throws even if connection is closing
    const safeSend = (data) => {
      try { if (ws.readyState === 1) ws.send(data) } catch {}
    }

    // ESM-only packages must use dynamic import
    const { createClient } = await import('@deepgram/sdk')
    const { ElevenLabsClient } = await import('elevenlabs')
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY)
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

    async function getAIResponse(transcript) {
      if (!transcript.trim()) return null

      console.log(`[VoiceWS] Getting AI response for: "${transcript}"`)

      let aiText = 'Sorry, I could not process that. Please try again.'

      try {
        // Call Gemini directly — no HTTP hop, thinking disabled for speed
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

        // Get business name from Supabase
        let businessContext = 'a helpful AI assistant'
        if (businessUnitId) {
          try {
            const { createClient: createSupabase } = await import('@supabase/supabase-js')
            const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
            const { data } = await supabase.from('business_units').select('name, ai_personality').eq('id', businessUnitId).single()
            if (data?.name) businessContext = data.name
          } catch {}
        }

        const systemInstruction = `You are a voice AI assistant for ${businessContext}. Reply in 1-2 short spoken sentences only. No markdown, no lists, no asterisks. Sound natural and conversational. If you don't know something like real-time weather, say so briefly.`

        // Rebuild model with system instruction + conversation history
        const modelWithContext = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
          systemInstruction
        })
        const chat = modelWithContext.startChat({
          history: conversationHistory.slice(-10) // keep last 10 turns
        })

        const result = await chat.sendMessage(transcript)
        const raw = result.response.text()
        if (raw) {
          aiText = raw.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim().substring(0, 300)
          // Save to history so next turn has context
          conversationHistory.push({ role: 'user', parts: [{ text: transcript }] })
          conversationHistory.push({ role: 'model', parts: [{ text: aiText }] })
        }
      } catch (err) {
        console.error('[VoiceWS] AI error:', err)
      }

      console.log(`[VoiceWS] AI reply: "${aiText}"`)
      return aiText
    }

    async function speakText(text) {
      if (!text || ws.readyState !== 1) return
      isAISpeaking = true
      let audioStarted = false

      try {
        safeSend(JSON.stringify({ type: 'ai_text', text }))
        console.log('[VoiceWS] Starting ElevenLabs TTS...')

        // ElevenLabs streaming TTS
        const audioStream = await elevenlabs.textToSpeech.convertAsStream(
          'EXAVITQu4vr4xnSDxMaL', // Sarah voice ID
          {
            text,
            model_id: 'eleven_turbo_v2_5',
            output_format: 'mp3_44100_128',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          }
        )

        console.log('[VoiceWS] ElevenLabs stream ready, sending audio...')
        safeSend(JSON.stringify({ type: 'audio_start' }))
        audioStarted = true
        let chunkCount = 0

        for await (const chunk of audioStream) {
          if (ws.readyState !== 1 || !isAISpeaking) break
          safeSend(chunk)
          chunkCount++
        }

        console.log(`[VoiceWS] Audio done, sent ${chunkCount} chunks`)
      } catch (err) {
        console.error('[VoiceWS] TTS error:', err.message || err)
        safeSend(JSON.stringify({ type: 'error', message: 'TTS failed' }))
      } finally {
        isAISpeaking = false
        safeSend(JSON.stringify({ type: 'audio_end' }))
      }
    }

    // Start Deepgram live connection
    function startDeepgram() {
      deepgramLive = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        utterance_end_ms: 1200,
        vad_events: true,
        // Let Deepgram auto-detect format (browser sends WebM/Opus via MediaRecorder)
      })

      deepgramLive.on('open', () => {
        console.log('[VoiceWS] Deepgram connected')
        if (!hasConnectedOnce) {
          hasConnectedOnce = true
          safeSend(JSON.stringify({ type: 'ready' }))
        } else {
          console.log('[VoiceWS] Deepgram reconnected silently')
        }
      })

      // v3 SDK uses 'Results' not 'transcript'
      deepgramLive.on('Results', async (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript
        if (!transcript) return

        console.log(`[VoiceWS] Transcript (final=${data.is_final}): "${transcript}"`)

        if (data.is_final) {
          fullTranscript += ' ' + transcript
          safeSend(JSON.stringify({ type: 'transcript', text: fullTranscript.trim(), final: true }))
        } else {
          safeSend(JSON.stringify({ type: 'transcript', text: (fullTranscript + ' ' + transcript).trim(), final: false }))
        }
      })

      // v3 SDK uses 'UtteranceEnd'
      deepgramLive.on('UtteranceEnd', async (data) => {
        if (data?.last_word_end === -1) return // ignore stale/duplicate signals
        clearTimeout(silenceTimer)
        const text = fullTranscript.trim()
        fullTranscript = ''
        if (!text) return
        if (isAISpeaking) {
          console.log('[VoiceWS] Utterance end ignored — AI still speaking')
          return
        }

        console.log('[VoiceWS] Utterance end, processing:', text)
        // Immediately tell client to mute mic — prevents double-utterances during 2-3s thinking window
        safeSend(JSON.stringify({ type: 'processing' }))
        const aiReply = await getAIResponse(text)
        if (aiReply) await speakText(aiReply)
      })

      deepgramLive.on('error', (err) => {
        console.error('[VoiceWS] Deepgram error:', err)
        safeSend(JSON.stringify({ type: 'error', message: 'STT error' }))
      })

      deepgramLive.on('close', () => {
        console.log('[VoiceWS] Deepgram closed')
        clearInterval(keepAliveInterval)
        keepAliveInterval = null
        // Auto-reconnect if the WebSocket is still open
        if (ws.readyState === 1 && !isAISpeaking) {
          console.log('[VoiceWS] Deepgram reconnecting...')
          setTimeout(() => {
            if (ws.readyState === 1) startDeepgram()
          }, 500)
        }
      })

      // Keep Deepgram connection alive during silence (e.g. while AI is speaking)
      keepAliveInterval = setInterval(() => {
        if (deepgramLive?.getReadyState() === 1) {
          deepgramLive.keepAlive()
        }
      }, 5000)
    }

    // WebSocket-level ping to keep connection alive
    const pingInterval = setInterval(() => {
      try { if (ws.readyState === 1) ws.ping() } catch {}
    }, 10000)

    // Handle messages from browser
    ws.on('message', (data, isBinary) => {
      try {
        if (isBinary) {
          // Raw audio from browser mic — forward to Deepgram
          if (deepgramLive?.getReadyState() === 1) {
            deepgramLive.send(data)
          }
        } else {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'start') {
            startDeepgram()
          } else if (msg.type === 'stop') {
            deepgramLive?.finish()
          } else if (msg.type === 'greeting') {
            speakText(msg.text || 'Hello! How can I help you today?')
          } else if (msg.type === 'barge_in') {
            console.log('[VoiceWS] Barge-in from client')
            isAISpeaking = false
          }
        }
      } catch (err) {
        console.error('[VoiceWS] Message handler error:', err.message)
      }
    })

    ws.on('error', (err) => {
      console.error('[VoiceWS] WebSocket error:', err.message)
      // Don't crash — just log. Connection will close on its own.
    })

    ws.on('close', (code, reason) => {
      console.log(`[VoiceWS] Client disconnected (code=${code})`)
      clearTimeout(silenceTimer)
      clearInterval(keepAliveInterval)
      clearInterval(pingInterval)
      keepAliveInterval = null
      deepgramLive?.finish()
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
