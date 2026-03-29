# Voice AI Humanization — Complete Implementation Guide

**Date:** March 29, 2026
**Project:** AI Training Center — Voice AI Lab
**Current Stack:** Deepgram STT | Gemini 2.0 Flash LLM | ElevenLabs TTS (English) | Azure TTS (Cantonese) | Node.js WebSocket
**Author:** Claude (AI Assistant)

---

## Executive Summary

This report evaluates **10 core humanization components** and **3 architectural alternatives** that can make AI voice conversations sound indistinguishable from human conversations. Each component is rated by implementation effort, impact, cost, and Cantonese language support. A prioritized implementation roadmap is included at the end.

---

## Table of Contents

1. Prosody Control
2. Backchanneling
3. Background Ambience
4. Turn-Taking
5. Emotion Detection
6. Filler Sounds During Thinking
7. Voice Personality Consistency
8. Breathing and Micro-Pauses
9. Speaking Rate Matching
10. Interruption Handling
11. Speech-to-Speech Alternatives
12. Voice Cloning
13. Cantonese-Specific TTS
14. Implementation Roadmap

---

## Component Overview

| #  | Component                      | What It Does                                                              | Current Status in Our System         |
|----|--------------------------------|---------------------------------------------------------------------------|--------------------------------------|
| 1  | Prosody Control                | Pitch, rate, volume, emphasis — avoid monotone robot voice                | Partial (ElevenLabs defaults only)   |
| 2  | Backchanneling                 | AI says "mhm", "right", "I see" while user is still talking              | Not implemented                      |
| 3  | Background Ambience            | Subtle coffee shop or office sounds — AI feels like it is in a real place | Not implemented                      |
| 4  | Turn-Taking                    | Know when user is DONE speaking vs just pausing to think                  | Basic (fixed silence timer only)     |
| 5  | Emotion Detection              | Detect user mood from voice, adjust AI tone accordingly                   | Not implemented                      |
| 6  | Filler Sounds                  | "Hmm...", "Let me think..." during LLM thinking time — masks latency     | Not implemented                      |
| 7  | Voice Personality Consistency  | Same character across all turns — never breaks persona                    | Partial (system prompt only)         |
| 8  | Breathing and Micro-Pauses     | Natural breaths between phrases — avoids machine gun delivery             | Not implemented                      |
| 9  | Speaking Rate Matching         | Mirror user speed — fast user gets faster AI, slow user gets slower AI    | Not implemented                      |
| 10 | Interruption Handling          | Graceful barge-in with fade out instead of hard cut                       | Partial (hard cut only)              |

---

## 1. PROSODY CONTROL

**What it is:** Making voice output sound natural — controlling pitch, rate, volume, emphasis, and emotional tone so the AI does not sound monotone.

### Option A: ElevenLabs Text Formatting (Current Stack — Easy Win)

ElevenLabs does not support full SSML. Instead, prosody is controlled through text formatting:

**For Eleven v2 / Turbo v2.5 (our current model):**

- Break tags: `<break time="1.5s"/>` inserts pauses up to 3 seconds
- Punctuation: commas for short pauses, em-dashes (--) for medium, ellipsis (...) for trailing pauses
- Exclamation marks increase emotional intensity
- ALL CAPS on short words adds emphasis
- `previous_text` / `next_text` API parameters provide context for better prosody across chunks
- `speed` parameter: 0.7 to 1.3 (default 1.0) controls speaking rate

**Effort:** Easy | **Impact:** Medium | **Cost:** Free (already on ElevenLabs plan) | **Cantonese:** Yes

### Option B: ElevenLabs v3 Audio Tags (Upgrade — High Impact)

ElevenLabs v3 introduces Audio Tags in square brackets with 1,806+ documented tags:

**Emotional / Delivery Tags:**
- `[excited]`, `[nervous]`, `[frustrated]`, `[calm]`, `[sorrowful]`
- `[whispers]`, `[laughs]`, `[sigh]`, `[gasps]`, `[gulps]`
- `[rushed]`, `[stammers]`, `[drawn out]`, `[hesitates]`
- `[pause]`, `[short pause]`, `[long pause]`

**Character / Accent Tags:**
- `[British accent]`, `[Australian accent]`, `[Southern US accent]`
- `[sarcastically]`, `[matter-of-fact]`, `[dramatic]`

**Sound Effect Tags:**
- `[clapping]`, `[thunder]`, and many more

Tags are case-insensitive. Cantonese support on v3 is unclear.

