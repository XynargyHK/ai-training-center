import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// Convert text to speech using OpenAI TTS
export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'nova' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice, // nova, alloy, echo, fable, onyx, shimmer
      input: text.substring(0, 4096),
      speed: 1.0,
    })

    const audioBuffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[TTS] Error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
