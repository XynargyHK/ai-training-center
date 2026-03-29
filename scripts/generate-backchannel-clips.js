/**
 * Generate backchannel + filler clips for voice AI humanization.
 * Uses ElevenLabs to create short clips with the SAME voice as the main TTS.
 */
const fs = require('fs')
const path = require('path')

const API_KEY = (() => {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const match = env.match(/ELEVENLABS_API_KEY=(.+)/)
  return match ? match[1].trim() : ''
})()

const outDir = path.join(__dirname, '..', 'public', 'audio', 'backchannel')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Generate for these voices
const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'sarah' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'jessica' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'eric' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'chris' },
]

// Short backchannel phrases
const BACKCHANNELS = [
  'mhm',
  'right',
  'I see',
  'yeah',
  'okay',
  'uh-huh',
  'got it',
]

// Filler phrases (for thinking delay)
const FILLERS = [
  'hmm...',
  'let me think...',
  'well...',
  'so...',
  "that's a great question...",
  'let me see...',
]

async function generate(voiceId, voiceName, text, category, index) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true },
      output_format: 'mp3_44100_128',
    }),
  })

  if (!res.ok) {
    console.log(`   ❌ ${voiceName}/${category}_${index}: HTTP ${res.status}`)
    return
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const voiceDir = path.join(outDir, voiceName)
  if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true })
  const filename = `${category}_${index}.mp3`
  fs.writeFileSync(path.join(voiceDir, filename), buffer)
  console.log(`   ✅ ${voiceName}/${filename} (${(buffer.length / 1024).toFixed(1)} KB) — "${text}"`)
}

async function main() {
  console.log('=== Generating Backchannel + Filler Clips ===\n')

  for (const voice of VOICES) {
    console.log(`\n🎤 ${voice.name}`)

    for (let i = 0; i < BACKCHANNELS.length; i++) {
      await generate(voice.id, voice.name, BACKCHANNELS[i], 'bc', i)
    }
    for (let i = 0; i < FILLERS.length; i++) {
      await generate(voice.id, voice.name, FILLERS[i], 'filler', i)
    }
  }

  console.log('\n=== DONE ===')
  console.log(`\nClips saved to: ${outDir}`)
  console.log('Structure: public/audio/backchannel/{voice}/{bc_0..6, filler_0..5}.mp3')
}

main()