**Effort:** Easy | **Impact:** High | **Cost:** Same ElevenLabs plan | **Cantonese:** Unclear

### Option C: Azure SSML for Cantonese

Azure provides the richest SSML extensions. Supported tags include:

- `<prosody rate="slow" pitch="+5%">` — control speed and pitch
- `<break time="500ms"/>` — insert pauses
- `<emphasis level="strong">` — stress words
- `<mstts:express-as style="cheerful" styledegree="1.5">` — emotional styles (English voices only, NOT available for zh-HK voices)

Azure zh-HK voices (HiuMaanNeural, WanLungNeural, HiuGaaiNeural) support `<prosody>` tags (rate, pitch, volume) but NOT `mstts:express-as` styles.

**Pricing:** Free tier: 500K characters/month. Standard: $16 per 1M characters.

**Effort:** Easy | **Impact:** Medium | **Cost:** $16/1M chars | **Cantonese:** Yes (prosody only, no emotion styles)

### Option D: Cartesia Sonic-3 (Alternative TTS Provider)

Cartesia offers explicit parametric control over emotion, speed, and volume:

```
{
  "speed": 1.0,
  "volume": 1.0,
  "emotion": ["excited:high", "content:low"]
}
```

60+ emotions available including: happy, excited, enthusiastic, calm, grateful, frustrated, sarcastic, contemplative, determined, and many more. Emotion levels: lowest, low, high, highest.

**Latency:** ~90ms time-to-first-audio (among the fastest in the industry).

**Effort:** Medium | **Impact:** High | **Cost:** $0.03/minute | **Cantonese:** Mandarin only (not Cantonese)

### Option E: Open-Source AI-Driven Prosody Models

| Model          | Type        | Notes                                                | Cantonese              |
|----------------|-------------|------------------------------------------------------|------------------------|
| Qwen3-TTS      | Open source | Natural language prosody instructions. Released 2026. | Chinese (unclear on Cantonese) |
| CosyVoice 3.0  | Open source | 150ms first-packet latency, streaming               | Yes (Guangdong/Cantonese)      |
| FishAudio      | Open source | Fine-grained emotion/tone control                    | Multiple languages             |
| StyleTTS2      | Open source | Style diffusion, best prosody quality                | English only                   |

All require Python inference server with GPU. Integration difficulty: Hard.

### Prosody Control — Recommendation

| Approach                                        | Effort | Impact | Recommended           |
|-------------------------------------------------|--------|--------|-----------------------|
| Use ElevenLabs text formatting tricks (English)  | Easy   | Medium | YES — do now          |
| Upgrade to ElevenLabs v3 with Audio Tags         | Easy   | High   | YES — major gain      |
| Use Azure SSML prosody for Cantonese             | Easy   | Medium | YES — already on Azure|
| Add Cartesia as alternative TTS                  | Medium | High   | CONSIDER later        |
| Self-host open-source prosody model              | Hard   | Varies | NOT YET               |

---

## 2. BACKCHANNELING

**What it is:** The AI produces small acknowledgment sounds ("mhm", "right", "I see") while the user is still speaking, signaling active listening. This is one of the strongest human conversation cues.

### Option A: DIY Implementation (Recommended)

Since we control the WebSocket pipeline, we can implement backchanneling directly:

**Architecture:**
1. User is speaking (Deepgram interim results flowing)
2. Backchannel timing logic on Node.js server detects:
   - User has spoken 3+ seconds continuously
   - There is a natural pause (200-400ms from interim results)
   - No backchannel was played in the last 5 seconds
3. Server sends pre-recorded backchannel audio clip to browser
4. Audio plays at quiet volume (30-50% of main TTS volume) without interrupting STT

**Pre-recorded clips needed:**

English: "mhm" (x3 variants), "right" (x3), "I see" (x3), "yeah" (x3), "okay" (x3)

Cantonese: "係啊" hai6 aa3 (x3), "嗯" ng2 (x3), "明白" ming4 baak6 (x3)

Each clip: 200-500ms duration. Store as short MP3 files. Randomize selection to avoid repetition.

**Key timing parameters:**
- Minimum user speech before first backchannel: 3 seconds
- Cooldown between backchannels: 4-8 seconds (randomized)
- Volume: 30-50% of main TTS volume
- Frequency: roughly every 6-10 seconds of user speech

**Effort:** Medium | **Impact:** High | **Cost:** Free | **Cantonese:** Yes

### Option B: Retell AI (Full Platform)

