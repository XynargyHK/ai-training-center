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

  wss.on('connection', (ws, req) => {
    console.log('[VoiceWS] Client connected')

    const { query } = parse(req.url, true)
    const businessUnitId = query.businessUnitId || null

    let deepgramLive = null
    let fullTranscript = ''
    let silenceTimer = null
    let isAISpeaking = false
    let abortController = null
    let keepAliveInterval = null
    let hasConnectedOnce = false
    let setupDone = false
    const pendingMessages = [] // queue messages until async setup is done
    const conversationHistory = []

    // Refs that get set after async init
    let deepgram = null
    let model = null

    const safeSend = (data) => {
      try { if (ws.readyState === 1) ws.send(data) } catch {}
    }

    // Async init — runs in background, message handler is registered IMMEDIATELY below
    let systemPrompt = ''
    ;(async () => {
      try {
        const OpenAI = (await import('openai')).default
        model = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        let businessContext = 'a helpful AI assistant'
        if (businessUnitId) {
          try {
            const { createClient: createSupabase } = await import('@supabase/supabase-js')
            const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
            const { data } = await supabase.from('business_units').select('name, ai_personality').eq('id', businessUnitId).single()
            if (data?.name) businessContext = data.name
          } catch {}
        }

        systemPrompt = `You are a voice AI assistant for ${businessContext}. You speak like a real person in a phone call — not a chatbot.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally: "hmm", "well", "you know", "let me think...", "oh!", "right"
- Vary your energy. Sometimes enthusiastic, sometimes calm and thoughtful.
- Use contractions: "I'm", "don't", "can't", "it's" — never "I am", "do not"
- React naturally: laugh ("haha"), express surprise ("oh wow"), show empathy ("ah I see, that's tough")
- When you need a moment, say "hmm..." or "let me think..." instead of going silent
- No markdown, no lists, no asterisks, no bullet points. This is spoken language.
- If you don't know something, just say so casually: "honestly I'm not sure about that one"
- Sound warm and friendly, like talking to a colleague, not a customer service script`

        console.log('[VoiceWS] OpenAI init done, processing queued messages:', pendingMessages.length)
        setupDone = true
        for (const m of pendingMessages) handleMessage(m.data, m.isBinary)
        pendingMessages.length = 0
      } catch (err) {
        console.error('[VoiceWS] Init error:', err)
        safeSend(JSON.stringify({ type: 'error', message: 'Server init failed' }))
      }
    })()

    // Streaming AI → streaming TTS → streaming audio to client
    // Instead of waiting for full AI text then full TTS audio, we:
    // 1. Stream Gemini text token-by-token, accumulate into sentences
    // 2. As each sentence completes, fire TTS immediately
    // 3. Stream TTS audio chunks to client as they arrive
    async function processUserInput(transcript, signal) {
      if (!transcript.trim()) return

      console.log(`[VoiceWS] Processing: "${transcript}"`)
      safeSend(JSON.stringify({ type: 'processing' }))

      try {
        // Build messages: system + conversation history + user input
        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10),
          { role: 'user', content: transcript }
        ]

        // Stream GPT-4o-mini response
        const stream = await model.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 150,
          temperature: 0.7,
          stream: true,
        })

        let fullText = ''
        let pendingText = ''

        for await (const chunk of stream) {
          if (signal?.aborted) {
            console.log('[VoiceWS] Aborted during OpenAI stream')
            return
          }
          const text = chunk.choices[0]?.delta?.content
          if (!text) continue
          fullText += text
          pendingText += text

          // Check for sentence boundary — flush to TTS as soon as we have a sentence
          const sentenceMatch = pendingText.match(/^(.*?[.!?])\s*(.*)$/s)
          if (sentenceMatch) {
            const sentence = sentenceMatch[1].replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim()
            pendingText = sentenceMatch[2]

            if (sentence) {
              safeSend(JSON.stringify({ type: 'ai_text', text: sentence }))
              isAISpeaking = true
              await streamTTS(sentence, signal)
              if (signal?.aborted) return
            }
          }
        }

        // Flush any remaining text that didn't end with punctuation
        const remaining = pendingText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim()
        if (remaining && !signal?.aborted) {
          safeSend(JSON.stringify({ type: 'ai_text', text: remaining }))
          isAISpeaking = true
          await streamTTS(remaining, signal)
        }

        // Save to history (OpenAI format)
        const cleanText = fullText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim().substring(0, 300)
        if (cleanText) {
          conversationHistory.push({ role: 'user', content: transcript })
          conversationHistory.push({ role: 'assistant', content: cleanText })
        }

        console.log(`[VoiceWS] AI reply: "${cleanText}"`)
      } catch (err) {
        if (signal?.aborted) return
        console.error('[VoiceWS] AI error:', err)
      } finally {
        isAISpeaking = false
        safeSend(JSON.stringify({ type: 'audio_done' }))
        // Reconnect Deepgram if it closed during AI speech
        if (!deepgramLive || deepgramLive.readyState !== 1) {
          console.log('[VoiceWS] Deepgram needs reconnect after AI response')
          startDeepgram()
        }
      }
    }

    // Stream TTS: ElevenLabs for natural-sounding speech with emotion
    async function streamTTS(text, signal) {
      try {
        console.log(`[VoiceWS] TTS streaming: "${text.substring(0, 50)}..."`)

        const voiceId = 'EXAVITQu4vr4xnSDxMaL' // Sarah — natural, warm female voice
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
            output_format: 'mp3_44100_128',
          }),
          signal,
        })

        if (!ttsResponse.ok) {
          throw new Error(`ElevenLabs TTS ${ttsResponse.status}`)
        }

        // Stream the response body — send chunks as they arrive
        const reader = ttsResponse.body.getReader()
        let chunkIndex = 0
        while (true) {
          if (signal?.aborted) break
          const { done, value } = await reader.read()
          if (done) break
          if (value && value.length > 0 && ws.readyState === 1) {
            const base64 = Buffer.from(value).toString('base64')
            safeSend(JSON.stringify({ type: 'audio_chunk', data: base64, index: chunkIndex++ }))
          }
        }
        // Signal end of this sentence's audio
        safeSend(JSON.stringify({ type: 'audio_chunk_end' }))
        console.log(`[VoiceWS] TTS done: ${chunkIndex} chunks sent`)
      } catch (err) {
        if (signal?.aborted) return
        console.error('[VoiceWS] TTS error:', err.message || err)
      }
    }

    // Speak a greeting (non-streaming, simpler path)
    async function speakGreeting(text) {
      if (!text || ws.readyState !== 1) return
      isAISpeaking = true
      safeSend(JSON.stringify({ type: 'ai_text', text }))
      await streamTTS(text, null)
      isAISpeaking = false
      safeSend(JSON.stringify({ type: 'audio_done' }))
    }

    function cancelCurrentResponse() {
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      isAISpeaking = false
    }

    // Start Deepgram live STT connection — uses raw WebSocket (SDK v3 has connection bugs)
    function startDeepgram() {
      console.log('[VoiceWS] Starting Deepgram with key:', process.env.DEEPGRAM_API_KEY ? 'present' : 'MISSING')
      const WebSocketClient = require('ws')
      const dgParams = new URLSearchParams({
        model: 'nova-2',
        language: 'en-US',
        smart_format: 'true',
        interim_results: 'true',
        endpointing: '700',
        vad_events: 'true',
      })
      deepgramLive = new WebSocketClient(`wss://api.deepgram.com/v1/listen?${dgParams}`, {
        headers: { 'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}` }
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

      deepgramLive.on('message', async (raw) => {
        try {
          const data = JSON.parse(raw.toString())

          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript
            if (!transcript) return

            if (data.is_final) {
              fullTranscript += ' ' + transcript
              safeSend(JSON.stringify({ type: 'transcript', text: fullTranscript.trim(), final: true }))
              console.log(`[VoiceWS] Final: "${fullTranscript.trim()}"`)

              // 1s silence timer — reset on every is_final with text
              // If user keeps talking, new is_final resets the timer
              // If user stops for 1s, timer fires and we process
              clearTimeout(silenceTimer)
              silenceTimer = setTimeout(async () => {
                const text = fullTranscript.trim()
                fullTranscript = ''
                if (!text) return

                if (isAISpeaking) {
                  console.log('[VoiceWS] Barge-in:', text)
                  cancelCurrentResponse()
                  safeSend(JSON.stringify({ type: 'barge_in' }))
                }

                console.log('[VoiceWS] Processing:', text)
                abortController = new AbortController()
                await processUserInput(text, abortController.signal)
                abortController = null
              }, 1000)
            } else {
              // Interim result — user is still speaking, cancel timer
              clearTimeout(silenceTimer)
              safeSend(JSON.stringify({ type: 'transcript', text: (fullTranscript + ' ' + transcript).trim(), final: false }))
            }
          }
        } catch (err) {
          console.error('[VoiceWS] Deepgram parse error:', err.message)
        }
      })

      deepgramLive.on('error', (err) => {
        console.error('[VoiceWS] Deepgram error:', err?.message || err)
        safeSend(JSON.stringify({ type: 'error', message: 'STT error' }))
      })

      deepgramLive.on('close', () => {
        console.log('[VoiceWS] Deepgram closed')
        clearInterval(keepAliveInterval)
        keepAliveInterval = null
        if (ws.readyState === 1 && !isAISpeaking) {
          console.log('[VoiceWS] Deepgram reconnecting...')
          setTimeout(() => {
            if (ws.readyState === 1) startDeepgram()
          }, 500)
        }
      })

      keepAliveInterval = setInterval(() => {
        if (deepgramLive?.readyState === 1) {
          deepgramLive.send(JSON.stringify({ type: 'KeepAlive' }))
        }
      }, 5000)
    }

    const pingInterval = setInterval(() => {
      try { if (ws.readyState === 1) ws.ping() } catch {}
    }, 10000)

    // Message handler — extracted so it can be called from queue replay too
    function handleMessage(data, isBinary) {
      try {
        if (isBinary) {
          const dgState = deepgramLive?.readyState
          if (dgState === 1) {
            deepgramLive.send(data)
          } else {
            console.log('[VoiceWS] Binary received but Deepgram not ready, state:', dgState)
          }
        } else {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'start') {
            startDeepgram()
          } else if (msg.type === 'stop') {
            cancelCurrentResponse()
            try { deepgramLive?.close() } catch {}
          } else if (msg.type === 'greeting') {
            speakGreeting(msg.text || 'Hello! How can I help you today?')
          } else if (msg.type === 'barge_in') {
            console.log('[VoiceWS] Barge-in from client')
            cancelCurrentResponse()
            safeSend(JSON.stringify({ type: 'barge_in' }))
          }
        }
      } catch (err) {
        console.error('[VoiceWS] Message handler error:', err.message)
      }
    }

    // Register IMMEDIATELY so no messages are lost during async init
    ws.on('message', (data, isBinary) => {
      if (!setupDone) {
        pendingMessages.push({ data, isBinary })
        return
      }
      handleMessage(data, isBinary)
    })

    ws.on('error', (err) => {
      console.error('[VoiceWS] WebSocket error:', err.message)
    })

    ws.on('close', (code, reason) => {
      console.log(`[VoiceWS] Client disconnected (code=${code})`)
      cancelCurrentResponse()
      clearTimeout(silenceTimer)
      clearInterval(keepAliveInterval)
      clearInterval(pingInterval)
      keepAliveInterval = null
      try { deepgramLive?.close() } catch {}
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
