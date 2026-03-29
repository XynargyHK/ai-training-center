/**
 * Generate voice samples from top ElevenLabs voices for comparison.
 * Listen and pick the one you want for the AI assistant.
 */
const fs = require('fs')
const path = require('path')

const API_KEY = process.env.ELEVENLABS_API_KEY || (() => {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const match = env.match(/ELEVENLABS_API_KEY=(.+)/)
  return match ? match[1].trim() : ''
})()

const outDir = path.join(__dirname, '..', 'test-audio-voices')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Top voices for customer service
const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Mature, Reassuring (current)' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Playful, Bright, Warm' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', desc: 'Professional, Bright, Warm' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Knowledgeable, Professional' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'Clear, Engaging (British)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Velvety Actress (British)' },
]

// Test phrases — natural customer service conversation
const PHRASES = [
  "Hi there! Welcome to SkinCoach. How can I help you today?",
  "Oh that's a great question! So this serum works best when you apply it after cleansing, while your skin is still slightly damp.",
  "Hmm, let me think about that... I'd actually recommend starting with the gentle cleanser first, and then we can see how your skin responds.",
  "I totally understand your concern. Let me look into that for you right away.",
]

async function generateSample(voiceId, voiceName, text, index) {
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
    console.log(`   ❌ ${voiceName} phrase ${index}: HTTP ${res.status}`)
    return
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const filename = `${voiceName}_${index}.mp3`
  fs.writeFileSync(path.join(outDir, filename), buffer)
  console.log(`   ✅ ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

async function main() {
  console.log('=== ElevenLabs Voice Comparison ===\n')
  console.log(`Output: ${outDir}\n`)

  for (const voice of VOICES) {
    console.log(`\n🎤 ${voice.name} — ${voice.desc}`)
    for (let i = 0; i < PHRASES.length; i++) {
      await generateSample(voice.id, voice.name, PHRASES[i], i + 1)
    }
  }

  console.log('\n=== DONE ===')
  console.log(`\nFiles in: ${outDir}`)
  console.log('\nPhrases:')
  PHRASES.forEach((p, i) => console.log(`  ${i + 1}: "${p.substring(0, 60)}..."`))
  console.log('\nCompare: Sarah_1.mp3 vs Jessica_1.mp3 vs Bella_1.mp3 etc.')
}

main()