Retell provides the most turnkey backchannel implementation:

- `enable_backchannel`: true/false
- `backchannel_frequency`: 0 (never) to 1 (always), default 0.8
- `backchannel_words`: customizable per language

However, this requires using Retell's full platform — you cannot use just the backchannel feature in isolation.

**Effort:** Hard | **Impact:** High | **Cost:** $0.07-0.08/min | **Cantonese:** No

### Option C: Vapi (Full Platform)

Vapi uses a proprietary fusion audio-text model to determine the best moment to backchannel. Configuration via `stopSpeakingPlan`. Also requires their full platform.

**Effort:** Hard | **Impact:** High | **Cost:** $0.05-0.15/min | **Cantonese:** No

### Backchanneling — Recommendation

DIY is the clear winner. We already own the pipeline. Record 15-20 short audio clips, add timing logic to server.js, and play them at low volume. Free, works for both English and Cantonese.

---

## 3. BACKGROUND AMBIENCE

**What it is:** Adding subtle environmental sounds (coffee shop, office, street) to make the AI feel like it is in a physical space rather than a void.

### Sound Libraries (All Free)

| Library               | License                 | Sounds Available                                  |
|-----------------------|-------------------------|---------------------------------------------------|
| Freesound             | CC0 / CC-BY             | 685,000+ sounds. Coffee shops, offices, nature    |
| Mixkit                | Mixkit License (free)   | 36+ ambience tracks                               |
| Pixabay Sound Effects | Pixabay License (free)  | Ambient backgrounds, office, rain                 |
| BBC Sound Effects     | Personal/educational    | 33,000+ sounds, high quality                      |

**Recommended:** Download 3-5 looping ambient tracks (coffee shop, office, outdoor) as MP3 files, 30-60 seconds each, designed to loop seamlessly.

### Audio Mixing Options

**Option A: Howler.js (Simplest)**

Lightweight library (10KB). Three lines of code to play a looping ambient track:

```javascript
const ambient = new Howl({
  src: ['/sounds/coffee-shop.mp3'],
  loop: true,
  volume: 0.1,
  html5: true
});
ambient.play();
```

**Option B: Web Audio API (Full Control)**

Native browser API. Allows mixing, spatial audio (3D positioning), volume ducking when user speaks, and fine-grained control.

**Option C: Tone.js (Overkill)**

150KB framework designed for music synthesis. Too heavy for simple ambience.

### Preventing Microphone Feedback

Critical: ambient audio must NOT feed back into the microphone and confuse STT.

Solutions:
1. Browser's built-in echo cancellation: `getUserMedia({ audio: { echoCancellation: true } })`
2. Headphones eliminate the problem entirely
3. Volume ducking: lower ambient volume when user is speaking, raise when AI is speaking

**Effort:** Easy | **Impact:** Medium | **Cost:** Free | **Cantonese:** N/A (language-independent)

---

## 4. TURN-TAKING

**What it is:** Determining when the user has finished speaking versus just pausing mid-thought. This is widely considered the hardest problem in voice AI. Getting it wrong means either cutting the user off or having awkward long silences.

### Option A: Improve Current Silence Timer (Quick Win)

Without adding any new services, improve turn detection with logic changes:

1. **Dynamic silence threshold based on context:**
   - After AI asks a question: wait 1500-2000ms (user is thinking)
   - After user says "um" or "uh": wait 1200ms (user is formulating)
   - Mid-sentence (no period/question mark): wait 1000ms
   - After a complete-sounding sentence: wait 600ms

2. **Deepgram `utterance_end_ms` parameter:** Set to 1200ms in Deepgram connection params to fine-tune when Deepgram considers an utterance finished.

3. **Text completeness check:** If transcript ends with "and", "but", "so", "because" — the user is not done.

4. **Word count factor:** If user said only 1-2 words, wait longer. If 10+ words ending with punctuation, they are likely done.

**Effort:** Easy | **Impact:** Medium | **Cost:** Free | **Cantonese:** Partial

### Option B: AssemblyAI Semantic Endpointing (Replace Deepgram)

Neural network combining semantic + acoustic cues. Predicts a special end-of-turn token during transcription. Built into their Universal-Streaming STT.

- Latency: ~150ms P50 from VAD endpoint to final transcript
- Parameters: `end_of_turn_confidence_threshold` + `max_turn_silence` fallback
- Node.js SDK available — direct WebSocket integration

**Effort:** Medium | **Impact:** High | **Cost:** $0.15/hour | **Cantonese:** English only

