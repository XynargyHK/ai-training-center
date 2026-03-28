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
    const lang = query.lang || 'en'
    const ttsProvider = query.tts || 'elevenlabs-turbo'
    const sttProvider = query.stt || 'deepgram'
    const llmProvider = query.llm || 'gpt-4o-mini'
    console.log(`[VoiceWS] Config: lang=${lang} stt=${sttProvider} llm=${llmProvider} tts=${ttsProvider}`)

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

        if (lang === 'yue') {
          systemPrompt = `你係${businessContext}嘅語音AI助手。你講嘢要好似真人打電話咁，唔好似機械人。用戶會用廣東話同你傾計，你一定要用廣東話口語回覆。

規則：
- 每次回覆最多1-2句，要簡潔
- 一定要用廣東話口語：用「係」唔好用「是」，用「嘅」唔好用「的」，用「咁」唔好用「這樣」
- 自然啲回應：「嗯...」「哦！」「明白」「係喎」「哈哈」
- 唔好用markdown、列表、星號。呢個係講嘢，唔係打字
- 語氣要親切友善，好似同朋友傾計咁
- 如果用戶講英文，你都可以用廣東話夾英文回覆`
        } else {
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
        }

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
          console.log('[VoiceWS] STT needs reconnect after AI response')
          startSTT()
        }
      }
    }

    // Stream TTS — routes to the selected provider
    async function streamTTS(text, signal) {
      try {
        console.log(`[VoiceWS] TTS [${ttsProvider}]: "${text.substring(0, 50)}..."`)
        let ttsResponse

        if (ttsProvider === 'azure') {
          // Azure Speech TTS — Cantonese or English
          const voiceName = lang === 'yue' ? 'zh-HK-HiuMaanNeural' : 'en-US-JennyNeural'
          const xmlLang = lang === 'yue' ? 'zh-HK' : 'en-US'
          const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}"><voice name="${voiceName}">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</voice></speak>`
          ttsResponse = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            },
            body: ssml,
            signal,
          })
          if (!ttsResponse.ok) throw new Error(`Azure TTS ${ttsResponse.status}`)

        } else if (ttsProvider === 'cartesia') {
          // Cartesia Sonic TTS
          const voiceId = lang === 'yue' ? 'e90c6678-f0d3-4767-9883-5d0ecf5894a8' : 'a0e99841-438c-4a64-b679-ae501e7d6091' // Yue (zh) / Barbershop Man (en)
          ttsResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
            method: 'POST',
            headers: {
              'X-API-Key': process.env.CARTESIA_API_KEY,
              'Cartesia-Version': '2024-06-10',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model_id: 'sonic',
              transcript: text,
              voice: { mode: 'id', id: voiceId },
              output_format: { container: 'mp3', bit_rate: 128000, sample_rate: 44100 },
              language: lang === 'yue' ? 'zh' : 'en',
            }),
            signal,
          })
          if (!ttsResponse.ok) throw new Error(`Cartesia TTS ${ttsResponse.status}`)

        } else if (ttsProvider === 'deepgram-aura') {
          // Deepgram Aura TTS
          ttsResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
            signal,
          })
          if (!ttsResponse.ok) throw new Error(`Deepgram TTS ${ttsResponse.status}`)

        } else {
          // Default: ElevenLabs TTS
          const voiceId = 'EXAVITQu4vr4xnSDxMaL' // Sarah
          const modelId = ttsProvider === 'elevenlabs-v3' ? 'eleven_v3' : 'eleven_turbo_v2_5'
          ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
              output_format: 'mp3_44100_128',
            }),
            signal,
          })
          if (!ttsResponse.ok) throw new Error(`ElevenLabs TTS ${ttsResponse.status}`)
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
        language: lang === 'yue' ? 'zh' : 'en-US',
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

    // Azure Speech SDK STT — supports Cantonese zh-HK natively
    let azurePushStream = null
    let azureRecognizer = null

    function startAzureSTT() {
      console.log('[VoiceWS] Starting Azure STT with key:', process.env.AZURE_SPEECH_KEY ? 'present' : 'MISSING')
      const sdk = require('microsoft-cognitiveservices-speech-sdk')
      const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION)
      speechConfig.speechRecognitionLanguage = lang === 'yue' ? 'zh-HK' : 'en-US'

      // Create push stream — we'll push audio data from the browser into this
      const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
      azurePushStream = sdk.AudioInputStream.createPushStream(audioFormat)
      const audioConfig = sdk.AudioConfig.fromStreamInput(azurePushStream)

      azureRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

      // Interim results
      azureRecognizer.recognizing = (s, e) => {
        const transcript = e.result.text
        if (!transcript) return
        clearTimeout(silenceTimer)
        safeSend(JSON.stringify({ type: 'transcript', text: (fullTranscript + ' ' + transcript).trim(), final: false }))
      }

      // Final results
      azureRecognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const transcript = e.result.text
          if (!transcript) return
          fullTranscript += ' ' + transcript
          safeSend(JSON.stringify({ type: 'transcript', text: fullTranscript.trim(), final: true }))
          console.log(`[VoiceWS] Final: "${fullTranscript.trim()}"`)

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
        }
      }

      azureRecognizer.sessionStarted = () => {
        console.log('[VoiceWS] Azure STT session started')
        if (!hasConnectedOnce) {
          hasConnectedOnce = true
          safeSend(JSON.stringify({ type: 'ready' }))
        }
      }

      azureRecognizer.canceled = (s, e) => {
        console.error('[VoiceWS] Azure STT canceled:', e.errorDetails)
      }

      // Start continuous recognition
      azureRecognizer.startContinuousRecognitionAsync(
        () => console.log('[VoiceWS] Azure STT listening'),
        (err) => console.error('[VoiceWS] Azure STT start error:', err)
      )
    }

    function stopAzureSTT() {
      try {
        azureRecognizer?.stopContinuousRecognitionAsync()
        azurePushStream?.close()
      } catch {}
      azureRecognizer = null
      azurePushStream = null
    }

    // Route to correct STT provider
    function startSTT() {
      if (sttProvider === 'azure') {
        startAzureSTT()
      } else {
        startDeepgram()
      }
    }

    const pingInterval = setInterval(() => {
      try { if (ws.readyState === 1) ws.ping() } catch {}
    }, 10000)

    // Message handler — extracted so it can be called from queue replay too
    function handleMessage(data, isBinary) {
      try {
        if (isBinary) {
          if (sttProvider === 'azure' && azurePushStream) {
            // Azure SDK needs raw PCM — browser sends WebM so we need PCM from client
            // For now, push the raw data and let Azure handle it
            azurePushStream.write(Buffer.from(data))
          } else {
            const dgState = deepgramLive?.readyState
            if (dgState === 1) {
              deepgramLive.send(data)
            }
          }
        } else {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'start') {
            startSTT()
          } else if (msg.type === 'stop') {
            cancelCurrentResponse()
            try { deepgramLive?.close() } catch {}
            stopAzureSTT()
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
      stopAzureSTT()
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