### Option C: LiveKit EOU Model (Open Source, Python Sidecar)

A 500M parameter transformer model (Qwen2.5-0.5B-Instruct distilled from 7B teacher) fine-tuned to predict end-of-turn from transcribed text.

- Uses sliding window of last 4 conversation turns
- 39% reduction in false-positive interruptions vs previous version
- Inference: ~50ms, ~400MB RAM
- Languages: 14 including English, Chinese, Hindi, Japanese, Korean
- License: Apache 2.0 (free)

Requires Python sidecar service or ONNX conversion for Node.js.

**Effort:** Hard | **Impact:** High | **Cost:** Free | **Cantonese:** Yes (via Chinese)

### Option D: Pipecat Smart Turn v3 (Open Source, Audio-Based)

An 8M parameter model (Whisper Tiny backbone + linear classifier) that analyzes audio features — pitch, pace, intonation — in addition to text.

- Inference: ~10ms on fast CPU, ~65ms on cloud
- 99% accuracy on human English benchmark
- Strategy: Wait for 200ms silence (VAD), then evaluate turn-shift confidence
- Available as hosted API on fal.ai or self-hosted
- License: BSD 2-clause (free)

**Effort:** Medium-Hard | **Impact:** High | **Cost:** Free or fal.ai API costs | **Cantonese:** Yes

### Option E: Krisp VIVA Turn-Taking v2

6.1M parameter audio-only model. No transcription required. Under 20ms processing. 3.5x accuracy improvement over baseline VAD.

Available only as C/C++ SDK (commercial). Would need FFI bindings for Node.js.

**Effort:** Hard | **Impact:** High | **Cost:** Commercial | **Cantonese:** No

### Turn-Taking — Recommendation

| Approach                                 | Effort | Impact | Cost      | Recommended           |
|------------------------------------------|--------|--------|-----------|-----------------------|
| Improve silence timer logic              | Easy   | Medium | Free      | YES — do first        |
| Tune Deepgram utterance_end_ms           | Easy   | Low-Med| Free      | YES — quick win       |
| AssemblyAI Universal-Streaming           | Medium | High   | $0.15/hr  | CONSIDER as STT swap  |
| LiveKit EOU model (Python sidecar)       | Hard   | High   | Free      | CONSIDER for v2       |
| Pipecat Smart Turn via fal.ai            | Medium | High   | API costs | CONSIDER              |
| Krisp VIVA                               | Hard   | High   | Commercial| NOT NOW               |

---

## 5. EMOTION DETECTION

**What it is:** Detecting the user's emotional state from their voice to dynamically adjust AI response tone, word choice, and TTS delivery.

### Option A: Text Sentiment via LLM Prompt (Easiest)

Add to the LLM system prompt: "Analyze the user's tone from their words. If they sound frustrated, respond with extra patience and empathy. If they sound happy, match their energy."

The LLM already understands sentiment from text. This is free and requires zero infrastructure.

**Effort:** Easy | **Impact:** Low | **Cost:** Free | **Cantonese:** Yes

### Option B: Hume AI Expression Measurement API

The most comprehensive emotion AI platform. Two products:

1. **Expression Measurement API:** Analyzes audio for 48 emotion dimensions (joy, sadness, anger, confusion, etc.). Real-time streaming via WebSocket. Measures prosody (tune, rhythm, timbre).

2. **EVI (Empathic Voice Interface):** Full voice AI that adjusts responses based on detected emotions. Built-in emotion-aware LLM.

TypeScript SDK available. Pricing: Free tier (~5 min EVI/month), Starter $3/month, Creator $14/month.

**Effort:** Medium | **Impact:** High | **Cost:** $3+/month | **Cantonese:** Not explicitly supported

### Option C: SenseVoice (Open Source — Best for Cantonese)

Alibaba's SenseVoice combines ASR + emotion detection + audio event detection in one model.

- Languages: Mandarin, **Cantonese**, English, Japanese, Korean
- Emotions: Happy, Sad, Angry, Neutral
- Outperforms Whisper by 50%+ on Chinese/Cantonese accuracy
- License: Open source

Requires Python sidecar service.

**Effort:** Hard | **Impact:** High | **Cost:** Free | **Cantonese:** YES (native support)

### Using Detected Emotion to Adjust AI Response

Once emotion is detected, the pipeline works like this:

1. Detected emotion: "frustrated"
2. Modify LLM system prompt: "The user sounds frustrated. Respond with extra patience and empathy."
3. Modify TTS output:
   - Azure: `<mstts:express-as style="empathetic">`
   - ElevenLabs v3: `[gentle] [calm]`
   - Cartesia: `emotion: ["sympathetic:high", "calm:high"]`

### Emotion Detection — Recommendation

| Approach                        | Effort | Impact | Cost      | Recommended           |
|---------------------------------|--------|--------|-----------|-----------------------|
| Text sentiment via LLM          | Easy   | Low    | Free      | YES — add to prompt   |
| Hume Expression Measurement     | Medium | High   | $3+/month | CONSIDER for English  |
| SenseVoice (self-hosted)        | Hard   | High   | Free      | CONSIDER for Cantonese|

---

## 6. FILLER SOUNDS DURING THINKING

**What it is:** Masking LLM inference latency (typically 300-1000ms) with natural-sounding filler audio so the user does not experience dead silence while the AI thinks.

### Option A: Pre-Recorded Filler Clips (Recommended)

Generate a library of filler sounds using ElevenLabs or Azure TTS, save as MP3 files:

**English fillers:**
- "Hmm..." (500ms)
- "Let me think..." (800ms)
- "That's a great question..." (1200ms)
- "So..." (400ms)
- "Well..." (400ms)
- Inhale/breath sound (300ms)

**Cantonese fillers:**
- "嗯..." (ng2, 500ms)
- "等我諗諗..." (dang2 ngo5 nam2 nam2, 800ms) — "Let me think"
- "咁呢..." (gam2 ne1, 400ms) — "Well then..."
- "好問題..." (hou2 man6 tai4, 800ms) — "Good question"

Create 3-4 variants of each to avoid repetition. Include slight breathing sounds before some fillers.

### Timing Logic

- t=0ms: User finishes speaking, start LLM inference
- t=300ms: Check — has LLM started streaming tokens?
  - YES: Skip filler, start TTS on first tokens
  - NO: Play filler audio clip
- t=300-800ms: Filler plays
- t=500-1200ms: LLM tokens arrive, queue TTS
- Filler ends, seamlessly transition to actual response

**Key thresholds:**
- LLM responds in under 300ms: No filler needed (feels natural)
- LLM takes 300-800ms: Short filler ("hmm", breath)
- LLM takes 800ms+: Longer filler ("let me think about that")
- Never play filler for simple responses (greetings, confirmations) — cache these instead

### How Industry Leaders Handle This

| Platform | Approach                                                                           |
|----------|------------------------------------------------------------------------------------|
| Vapi     | Configurable filler injection with custom phrases                                  |
| Retell   | Automatic filler sounds when agent is processing                                   |
| Sierra   | Does NOT use fillers. Optimizes latency through parallel execution. Pre-computes frequent phrases for zero-latency playback. |
| LiveKit  | Relies on fast pipeline (no explicit filler feature)                               |

Sierra's insight: Genuine latency reduction is better than masking. Frequent phrases can be pre-computed and cached.

### Filler Sounds — Recommendation

| Approach                      | Effort | Impact | Cost | Recommended      |
|-------------------------------|--------|--------|------|------------------|
| Pre-recorded filler clips     | Easy   | High   | Free | YES — do first   |
| Cache common responses        | Medium | High   | Free | YES — greetings  |
| Dynamic filler via fast TTS   | Medium | Medium | TTS  | LATER            |
| Optimize LLM latency          | Medium | High   | Free | YES — parallel   |

---

## 7. VOICE PERSONALITY CONSISTENCY

**What it is:** Maintaining a consistent voice character, tone, and personality across all turns in a conversation so the AI sounds like the same "person" throughout.

### ElevenLabs Voice Settings (Tune These)

| Setting          | Range   | What It Controls                              | Current Value | Recommended Value |
|------------------|---------|-----------------------------------------------|---------------|-------------------|
| stability        | 0.0-1.0 | Consistency vs expressiveness                  | 0.4           | 0.45-0.55         |
| similarity_boost | 0.0-1.0 | How closely output matches original voice      | 0.8           | 0.75-0.85 (keep)  |
| style            | 0.0-1.0 | Amplifies speaker style. Increases latency.    | 0.3           | 0.0-0.1 (lower!)  |
| use_speaker_boost| boolean | Enhances voice clarity                          | true          | true (keep)       |
| speed            | 0.7-1.3 | Speaking rate multiplier                        | not set       | 1.0 (add default) |

**Key change:** Lower `style` from 0.3 to 0.0-0.1. This reduces latency and improves consistency.

### Cross-Turn Consistency

- Keep TTS settings constant across all turns
- Use ElevenLabs `previous_request_ids` parameter to maintain prosody flow between turns
- Use `previous_text` / `next_text` parameters for context
- Never mix TTS providers mid-conversation (unless switching language)

### LLM Personality Prompt

Add personality rules to the system prompt:

**English example:**
- Speak in short, conversational sentences (8-15 words max)
- Use contractions naturally (I'm, you're, that's, we'll)
- Occasionally use casual affirmations ("Sure thing", "Absolutely")
- Never use formal language ("Furthermore", "Please be advised")
- Express empathy with "I totally understand" not "I comprehend your concern"
- Never start two consecutive responses the same way

**Cantonese example:**
- Use spoken Cantonese, not written Chinese
- Keep sentences short (8-15 characters)
- Use sentence-final particles (啦、嘅、喎、嘛)
- Express empathy: "明白嘅", "係呀，我理解"

**Effort:** Easy | **Impact:** High | **Cost:** Free

---

## 8. BREATHING AND MICRO-PAUSES

**What it is:** Adding natural breathing sounds and micro-pauses between phrases to avoid the "machine gun" delivery of continuous TTS output.

### Which TTS Engines Support Natural Breathing

| Engine               | Auto-Breathing | Manual Control                              |
|----------------------|----------------|---------------------------------------------|
| ElevenLabs v2/Turbo  | Minimal        | `<break>` tags                              |
| ElevenLabs v3        | Better         | `[pause]`, `[short pause]`, `[long pause]`, `[sigh]` |
| Azure Neural         | Yes (basic)    | `<break>`, `<prosody>`                      |
| Amazon Polly         | Yes (optional) | `<amazon:auto-breaths>` — ONLY engine with explicit auto-breathing |
| Cartesia Sonic-3     | Yes (natural)  | Speed/emotion controls                      |

### Text Preprocessing Approach (Easiest)

Before sending text to TTS, insert pause markers at clause boundaries:

- Replace ", " with ", -- " (adds medium pause after commas)
- Replace ". " with ". ... " (adds trailing pause between sentences)
- Add ellipsis for natural trailing: "I understand your concern... Let me check that for you."

### ElevenLabs Tips

- Low stability values (0.3-0.5) produce more variation including breath-like pauses
- Em-dashes and ellipses in text create natural pause points
- v3 model naturally adds micro-pauses at clause boundaries
- v3 audio tags: `[sigh]`, `[pause]` for explicit control

### DIY Post-Processing

Insert 50-150ms of shaped pink noise (at -40dB) between TTS chunks to simulate breathing gaps. Or insert pre-recorded breath sounds (inhale: 200-300ms, exhale: 100-200ms) between sentences at the audio buffer level.

**Effort:** Easy (text preprocessing) to Medium (audio post-processing) | **Cost:** Free | **Cantonese:** Works for both languages

---

## 9. SPEAKING RATE MATCHING

**What it is:** Dynamically adjusting AI speaking speed to mirror the user's pace. Fast speakers get a faster AI; slow speakers get a slower AI. This creates subconscious rapport.

### Detecting User Speaking Rate

Deepgram provides word-level timestamps. Calculate words per minute:

```
WPM = word_count / ((last_word_end - first_word_start) / 60)
```

Typical speaking rates:
- Slow: under 120 WPM
- Normal: 120-160 WPM
- Fast: 160-200 WPM
- Very fast: over 200 WPM

Note: Cantonese WPM is typically lower than English due to character density. Use syllables-per-minute (~100-130 SPM) for Cantonese.

### Rate Matching Algorithm

Calculate target TTS rate: `rate = 1.0 + (user_ratio - 1.0) * 0.5`

This "meets halfway" — a user at 180 WPM gets TTS rate 1.1, a user at 120 WPM gets 0.9.

Clamp to safe range: 0.8 to 1.2. Use exponential moving average to avoid abrupt changes.

### TTS Speed Parameters

| Engine      | Speed Parameter                    | Range           |
|-------------|------------------------------------|-----------------|
| ElevenLabs  | `speed` in API request             | 0.7 to 1.3     |
| Azure       | `<prosody rate="">` in SSML        | -50% to +100%   |
| Cartesia    | `generation_config.speed`          | 0.6 to 1.5     |

### Industry Status

No major platform offers automatic speaking rate matching as a built-in feature. This would be a differentiating feature if implemented.

**Effort:** Medium | **Impact:** Medium-High | **Cost:** Free | **Cantonese:** Yes (adjust baseline)

---

## 10. INTERRUPTION HANDLING

**What it is:** Gracefully managing when the user talks over the AI (barge-in). Our current implementation does a hard cut which sounds jarring and unnatural.

### Current Problem

Our current server.js detects barge-in and immediately stops AI speech. This creates an abrupt, jarring experience.

### Solution A: Fade-Out Instead of Hard Cut

Use Web Audio API to fade out AI speech over 100-200ms using exponential ramp:

- Use `exponentialRampToValueAtTime` (not linear) for natural-sounding fade
- Target volume 0.001 (not 0, because exponential ramp cannot reach zero)
- Duration of 100-200ms sounds immediate but avoids audio clicks
- After fade completes, stop the TTS source and reset gain to 1.0

**Effort:** Easy | **Impact:** High | **Cost:** Free

### Solution B: AI Acknowledgment of Interruption

After detecting barge-in, play a pre-recorded acknowledgment clip immediately (zero latency):

- "Oh, sorry — go ahead."
- "Sure, what's that?"
- "Yes?"

Then let the LLM process the user's actual input. Also inject context into the LLM: "[User interrupted your previous response. Acknowledge briefly and address their new input.]"

**Effort:** Easy | **Impact:** Medium | **Cost:** Free

### Solution C: Smart Interruption Classification

Not all interruptions mean "stop talking." Some are backchannels ("yeah", "right", "mhm"). The system should:

1. Check if the interruption text matches backchannel patterns
2. If backchannel: continue AI speech, do not stop
3. If genuine interruption (3+ words, different topic): fade out and address new input

Vapi handles this with their `stopSpeakingPlan` configuration and `numWords` threshold.

**Effort:** Medium | **Impact:** High | **Cost:** Free

---

## 11. SPEECH-TO-SPEECH ALTERNATIVES

These replace the entire STT + LLM + TTS pipeline with a single model that handles audio in and audio out natively.

### OpenAI Realtime API

- WebSocket-based real-time bidirectional audio
- Native speech-to-speech (model handles prosody naturally)
- Can laugh, whisper, express emotion natively
- Supports barge-in
- Latency: ~250ms
- Pricing: Input audio $40/1M tokens, Output audio $80/1M tokens
- Cantonese: Listed as "Chinese" — uncertain if Cantonese specifically works well

### Google Gemini Live API

- Real-time voice and video interactions
- Affective dialog: adapts response style to match user expression
- Multimodal: audio + video + text simultaneously
- 97 languages supported
- Models: Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 3.1 Flash Live
- Pricing: Free tier available
- Cantonese: Listed as "Chinese" — NOT listed as separate language

### Comparison with Our Current Pipeline

| Aspect              | Our Pipeline (Deepgram+Gemini+ElevenLabs) | OpenAI Realtime    | Gemini Live        |
|---------------------|--------------------------------------------|--------------------|--------------------|
| Latency             | ~500-1000ms                                | ~250ms             | Low                |
| Cost per minute     | ~$0.05-0.10                                | Higher ($40-80/1M tokens) | Free tier available |
| Cantonese           | YES (proven)                               | Uncertain          | Uncertain          |
| Control/Customization| Full (we own every layer)                  | Limited            | Limited            |
| Prosody quality     | Depends on TTS provider                    | Native, natural    | Native, natural    |
| Implementation      | Already built                              | Easier (one API)   | Easier (one API)   |

---

## 12. VOICE CLONING

### Platform Comparison

| Platform             | Cantonese | Audio Needed          | Method                  | Cost                |
|----------------------|-----------|-----------------------|-------------------------|---------------------|
| ElevenLabs Instant   | Yes       | 1-5 minutes           | Neural voice cloning    | $5-330/month        |
| ElevenLabs Professional | Yes    | 30 min - 3 hours      | Professional cloning    | $5-330/month        |
| Qwen3-TTS            | Yes       | 3 seconds (zero-shot) | Open source cloning     | Free (Apache 2.0)   |
| CosyVoice 3.0        | Yes       | Zero-shot             | Open source cloning     | Free (Apache 2.0)   |
| Azure Custom Neural   | Yes       | 30 min - 3 hours      | Custom voice training   | $52/compute hr + $24/1M chars |

### Best Options

1. **Best quality (paid):** ElevenLabs Professional Voice Clone with 1-3 hours of Cantonese audio
2. **Best free option:** Qwen3-TTS — only 3 seconds of audio needed
3. **Best dialect coverage:** CosyVoice 3.0 — 18+ Chinese dialects
4. **Best enterprise option:** Azure Custom Neural Voice — full zh-HK support

---

## 13. CANTONESE-SPECIFIC TTS

### Open-Source Models with Confirmed Cantonese Support

**Qwen3-TTS (Alibaba, January 2026) — TOP PICK**
- 1.7B parameters
- Cantonese: Full dialect support (Beijing, Sichuan, Cantonese, Minnan, Wu, and more)
- Voice cloning: 3 seconds of reference audio
- Emotion control via text prompts
- Performance: Beats ElevenLabs Multilingual v2 on similarity (0.789) and WER (1.835%)
- License: Apache 2.0

**CosyVoice 3.0 (Alibaba, December 2025)**
- 18+ Chinese dialects including Guangdong (Cantonese)
- Streaming: 150ms first-packet latency
- Character error rate: 0.81%
- Zero-shot voice cloning
- License: Apache 2.0

**IndexTTS2 (2025)**
- Cantonese among Chinese dialects
- Streaming: 150ms latency
- First AR-TTS with precise synthesis duration control

**SenseVoice (Alibaba) — For STT + Emotion**
- Mandarin, Cantonese, English, Japanese, Korean
- Combined ASR + emotion detection + audio event detection
- Outperforms Whisper by 50%+ on Chinese/Cantonese

All require Python server deployment. Integration: Node.js WebSocket server connects to Python TTS server via gRPC or FastAPI.

---

## 14. IMPLEMENTATION ROADMAP

### Phase 1 — Easy Wins (1-2 days)

| # | Task                                           | Effort | Impact | Cost |
|---|------------------------------------------------|--------|--------|------|
| 1 | Pre-recorded filler sounds (EN + Cantonese)    | Easy   | High   | Free |
| 2 | Fade-out on barge-in (replace hard cut)         | Easy   | High   | Free |
| 3 | Text preprocessing for breathing pauses         | Easy   | Medium | Free |
| 4 | Tune ElevenLabs settings (style to 0.0)         | Easy   | Medium | Free |
| 5 | Dynamic silence thresholds for turn-taking      | Easy   | Medium | Free |
| 6 | Background ambience via Howler.js               | Easy   | Medium | Free |

### Phase 2 — Medium Effort (3-5 days)

| # | Task                                           | Effort | Impact | Cost |
|---|------------------------------------------------|--------|--------|------|
| 7 | DIY backchanneling with timing logic           | Medium | High   | Free |
| 8 | Speaking rate matching from Deepgram timestamps | Medium | Med-Hi | Free |
| 9 | Upgrade to ElevenLabs v3 Audio Tags            | Easy   | High   | Same |
| 10| Emotion detection via LLM prompt injection     | Easy   | Low    | Free |

### Phase 3 — Advanced (1-2 weeks)

| # | Task                                           | Effort | Impact | Cost |
|---|------------------------------------------------|--------|--------|------|
| 11| SenseVoice for Cantonese emotion detection     | Hard   | High   | Free |
| 12| LiveKit EOU or Pipecat Smart Turn              | Hard   | High   | Free |
| 13| Qwen3-TTS or CosyVoice for free Cantonese TTS | Hard   | High   | Free |

### Quick Reference: Technology Decision Matrix

| Need                          | Best Paid Option                    | Best Free/Open Source Option          |
|-------------------------------|-------------------------------------|---------------------------------------|
| Cantonese TTS                 | ElevenLabs or Azure (zh-HK)        | Qwen3-TTS or CosyVoice 3.0           |
| Cantonese voice cloning       | ElevenLabs Professional Clone       | Qwen3-TTS (3s) or CosyVoice          |
| Emotional TTS                 | Azure DragonHD (auto-emotion)       | Qwen3-TTS (multilingual)             |
| Backchanneling                | Retell AI or Vapi                   | Custom build (DIY)                    |
| Turn detection                | AssemblyAI Semantic Endpointing     | LiveKit EOU or Pipecat Smart Turn     |
| Speech-to-speech              | OpenAI Realtime API                 | N/A (no free option yet)              |
| Background audio mixing       | N/A                                 | Web Audio API + Howler.js             |
| Prosody control               | Azure SSML styles + DragonHD        | Bark brackets or StyleTTS2            |
| Full voice AI framework       | Vapi or Retell AI                   | Pipecat or LiveKit Agents             |

---

**END OF REPORT**
