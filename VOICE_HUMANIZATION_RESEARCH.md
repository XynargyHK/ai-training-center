# Voice AI Humanization: Comprehensive Research Report

> **Date:** 2026-03-27
> **Current Stack:** Deepgram STT | GPT-4o-mini LLM | ElevenLabs TTS (English) | Azure TTS (Cantonese) | Node.js + WebSocket
> **Purpose:** Evaluate all available technologies and approaches for making AI voice conversations sound human-like and natural.

---

## Table of Contents

1. [Prosody Control](#1-prosody-control)
2. [Backchanneling](#2-backchanneling)
3. [Background Ambience](#3-background-ambience)
4. [Turn-Taking](#4-turn-taking)
5. [Emotion Detection](#5-emotion-detection)
6. [Filler Sounds During Thinking](#6-filler-sounds-during-thinking)
7. [Voice Personality Consistency](#7-voice-personality-consistency)
8. [Breathing and Micro-Pauses](#8-breathing-and-micro-pauses)
9. [Speaking Rate Matching](#9-speaking-rate-matching)
10. [Interruption Handling](#10-interruption-handling)

---

## 1. PROSODY CONTROL

Making voice output sound natural, not monotone -- controlling pitch, rate, volume, emphasis, and emotional tone.

### 1A. SSML (Speech Synthesis Markup Language)

SSML is an XML-based markup language supported by Azure, Google Cloud TTS, and Amazon Polly. ElevenLabs does NOT support SSML (except limited `<break>` tags on non-v3 models).

#### Complete SSML Tag Reference

| Tag | What It Does | Azure | Google | Amazon | Example |
|-----|-------------|-------|--------|--------|---------|
| `<speak>` | Root element (required) | Yes | Yes | Yes | `<speak>...</speak>` |
| `<voice>` | Select voice/language | Yes | Yes | No | `<voice name="en-US-JennyNeural">` |
| `<prosody>` | Control pitch, rate, volume | Yes | Yes | Yes | `<prosody rate="slow" pitch="+5%">` |
| `<break>` | Insert pause | Yes | Yes | Yes | `<break time="500ms"/>` |
| `<emphasis>` | Stress a word | Yes | Yes | Yes | `<emphasis level="strong">now</emphasis>` |
| `<say-as>` | Pronunciation hints (dates, numbers) | Yes | Yes | Yes | `<say-as interpret-as="cardinal">42</say-as>` |
| `<phoneme>` | Exact pronunciation (IPA) | Yes | Yes | Yes | `<phoneme alphabet="ipa" ph="...">` |
| `<sub>` | Substitution (read X as Y) | Yes | Yes | Yes | `<sub alias="World Wide Web">WWW</sub>` |
| `<audio>` | Embed audio clip | No | Yes | Yes | `<audio src="url.mp3"/>` |
| `<p>`, `<s>` | Paragraph/sentence structure | Yes | Yes | Yes | Adds natural pauses between |
| `<mark>` | Bookmark event for sync | Yes | Yes | No | `<mark name="highlight"/>` |

#### `<prosody>` Attribute Details

| Attribute | Values | Effect |
|-----------|--------|--------|
| `rate` | `x-slow`, `slow`, `medium`, `fast`, `x-fast`, or `+/-N%` | Speaking speed |
| `pitch` | `x-low`, `low`, `medium`, `high`, `x-high`, or `+/-Nhz`, `+/-N%` | Voice pitch |
| `volume` | `silent`, `x-soft`, `soft`, `medium`, `loud`, `x-loud`, or `+/-NdB` | Loudness |
| `contour` | `(time%, pitch)` pairs | Pitch curve over time |
| `range` | Same as pitch values | Pitch variation range |

#### Azure-Specific SSML Extensions

Azure provides the richest SSML extensions via the `mstts` namespace:

```xml
<mstts:express-as style="cheerful" styledegree="1.5" role="YoungAdultFemale">
  I'm so happy to help you today!
</mstts:express-as>
```

**Full list of Azure voice styles (100+ for Dragon HD Omni voices):**
- **Common:** cheerful, sad, angry, excited, friendly, hopeful, terrified, shouting, whispering, empathetic, calm
- **Extended:** advertisement_upbeat, affectionate, assistant, chat, customerservice, depressed, disgruntled, documentary-narration, embarrassed, envious, fearful, gentle, lyrical, narration-professional, narration-relaxed
- **Dragon HD Omni (newest):** chill surfer, confused, curious, determined, disgusted, emo teenager, encouraging, grateful, joyful, mad scientist, meditative, new yorker, news, reflective, regretful, relieved, santa, shy, soft voice, surprised (and ~80 more)

**`styledegree`:** 0.01 to 2.0 (default 1.0, 2.0 = maximum expressiveness)

**Cantonese (zh-HK) support:** Azure supports `<prosody>` tags (rate, pitch, volume) for zh-HK-HiuMaanNeural. However, `mstts:express-as` voice styles are NOT available for the zh-HK voices -- style support is limited to specific en-US, zh-CN voices.

- **Docs:** https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice
- **Language support:** https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- **Pricing:** Free tier: 500K characters/month. Standard: $16/1M characters (~$1/hour)

#### Google Cloud TTS SSML

Google supports standard SSML plus `<par>` and `<seq>` for parallel/sequential audio timing. Cantonese (yue-HK) is supported but with fewer voices.

- **Docs:** https://docs.cloud.google.com/text-to-speech/docs/ssml
- **Pricing:** Free: 1M standard chars/month, 4M WaveNet chars/month. Standard: $4/1M chars, WaveNet: $16/1M chars

#### Amazon Polly SSML

Amazon adds proprietary extensions:
- `<amazon:effect name="whispered">` -- whispering
- `<amazon:domain name="news">` -- newscaster style
- `<amazon:effect phonation="soft">` -- soft speaking
- `<amazon:auto-breaths>` -- automatic breathing sounds

No Cantonese support.

- **Docs:** https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html
- **Pricing:** Free: 5M chars/month (12 months). Standard: $4/1M chars, Neural: $16/1M chars

### 1B. ElevenLabs Text Formatting (No SSML)

ElevenLabs ignores SSML except for `<break>` tags on non-v3 models. Instead, they use:

#### For Eleven v2 / Turbo v2.5 (your current model):
- **`<break time="1.5s"/>`** -- pauses up to 3 seconds (supported via API)
- **Punctuation:** commas for short pauses, em-dashes (--) for medium, ellipsis (...) for trailing pauses
- **Exclamation marks** increase emotional intensity
- **ALL CAPS** for short words to add emphasis
- **`previous_text` / `next_text` API params** -- provide context for better prosody across chunks
- **`speed` param** -- 0.7 to 1.3 (default 1.0) to control speaking rate

#### For Eleven v3 (latest model):
v3 drops SSML break tags entirely and introduces **Audio Tags** in square brackets:

**Emotional / Delivery Tags:**
- `[excited]`, `[nervous]`, `[frustrated]`, `[calm]`, `[sorrowful]`
- `[whispers]`, `[laughs]`, `[sigh]`, `[gasps]`, `[gulps]`
- `[rushed]`, `[stammers]`, `[drawn out]`, `[hesitates]`
- `[pause]`, `[short pause]`, `[long pause]`

**Character / Accent Tags:**
- `[British accent]`, `[Australian accent]`, `[Southern US accent]`
- `[pirate voice]`, `[evil scientist voice]`, `[childlike tone]`
- `[sarcastically]`, `[matter-of-fact]`, `[dramatic]`

**Sound Effect Tags:**
- `[gunshot]`, `[clapping]`, `[explosion]`, `[thunder]`

There are 1,806+ documented tags across 15 categories. Tags are case-insensitive.

**Cantonese:** ElevenLabs supports Chinese (including Cantonese) on multilingual v2. Unclear if v3 fully supports Cantonese audio tags.

- **Docs:** https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- **v3 Audio Tags:** https://elevenlabs.io/blog/v3-audiotags
- **Pricing:** Free: 10K chars/month. Starter: $5/month (30K chars). Pro: $99/month (500K chars). Per-char overage: $0.06-$0.15/min depending on plan.

### 1C. Cartesia Sonic-3 Emotion/Speed Controls

Cartesia offers explicit, parametric control over emotion, speed, and volume via API:

```json
{
  "generation_config": {
    "speed": 1.0,
    "volume": 1.0,
    "emotion": ["excited:high", "content:low"]
  }
}
```

**Speed:** 0.6 to 1.5 (multiplier)
**Volume:** 0.5 to 2.0 (multiplier)

**Primary Emotions (best results):** neutral, angry, excited, content, sad, scared

**Full Emotion List (60+):** happy, excited, enthusiastic, elated, euphoric, triumphant, amazed, surprised, flirtatious, joking, curious, content, peaceful, serene, calm, grateful, affectionate, trust, sympathetic, anticipation, mysterious, angry, mad, outraged, frustrated, agitated, threatened, disgusted, contempt, envious, sarcastic, ironic, sad, dejected, melancholic, disappointed, hurt, guilty, bored, tired, rejected, nostalgic, wistful, apologetic, hesitant, insecure, confused, resigned, anxious, panicked, alarmed, scared, neutral, proud, confident, distant, skeptical, contemplative, determined

**Emotion Level:** `lowest`, `low`, `high`, `highest` (additive -- they push the model's output toward the tagged emotion)

**Important:** Emotion tags only work well when consistent with the text content.

**Cantonese:** Cartesia supports "Chinese" but does NOT explicitly confirm Cantonese as a distinct variant. Likely Mandarin-focused.

**Latency:** ~90ms time-to-first-audio (among the fastest)

- **Docs:** https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
- **Node.js SDK:** Available via npm (`@cartesia/cartesia-js`)
- **Pricing:** Free tier available. $0.03/minute. 1 credit per character.
- **Integration difficulty:** Easy (REST + WebSocket APIs, JS SDK)

### 1D. AI-Driven Prosody (Auto-Adjusting Models)

These models automatically infer appropriate prosody from text context:

| Model | Type | Notes | Cantonese |
|-------|------|-------|-----------|
| **VoxCPM** (OpenBMB) | Open-source, 0.5B params | Context-aware, auto-adapts style from content. Bilingual (EN/ZH). Open-sourced Sept 2025. | Mandarin (not Cantonese) |
| **Qwen3-TTS** (Alibaba) | Open-source | Natural language prosody instructions ("speak slowly with emphasis"). Released 2026. | Chinese (unclear on Cantonese) |
| **FishAudio S1-mini** | Open-source | Fine-grained emotion/tone/delivery control | Multiple languages |
| **VibeVoice** | Open-source | Natural prosody, stable voice identity, smooth turn-taking | Limited info |
| **Voxtral TTS** (Mistral) | Open-source, 4B params | 70ms latency, streaming, multilingual | Limited info |

**Integration difficulty for all:** Hard (requires Python inference, GPU, model hosting)

### 1E. Prosody Control -- Recommendation for Your Stack

| Approach | Effort | Impact | Recommended? |
|----------|--------|--------|-------------|
| **Use SSML `<prosody>` with Azure (Cantonese)** | Easy | Medium | YES -- already using Azure |
| **Use ElevenLabs text formatting tricks (English)** | Easy | Medium | YES -- punctuation, speed param |
| **Upgrade to ElevenLabs v3 with Audio Tags (English)** | Easy | High | YES -- major expressiveness gain |
| **Add Cartesia as alternative TTS** | Medium | High | CONSIDER -- best latency + emotion control |
| **Self-host open-source prosody model** | Hard | Variable | NOT YET -- requires GPU infra |

---

## 2. BACKCHANNELING

The AI produces small acknowledgment sounds ("mhm", "right", "I see") while the user is still speaking, signaling active listening.

### 2A. Retell AI Backchannel API

Retell provides the most turnkey backchannel implementation:

**API Configuration (Create Agent endpoint):**
```json
{
  "enable_backchannel": true,
  "backchannel_frequency": 0.8,
  "backchannel_words": ["okay", "uh-huh", "mhmm", "yah", "right", "I see"]
}
```

- `enable_backchannel`: boolean (default false)
- `backchannel_frequency`: 0 (never) to 1 (always when possible), default 0.8
- `backchannel_words`: customizable per language. Defaults vary by language and voice provider (ElevenLabs, OpenAI, Deepgram voices have different defaults)
- Supports 8 languages including English, Spanish, Hindi, German, French, Japanese, Portuguese
- Cantonese: Not explicitly listed

**Pricing:** $0.07-$0.08/min (voice engine) + $0.003-$0.08/min (LLM) + $0.015/min (telephony). Enterprise: ~$0.05/min.

**Integration difficulty:** Hard (requires using Retell's full platform, not just backchannel feature in isolation)

- **Docs:** https://docs.retellai.com/build/interaction-configuration

### 2B. Vapi Backchannel

Vapi uses a proprietary fusion audio-text model to determine:
1. The best moment to backchannel
2. Which backchannel cue is most appropriate

**Configuration via `stopSpeakingPlan`:**
```json
{
  "stopSpeakingPlan": {
    "numWords": 2,
    "voiceSeconds": 0.5,
    "backoffSeconds": 1
  }
}
```

Backchanneling is built into Vapi's orchestration -- the model decides when to interject "yeah" or "got it" based on audio + text analysis.

**Pricing:** Vapi charges per-minute for their voice pipeline (varies by model choices, typically $0.05-$0.15/min).

**Integration difficulty:** Hard (requires Vapi platform, not standalone feature)

- **Docs:** https://docs.vapi.ai/customization/speech-configuration

### 2C. DIY Backchannel (Recommended for Your Stack)

Since you control the WebSocket pipeline, you can implement backchanneling directly:

**Architecture:**
```
User speaking (Deepgram interim results flowing)
    |
    v
Backchannel Timing Logic (Node.js)
    |-- When user has spoken 3+ seconds continuously
    |-- AND there's a natural pause (200-400ms from interim results)
    |-- AND no backchannel was played in last 5 seconds
    |
    v
Play pre-recorded backchannel audio clip
    |-- Mix with incoming audio (don't interrupt STT)
    |-- Use quiet volume level
```

**Pre-recorded Clips Approach:**
- Record 3-5 variants each of: "mhm", "right", "I see", "yeah", "okay"
- For Cantonese: "係啊" (hai6 aa3), "嗯" (ng2), "明白" (ming4 baak6)
- Store as short WAV/MP3 files (200-500ms each)
- Randomize selection to avoid repetition

**Timing Logic (key parameters):**
- Minimum user speech duration before first backchannel: 3 seconds
- Detect pause opportunities from Deepgram interim results (is_final boundaries)
- Cooldown between backchannels: 4-8 seconds (randomized)
- Volume: 30-50% of main TTS volume
- Frequency: roughly every 6-10 seconds of user speech

**Cost:** Free (self-implemented)
**Integration difficulty:** Medium
**Cantonese:** Yes (use Cantonese backchannel words)

### 2D. Open-Source / Academic Resources

| Resource | Description | Link |
|----------|-------------|------|
| **VAP (Voice Activity Projection)** | First model to predict both timing AND type of backchannels in real-time | https://arxiv.org/html/2410.15929v1 |
| **Turn-Taking + Backchannel Prediction (2024)** | Combines acoustic model + LLM for backchannel location prediction | https://arxiv.org/abs/2401.14717 |
| **NVIDIA PersonaPlex** | Learns when to backchannel with "uh-huh" and "oh" | https://research.nvidia.com/labs/adlr/personaplex/ |
| **SpeechBrain 1.0** | Open-source speech toolkit with conversational features | https://github.com/speechbrain/speechbrain |
| **Interspeech 2025 paper** | Continuous backchannel timing prediction for human-robot interaction | https://www.isca-archive.org/interspeech_2025/paierl25_interspeech.pdf |

**Key academic insight:** Backchannel timing correlates with prosodic features (pitch drop, elongated vowels, pause patterns). The most advanced models use audio features directly, not just text.

---

## 3. BACKGROUND AMBIENCE

Adding subtle environmental sounds (coffee shop, office, street) to make the AI feel like it is in a physical space.

### 3A. Free Ambient Sound Libraries

| Library | License | Sounds Available | URL |
|---------|---------|-----------------|-----|
| **Freesound** | CC0 / CC-BY | 685K+ sounds. Coffee shops, offices, streets, nature, crowds | https://freesound.org/ |
| **Mixkit** | Mixkit License (free) | 36+ ambience tracks, restaurants, cities, nature | https://mixkit.co/free-sound-effects/ambience/ |
| **Pixabay Sound Effects** | Pixabay License (free commercial) | Ambient backgrounds, office, rain, wind | https://pixabay.com/sound-effects/ |
| **Free Music Archive** | CC variants | Ambient music loops, drone sounds | https://freemusicarchive.org/genre/Ambient/ |
| **Orange Free Sounds** | Free use (check terms) | Ambient recordings, city sounds | https://orangefreesounds.com/ |
| **BBC Sound Effects** | Personal/educational use | 33K+ sounds, high quality | https://sound-effects.bbcrewind.co.uk/ |

**Recommended approach:** Download 3-5 looping ambient tracks (coffee shop, office, outdoor) as WAV files, 30-60 seconds each, designed to loop seamlessly.

### 3B. Audio Mixing Libraries Comparison

| Library | Best For | Spatial Audio | Streaming Support | Size | Node.js |
|---------|----------|---------------|-------------------|------|---------|
| **Web Audio API** (native) | Full control, mixing, effects | Yes (PannerNode) | Yes | 0 KB | No (browser only) |
| **Howler.js** | Easy cross-browser audio | Yes (spatial plugin) | Limited | ~10 KB | No (browser only) |
| **Tone.js** | Music/synthesis, precise timing | Yes (Panner3D + Listener) | Yes | ~150 KB | No (browser only) |

**Note:** All three are browser-side libraries. Since your voice demo runs in the browser (`voice-demo/page.tsx`), this is fine for the client side.

#### Web Audio API (Recommended)

The native Web Audio API gives you the most control for mixing ambient audio with TTS:

```javascript
// Create audio context and nodes
const ctx = new AudioContext();
const ambientGain = ctx.createGain();
const ttsGain = ctx.createGain();
const masterGain = ctx.createGain();

// Set ambient volume low (10-15% of TTS volume)
ambientGain.gain.value = 0.12;
ttsGain.gain.value = 1.0;

// Connect: ambient -> ambientGain -> master -> speakers
// Connect: tts -> ttsGain -> master -> speakers
ambientGain.connect(masterGain);
ttsGain.connect(masterGain);
masterGain.connect(ctx.destination);
```

#### Howler.js

Simpler API, good for quick implementation:
```javascript
const ambient = new Howl({
  src: ['/sounds/coffee-shop.mp3'],
  loop: true,
  volume: 0.1,
  html5: true  // streaming for large files
});
ambient.play();
```

- **GitHub:** https://github.com/goldfire/howler.js (23K+ stars)
- **Docs:** https://howlerjs.com/

### 3C. Spatial Audio (3D Sound)

To make ambient sounds feel like they are in a physical space:

**Web Audio API PannerNode:**
```javascript
const panner = ctx.createPanner();
panner.panningModel = 'HRTF';  // Head-Related Transfer Function
panner.setPosition(2, 0, -1);  // Place sound at x=2, y=0, z=-1
```

**Tone.js Panner3D:**
```javascript
const panner = new Tone.Panner3D(2, 0, -1);
source.connect(panner);
panner.toDestination();
```

**Advanced Libraries:**
- **Omnitone** (Google) -- Ambisonic spatial audio: https://github.com/nicholasgasior/nicholasgasior-omnitone
- **Mach1Spatial** -- Vector-based spatial panning: https://github.com/nicholasgasior/nicholasgasior-mach1spatial

### 3D. Mixing Without Affecting STT

Critical issue: ambient audio played in the browser must NOT feed back into the microphone/STT.

**Solutions:**
1. **Separate audio output (default behavior):** Browser audio goes to speakers; microphone picks up room audio. If using headphones, no bleed.
2. **Echo cancellation:** Modern browsers have built-in AEC (Acoustic Echo Cancellation) via `getUserMedia({ audio: { echoCancellation: true } })`.
3. **Server-side mixing:** Mix ambient audio into TTS output on the server before sending to client. This keeps ambient out of the microphone entirely.
4. **Ducking:** Lower ambient volume when user is speaking (detect via VAD), raise when AI is speaking.

**Integration difficulty:** Easy (Howler.js) to Medium (Web Audio API custom mixing)
**Cost:** Free
**Cantonese:** N/A (ambience is language-independent)

---

## 4. TURN-TAKING

Determining when the user has finished speaking vs. just pausing mid-thought. The hardest problem in voice AI.

### 4A. LiveKit EOU (End of Utterance) Model

**What it is:** A 135M parameter transformer model (based on SmolLM v2) fine-tuned to predict end-of-turn from transcribed text. Uses a sliding window of the last 4 conversation turns.

**How it works:**
1. STT transcribes user speech word-by-word
2. Each word is appended to the model's context window
3. After each STT final result, the model predicts confidence (0-1) that the user is done
4. If confidence > threshold, AI responds; otherwise, waits

**Performance:**
- v0.4.1-intl: 39% reduction in false-positive interruptions vs v0.3.0
- Inference: ~25ms on CPU, ~400MB RAM
- Trained on real call center transcripts + synthetic dialogues (addresses, phone numbers, credit cards)

**Language support:** English, French, Spanish, German, Italian, Portuguese, Dutch, Chinese, Japanese, Korean, Indonesian, Russian, Turkish, Hindi

**Cost:** Free (open-source, Apache 2.0 license)

**Integration with Node.js:** The model is in Python (PyTorch/HuggingFace). Options:
1. Run as a Python sidecar service with HTTP/gRPC API
2. Export to ONNX and use `onnxruntime-node`
3. Use via LiveKit Agents framework (Python)

**Integration difficulty:** Medium-Hard (requires Python sidecar or ONNX conversion)

- **GitHub:** https://github.com/livekit/agents
- **PyPI:** https://pypi.org/project/livekit-plugins-turn-detector/
- **HuggingFace:** Model weights available on HuggingFace
- **Docs:** https://docs.livekit.io/agents/logic/turns/turn-detector/

### 4B. Pipecat Smart Turn

**What it is:** An audio-based ML model (not just text) that uses intonation patterns and linguistic signals to detect end-of-turn.

**Key difference from LiveKit:** Smart Turn operates on raw audio features (pitch, pace, intonation) in addition to text, providing richer signals about user intent.

**Versions:**
- Smart Turn v2: Supports 13 languages
- Smart Turn v3: Latest, ~65ms inference, 99% accuracy on human English benchmark

**Language support:** English, French, German, Spanish, Portuguese, Chinese, Japanese, Hindi, Italian, Korean, Dutch, Polish, Russian, Turkish

**Cost:** Free (open-source). Also available as hosted API on fal.ai.

**Integration with Node.js:**
- Model is Python-native (Pipecat framework is Python)
- Can self-host via `LocalSmartTurnAnalyzerV3`
- Available on fal.ai as API: https://fal.ai/models/fal-ai/smart-turn/api
- HuggingFace: https://huggingface.co/pipecat-ai/smart-turn-v3

**Integration difficulty:** Medium-Hard (Python sidecar) or Medium (fal.ai API)

- **GitHub:** https://github.com/pipecat-ai/smart-turn
- **Docs:** https://docs.pipecat.ai/deployment/pipecat-cloud/guides/smart-turn

### 4C. Krisp VIVA Turn-Taking

**What it is:** A lightweight (6M parameters), audio-only turn-taking model optimized for CPU inference. Part of the VIVA SDK.

**Key advantage:** Processes audio in under 20ms. Purely audio-based (no STT dependency). Improves turn-taking accuracy by 3.5x over baseline VAD.

**v2 (Nov 2025):** Higher accuracy, faster detection, stronger noise resilience.

**Cost:** Turn-taking model included in VIVA SDK. SDK pricing is commercial (contact Krisp for quotes).

**Integration:** Available as C/C++ SDK. Would need FFI bindings for Node.js.

**Integration difficulty:** Hard (C SDK, no native Node.js support)

- **Docs:** https://sdk-docs.krisp.ai/
- **Blog:** https://krisp.ai/blog/turn-taking-for-voice-ai/

### 4D. AssemblyAI Semantic Endpointing

**What it is:** Neural network-based turn detection built into AssemblyAI's Universal-Streaming STT. Combines semantic + acoustic cues.

**How it works:**
- Predicts a special end-of-turn token during transcription
- Dual fallback: if semantic confidence > `end_of_turn_confidence_threshold`, turn ends; otherwise, falls back to `max_turn_silence` (VAD-based)
- ~150ms P50 latency after VAD endpoint detection

**Cost:** $0.15/hour for Universal-Streaming (includes STT + endpointing). No separate charge for endpointing.

**Language support:** English (primary). Additional languages planned for late 2025/early 2026.

**Integration with Node.js:** Easy -- AssemblyAI has a Node.js SDK. Replace Deepgram with AssemblyAI streaming and get endpointing built-in.

**Integration difficulty:** Easy (if switching STT) / N/A (if keeping Deepgram)

- **Docs:** https://assemblyai.com/docs/universal-streaming/turn-detection
- **Pricing:** https://www.assemblyai.com/pricing

### 4E. Simple Improvements to Your Current Silence Timer

Without adding any new services, you can improve turn detection with logic changes:

1. **Dynamic silence threshold:** Instead of fixed silence duration, adjust based on context:
   - After a question from AI: wait longer (user is thinking) -- 1500-2000ms
   - After user says "um" or "uh": wait longer -- 1200ms
   - Mid-sentence (no period/question mark detected): wait longer -- 1000ms
   - After a complete-sounding sentence: shorter wait -- 600ms

2. **Deepgram `utterance_end_ms` parameter:** Set this in your Deepgram connection params to fine-tune when Deepgram considers an utterance finished:
   ```
   utterance_end_ms=1200  // Slightly longer than default
   ```

3. **Text completeness heuristic:** Check if the transcript ends with sentence-ending punctuation or trailing conjunctions ("and", "but", "so", "because") that suggest continuation.

4. **Speaking duration factor:** If user has only spoken 1-2 words, wait longer (they may be starting a sentence). If 10+ words, they may be done.

**Cost:** Free
**Integration difficulty:** Easy
**Cantonese:** Partially (punctuation heuristics differ for Chinese)

### 4F. Can the LLM Predict Turn Completion?

Yes, but with caveats:

**Approach:** Send the partial transcript to GPT-4o-mini with a system prompt like: "Given this partial user utterance, predict if the user has finished their thought. Respond only with 'DONE' or 'WAITING'."

**Problems:**
- Adds 200-500ms latency per check (API round-trip)
- Costs money per API call
- Main LLM may already be processing the response

**Better approach:** Use a smaller, dedicated model (like LiveKit's 135M param model) for this specific task, keeping latency under 25ms.

### 4G. Turn-Taking -- Recommendation

| Approach | Effort | Impact | Cost | Recommended? |
|----------|--------|--------|------|-------------|
| **Improve silence timer logic** | Easy | Medium | Free | YES -- do first |
| **Tune Deepgram utterance_end_ms** | Easy | Low-Medium | Free | YES -- quick win |
| **AssemblyAI Universal-Streaming** | Medium | High | $0.15/hr | CONSIDER as STT replacement |
| **LiveKit EOU model (Python sidecar)** | Hard | High | Free | CONSIDER for v2 |
| **Pipecat Smart Turn via fal.ai** | Medium | High | API costs | CONSIDER |
| **Krisp VIVA** | Hard | High | Commercial | NOT NOW |

---

## 5. EMOTION DETECTION

Detecting the user's emotional state from their voice to adjust AI responses accordingly.

### 5A. Hume AI

**What it is:** The most comprehensive emotion AI platform. Offers both standalone emotion detection and a full empathic voice interface (EVI).

**Two Products:**

1. **Expression Measurement API** -- analyze audio/video/text for emotions
   - Returns probabilities for 48 emotion dimensions (joy, sadness, anger, confusion, etc.)
   - Real-time streaming via WebSocket
   - Measures prosody (tune, rhythm, timbre of speech)

2. **EVI (Empathic Voice Interface)** -- full voice AI that adjusts its responses based on detected emotions
   - EVI 3 and EVI 4-mini are current versions
   - Built-in emotion-aware LLM (eLLM)
   - Generates responses with appropriate emotional tone

**SDK:** TypeScript SDK available (works in Node.js for non-audio tasks; audio capture differs in Node vs browser)

**Pricing:**
- Free: 10K TTS characters (~10 min) + ~5 min EVI/month
- Starter: $3/month
- Creator: $14/month (unlimited voice cloning)
- Scale: higher tiers available
- Overage: $0.15/1K chars (free), $0.04/1K chars (Scale)
- Octave 2 (Oct 2025): 50% cheaper than previous generation

**Cantonese:** Not explicitly listed. EVI 4-mini has "expanded language support" but specifics unclear.

**Integration difficulty:** Medium (TypeScript SDK, WebSocket API)

- **Docs:** https://dev.hume.ai/intro
- **Expression Measurement:** https://dev.hume.ai/docs/expression-measurement/overview
- **EVI:** https://dev.hume.ai/docs/speech-to-speech-evi/overview
- **TypeScript Quickstart:** https://dev.hume.ai/docs/empathic-voice-interface-evi/quickstart/typescript
- **Pricing:** https://www.hume.ai/pricing

### 5B. Azure Emotion Recognition

Azure Speech SDK does NOT have a dedicated speech emotion recognition feature. Azure's emotion capabilities are:

- **Face API:** Emotion detection from facial expressions (video, not audio)
- **Text Analytics:** Sentiment analysis from text (positive/negative/neutral)
- **Language Understanding:** Intent detection

**For your use case:** Use Azure Text Analytics on the STT transcript to detect sentiment, then map to voice style adjustments. This is text-based, not audio-based.

**Pricing:** Text Analytics: Free tier (5K transactions/month). Standard: $1/1K transactions.

### 5C. Open-Source Speech Emotion Recognition

| Model | Languages | Emotions | How to Use | Cantonese |
|-------|-----------|----------|------------|-----------|
| **SenseVoice-Small** (Alibaba) | Mandarin, Cantonese, English, Japanese, Korean | Happy, Sad, Angry, Neutral | Python (FunASR toolkit). ONNX export possible. | **YES** |
| **SenseVoice-Large** (Alibaba) | Same + more | Same, higher accuracy | Python. Heavier model. | **YES** |
| **emotion-recognition-using-speech** | English | Happy, Sad, Angry, Neutral, Fearful, Surprised | Python (scikit-learn, Keras) | No |
| **SpeechBrain SER** | English (RAVDESS/IEMOCAP trained) | Various | Python (PyTorch) | No |

**SenseVoice is the standout for your stack** because it supports Cantonese and combines ASR + emotion detection + audio event detection in one model. It outperforms Whisper by 50%+ on Chinese/Cantonese accuracy.

- **GitHub:** https://github.com/FunAudioLLM/SenseVoice
- **HuggingFace:** https://huggingface.co/FunAudioLLM/SenseVoiceSmall

**Integration difficulty:** Medium-Hard (Python model, needs sidecar service. Could use ONNX runtime for Node.js but complex.)

### 5D. Using Detected Emotion to Adjust AI Response Tone

Once you detect user emotion, the pipeline is:

```
Detected emotion: "frustrated"
    |
    v
Modify LLM system prompt dynamically:
    "The user sounds frustrated. Respond with extra patience and empathy.
     Keep your response short and direct."
    |
    v
Modify TTS output:
    Azure: <mstts:express-as style="empathetic">
    ElevenLabs v3: [gentle] [calm]
    Cartesia: emotion: ["sympathetic:high", "calm:high"]
```

**Integration difficulty:** Easy (prompt injection + TTS parameter changes)

### 5E. Emotion Detection -- Recommendation

| Approach | Effort | Impact | Cost | Recommended? |
|----------|--------|--------|------|-------------|
| **Text sentiment via LLM** | Easy | Low | Free (part of LLM call) | YES -- add to system prompt |
| **Hume Expression Measurement API** | Medium | High | $3+/month | CONSIDER for English |
| **SenseVoice (self-hosted)** | Hard | High | Free | CONSIDER for Cantonese |
| **Azure Text Analytics** | Easy | Low-Medium | Free tier | MAYBE -- already on Azure |

---

## 6. FILLER SOUNDS DURING THINKING

Masking LLM inference latency (typically 300-1000ms) with natural-sounding filler audio.

### 6A. Pre-Generated Audio Clips (Simplest Approach)

Record or generate a library of filler sounds:

**English fillers:**
- "Hmm..." (500ms)
- "Let me think..." (800ms)
- "That's a great question..." (1200ms)
- "So..." (400ms)
- "Well..." (400ms)
- Inhale/breath sound (300ms)

**Cantonese fillers:**
- "嗯..." (ng2, 500ms)
- "等我諗諗..." (dang2 ngo5 nam2 nam2, 800ms) -- "Let me think"
- "咁呢..." (gam2 ne1, 400ms) -- "Well then..."
- "好問題..." (hou2 man6 tai4, 800ms) -- "Good question"

**Generation approach:**
- Use ElevenLabs/Azure to generate these once, save as WAV files
- Create 3-4 variants of each to avoid repetition
- Include slight breathing sounds before some fillers

### 6B. On-the-Fly TTS Filler Generation

Instead of pre-recorded clips, generate fillers dynamically:

```javascript
// When user finishes speaking, immediately:
// 1. Start LLM inference (async)
// 2. If LLM hasn't responded in 400ms, generate a filler

const FILLER_THRESHOLD_MS = 400;

setTimeout(() => {
  if (!llmResponseStarted) {
    const filler = pickRandomFiller(); // "Hmm...", "Let me see..."
    synthesizeAndPlay(filler); // Quick TTS call
  }
}, FILLER_THRESHOLD_MS);
```

**Problem:** TTS generation itself adds 100-300ms, so the filler needs a very fast TTS path. Pre-recorded clips are more reliable.

### 6C. How Platforms Handle Thinking Delays

| Platform | Approach |
|----------|----------|
| **Vapi** | Configurable filler injection. Can set custom filler phrases. |
| **Retell** | Automatic filler sounds when agent is processing. Configurable. |
| **Sierra** | Does NOT use fillers. Instead, optimizes latency through concurrent execution graph (parallel retrieval, API calls, abuse detection). Precomputes frequent phrases (greetings, confirmations) for zero-latency playback. |
| **LiveKit** | Relies on fast pipeline (no explicit filler feature). |

**Sierra's insight:** Genuine latency reduction is better than masking. Frequent phrases can be pre-computed and cached.

### 6D. Timing Logic

```
User finishes speaking (endpointing detected)
    |
    t=0ms: Start LLM inference
    |
    t=300ms: Check -- has LLM started streaming tokens?
    |    YES -> skip filler, start TTS on first tokens
    |    NO  -> play filler audio clip
    |
    t=300-800ms: Filler plays
    |
    t=500-1200ms: LLM tokens arrive, queue TTS
    |
    Filler ends -> seamlessly transition to actual response
```

**Key thresholds:**
- If LLM responds in <300ms: No filler needed (feels natural)
- If LLM takes 300-800ms: Short filler ("hmm", breath)
- If LLM takes 800ms+: Longer filler ("let me think about that")
- Never play filler for simple responses (greetings, confirmations) -- cache these

### 6E. Filler Sounds -- Recommendation

| Approach | Effort | Impact | Cost | Recommended? |
|----------|--------|--------|------|-------------|
| **Pre-recorded filler clips** | Easy | High | Free | YES -- implement first |
| **Cache common responses** | Medium | High | Free | YES -- greetings, confirmations |
| **Dynamic filler via fast TTS** | Medium | Medium | TTS cost | LATER |
| **Optimize LLM latency (reduce need)** | Medium | High | Free | YES -- parallel processing |

---

## 7. VOICE PERSONALITY CONSISTENCY

Maintaining a consistent voice character, tone, and personality across all turns in a conversation.

### 7A. ElevenLabs Voice Settings

Your current settings: `stability: 0.4, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true`

| Setting | Range | What It Controls | Your Value | Recommendation |
|---------|-------|-----------------|------------|----------------|
| **stability** | 0.0-1.0 | Consistency vs. expressiveness. Low = more emotional variation, high = monotone. | 0.4 | Good for conversational. Try 0.5 for more consistency. |
| **similarity_boost** | 0.0-1.0 | How closely output matches the original voice. Higher = clearer but may add artifacts at extremes. | 0.8 | Good. Keep 0.75-0.85. |
| **style** | 0.0-1.0 | Amplifies the original speaker's style. Increases latency. ElevenLabs recommends keeping at 0 for most uses. | 0.3 | LOWER to 0.0-0.1 for consistency + lower latency |
| **use_speaker_boost** | bool | Enhances voice clarity. NOT available on Eleven v3. | true | Keep true for v2/turbo. |
| **speed** | 0.7-1.3 | Speaking rate multiplier. | (not set) | Add 1.0 as default, adjust dynamically. |

**For conversation AI:** stability 0.45-0.55, similarity 0.80, style 0.0-0.1 gives the best balance of natural-sounding speech with consistent voice identity.

- **Docs:** https://elevenlabs.io/docs/api-reference/voices/settings/get
- **Conversational voice design guide:** https://elevenlabs.io/docs/agents-platform/customization/voice/best-practices/conversational-voice-design

### 7B. Azure Voice Styles for Consistency

For Cantonese (zh-HK-HiuMaanNeural), voice styles are limited. For English voices, you can maintain personality by:

1. **Picking one style and keeping it:** e.g., always use `chat` or `friendly`
2. **Using `styledegree` consistently:** e.g., always 0.8 (slightly expressive but not extreme)
3. **Consistent `<prosody>` settings:** Keep rate and pitch within a narrow band

```xml
<speak version="1.0" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="en-US-JennyNeural">
    <mstts:express-as style="friendly" styledegree="0.8">
      <prosody rate="0%" pitch="0%">
        Your text here
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
```

### 7C. Prompt Engineering for Consistent Personality

Add personality instructions to the LLM system prompt:

```
You are a warm, professional customer service agent named Sarah.

VOICE PERSONALITY RULES:
- Speak in short, conversational sentences (8-15 words max)
- Use contractions naturally (I'm, you're, that's, we'll)
- Occasionally use casual affirmations ("Sure thing", "Absolutely", "Of course")
- Never use formal/written language ("Furthermore", "In addition", "Please be advised")
- Express empathy with phrases like "I totally understand" not "I comprehend your concern"
- When explaining something complex, use analogies
- Pause naturally with "..." between thoughts
- Never start two consecutive responses the same way
```

**For Cantonese:**
```
你係一個友善嘅客服助理，叫做小美。
語氣規則：
- 用口語化嘅廣東話，唔好用書面語
- 句子要短（8-15個字）
- 用語氣助詞（啦、嘅、喎、嘛）
- 表達同理心：「明白嘅」「係呀，我理解」
```

**Cost:** Free
**Integration difficulty:** Easy

### 7D. Cross-Turn Consistency

To maintain consistency BETWEEN turns (so each response sounds like the same "person"):

1. **Keep TTS settings constant:** Don't change voice ID, stability, or style between turns
2. **ElevenLabs `previous_request_ids`:** Pass the request ID of the previous TTS call to maintain prosody flow
3. **ElevenLabs `previous_text` / `next_text`:** Provide context from adjacent text
4. **Avoid mixing TTS providers:** Don't switch between ElevenLabs and Azure mid-conversation (unless switching language)

---

## 8. BREATHING AND MICRO-PAUSES

Adding natural breathing sounds and micro-pauses between phrases to avoid the "machine gun" delivery of continuous TTS.

### 8A. Which TTS Engines Add Natural Breathing?

| Engine | Auto-Breathing | Manual Control | Notes |
|--------|---------------|----------------|-------|
| **ElevenLabs v2/Turbo** | Minimal | `<break>` tags | Some natural pauses from model |
| **ElevenLabs v3** | Better | `[pause]`, `[short pause]`, `[long pause]`, `[sigh]` | v3 has more natural cadence |
| **Azure Neural** | Yes (basic) | `<break>`, `<prosody>` | HD voices have better natural rhythm |
| **Amazon Polly** | Yes (optional) | `<amazon:auto-breaths>` | **Only engine with explicit auto-breathing** |
| **Cartesia Sonic-3** | Yes (natural) | Speed/emotion controls | Natural breathing built into model |
| **Google Cloud** | Minimal | `<break>` | Less natural than Azure/ElevenLabs |

### 8B. SSML Breath Marks

**Amazon Polly (unique feature):**
```xml
<amazon:auto-breaths volume="x-soft" frequency="low" duration="x-short">
  This is a long sentence that will have automatic breathing sounds
  inserted at natural positions throughout the speech output.
</amazon:auto-breaths>
```

Parameters:
- `volume`: default, x-soft, soft, medium, loud, x-loud
- `frequency`: default, x-low, low, medium, high, x-high
- `duration`: default, x-short, short, medium, long, x-long

**Azure/Google:** No equivalent auto-breathing feature. Must use `<break>` tags manually.

### 8C. ElevenLabs Breathing Behavior

- **v2/Turbo models:** Some natural micro-pauses between sentences. Low stability values (0.3-0.5) produce more variation including occasional breath-like pauses.
- **v3 model:** Improved natural cadence. Can use `[sigh]` or `[pause]` audio tags for explicit control. The model naturally adds micro-pauses at clause boundaries.

**Tip:** Inserting em-dashes or ellipses in text creates natural pause points that sound like breathing pauses:
```
"I understand your concern... Let me check that for you."
```

### 8D. Open-Source / DIY Approaches

1. **Post-processing:** Add silence + quiet noise (pink noise at -40dB) between TTS chunks to simulate breathing gaps. 50-150ms of shaped noise between sentences.

2. **Pre-recorded breath sounds:** Record actual breath sounds (inhale: 200-300ms, exhale: 100-200ms). Insert between sentences at the audio buffer level.

3. **Text preprocessing:** Before sending to TTS, insert pause markers at clause boundaries:
   ```javascript
   function addMicroPauses(text) {
     // Add dashes at clause boundaries
     return text
       .replace(/, /g, ', -- ')  // after commas
       .replace(/\. /g, '. ... ');  // between sentences
   }
   ```

**Cost:** Free
**Integration difficulty:** Easy (text preprocessing) to Medium (audio post-processing)
**Cantonese:** Works for both languages

---

## 9. SPEAKING RATE MATCHING

Dynamically adjusting AI speaking speed to mirror the user's pace, creating rapport.

### 9A. Detecting User Speaking Rate

**From Deepgram metadata:**
Deepgram does not directly provide a "words per minute" field. However, you can calculate it:

```javascript
// In Deepgram's response, each word has start/end timestamps
// { word: "hello", start: 0.5, end: 0.9 }

function calculateWPM(words) {
  if (words.length < 2) return 150; // default
  const firstStart = words[0].start;
  const lastEnd = words[words.length - 1].end;
  const durationMinutes = (lastEnd - firstStart) / 60;
  return words.length / durationMinutes;
}
```

**Typical speaking rates:**
- Slow: <120 WPM
- Normal: 120-160 WPM
- Fast: 160-200 WPM
- Very fast: >200 WPM

**Note:** Cantonese WPM is typically lower than English due to character density (more meaning per syllable). Use syllables-per-minute instead for Cantonese.

### 9B. Adjusting TTS Speed Dynamically

| Engine | Speed Parameter | Range | How to Set |
|--------|----------------|-------|-----------|
| **ElevenLabs** | `speed` | 0.7-1.3 | API param in TTS request |
| **Azure** | `<prosody rate="">` | `x-slow` to `x-fast` or `-50%` to `+100%` | SSML wrapper |
| **Cartesia** | `generation_config.speed` | 0.6-1.5 | API param |
| **Google** | `<prosody rate="">` | Same as Azure | SSML wrapper |
| **Deepgram Aura** | `speed` query param | Not documented | Limited control |

### 9C. Rate Matching Algorithm

```javascript
const DEFAULT_RATE = 1.0;
const USER_BASELINE_WPM = 150;

function calculateTTSRate(userWPM) {
  // Map user WPM to TTS rate multiplier
  // Don't mirror exactly -- meet halfway
  const ratio = userWPM / USER_BASELINE_WPM;
  const adjustment = (ratio - 1.0) * 0.5; // 50% matching
  const rate = DEFAULT_RATE + adjustment;

  // Clamp to safe range
  return Math.max(0.8, Math.min(1.2, rate));
}

// Examples:
// User at 180 WPM (fast): TTS rate = 1.1
// User at 120 WPM (slow): TTS rate = 0.9
// User at 150 WPM (normal): TTS rate = 1.0
```

**Smoothing:** Don't change rate abruptly. Use exponential moving average:
```javascript
let currentRate = 1.0;
const SMOOTHING = 0.3;

function updateRate(newUserWPM) {
  const targetRate = calculateTTSRate(newUserWPM);
  currentRate = currentRate * (1 - SMOOTHING) + targetRate * SMOOTHING;
  return currentRate;
}
```

### 9D. Existing Implementations

No major platform offers automatic speaking rate matching as a built-in feature. This would be a differentiating feature if implemented.

**Cost:** Free
**Integration difficulty:** Medium (needs WPM calculation from Deepgram timestamps + dynamic TTS rate adjustment)
**Cantonese:** Yes (adjust WPM baseline for Cantonese, ~100-130 SPM syllables-per-minute)

---

## 10. INTERRUPTION HANDLING

Gracefully managing when the user talks over the AI (barge-in).

### 10A. Current Implementation Analysis

Your current `server.js` has barge-in detection:
```javascript
// When user speaks during AI response:
if (isAiSpeaking && text.length > 3) {
  console.log('[VoiceWS] Barge-in:', text)
  // Aborts current AI response
}
```

This is a hard cut -- the AI immediately stops. This feels unnatural.

### 10B. Fade-Out vs Hard Cut

**Hard cut (current):** AI speech stops instantly. Creates an abrupt, jarring experience.

**Fade-out (better):** AI speech volume decreases over 50-200ms, then stops.

**Web Audio API implementation (client-side):**
```javascript
function fadeOutAI(durationMs = 150) {
  const now = audioContext.currentTime;
  ttsGainNode.gain.setValueAtTime(ttsGainNode.gain.value, now);
  ttsGainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

  // After fade completes, stop the source
  setTimeout(() => {
    stopTTSPlayback();
    ttsGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
  }, durationMs);
}
```

**Important:** Use `exponentialRampToValueAtTime` (not linear) for natural-sounding fade. Target 0.001 (not 0) because exponential ramp cannot reach zero. Duration of 100-200ms sounds immediate but avoids clicks.

### 10C. AI Acknowledging Interruption

After detecting a barge-in, the AI should acknowledge it naturally:

**Approach:** Add to the LLM context that the user interrupted:

```javascript
if (bargeInDetected) {
  // Prepend to the user's message:
  const context = `[User interrupted your previous response. Acknowledge briefly and address their new input.]`;
  // Or add specific phrases to the response:
  // "Oh sure, go ahead..."
  // "Of course --"
}
```

**Pre-recorded acknowledgment clips:**
- "Oh, sorry -- go ahead."
- "Sure, what's that?"
- "Yes?"

Play the acknowledgment clip immediately (pre-recorded for zero latency), then let the LLM process the user's actual input.

### 10D. How Vapi Handles Interruptions

Vapi's `stopSpeakingPlan` configuration:

```json
{
  "stopSpeakingPlan": {
    "numWords": 2,          // User must say 2+ words before stopping
    "voiceSeconds": 0.5,    // Or speak for 0.5+ seconds
    "backoffSeconds": 1     // Wait 1 second before stopping
  }
}
```

**Key design decisions:**
- `numWords: 0` = stop on any sound (very sensitive)
- `numWords: 2-3` = ignore single-word acknowledgments ("okay", "right")
- `voiceSeconds: 0.2-0.5` = filter out brief noise
- `backoffSeconds` = debounce to prevent repeated stop/start

### 10E. Advanced Interruption Handling Architecture

```
User starts speaking during AI response
    |
    v
[1] VAD detects voice (instant)
    |
    v
[2] Is it just a backchannel? (< 2 words, short duration)
    |    YES -> continue AI speech, note the backchannel
    |    NO  -> proceed to interrupt
    |
    v
[3] Fade out AI speech (150ms)
    |
    v
[4] Play acknowledgment clip ("sure, go ahead" -- 500ms)
    |
    v
[5] Wait for user to finish speaking (normal turn-taking)
    |
    v
[6] Process user input with context:
    "User interrupted while I was saying: [partial AI text]"
    "User said: [their interruption]"
    |
    v
[7] Resume conversation naturally
```

### 10F. Technical Implementation in Web Audio API

**Node for audio routing with interruption support:**
```javascript
// Client-side audio graph:
// TTS source -> ttsGain -> compressor -> destination
// Ambient source -> ambientGain -> compressor -> destination
// Backchannel source -> bcGain -> compressor -> destination

const compressor = audioContext.createDynamicsCompressor();
compressor.connect(audioContext.destination);

const ttsGain = audioContext.createGain();
ttsGain.connect(compressor);

// On barge-in:
function handleBargeIn() {
  // 1. Fade out current TTS
  const now = audioContext.currentTime;
  ttsGain.gain.setValueAtTime(ttsGain.gain.value, now);
  ttsGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  // 2. Clear queued audio chunks
  clearAudioQueue();

  // 3. After fade, reset gain for next response
  setTimeout(() => {
    ttsGain.gain.setValueAtTime(1.0, audioContext.currentTime);
  }, 200);

  // 4. Notify server
  ws.send(JSON.stringify({ type: 'barge-in' }));
}
```

### 10G. Interruption Handling -- Recommendation

| Approach | Effort | Impact | Cost | Recommended? |
|----------|--------|--------|------|-------------|
| **Fade-out instead of hard cut** | Easy | High | Free | YES -- implement first |
| **Distinguish backchannel from interruption** | Medium | High | Free | YES |
| **Pre-recorded acknowledgment clips** | Easy | Medium | Free | YES |
| **LLM context about interruption** | Easy | Medium | Free | YES |
| **Configurable sensitivity (numWords/voiceSeconds)** | Easy | Medium | Free | YES |

---

## OVERALL PRIORITY MATRIX

Sorted by impact-to-effort ratio:

| Priority | Feature | Category | Effort | Impact | Cost |
|----------|---------|----------|--------|--------|------|
| **P0** | Improve silence timer logic | Turn-Taking | Easy | High | Free |
| **P0** | Fade-out on interruption | Interruption | Easy | High | Free |
| **P0** | Pre-recorded filler clips | Filler Sounds | Easy | High | Free |
| **P1** | ElevenLabs text formatting tricks | Prosody | Easy | Medium | Free |
| **P1** | LLM personality prompt | Voice Personality | Easy | Medium | Free |
| **P1** | Distinguish backchannel from interruption | Interruption | Medium | High | Free |
| **P1** | DIY backchannel (pre-recorded clips) | Backchanneling | Medium | High | Free |
| **P1** | Text preprocessing for micro-pauses | Breathing | Easy | Medium | Free |
| **P2** | Upgrade to ElevenLabs v3 (Audio Tags) | Prosody | Easy | High | Same cost |
| **P2** | Dynamic speaking rate matching | Rate Matching | Medium | Medium | Free |
| **P2** | Cache common responses | Filler Sounds | Medium | High | Free |
| **P2** | Background ambience (Howler.js) | Ambience | Medium | Medium | Free |
| **P3** | Cartesia as alternative/additional TTS | Prosody | Medium | High | $0.03/min |
| **P3** | Text sentiment for emotion adjustment | Emotion | Easy | Low | Free |
| **P3** | LiveKit EOU model (Python sidecar) | Turn-Taking | Hard | High | Free |
| **P3** | Hume AI emotion detection | Emotion | Medium | High | $3+/month |
| **P4** | AssemblyAI Universal-Streaming | Turn-Taking | Medium | High | $0.15/hr |
| **P4** | SenseVoice emotion (Cantonese) | Emotion | Hard | High | Free |
| **P4** | Pipecat Smart Turn | Turn-Taking | Hard | High | API costs |
| **P5** | Spatial audio (3D ambience) | Ambience | Medium | Low | Free |
| **P5** | Self-hosted prosody model | Prosody | Hard | Variable | Free |
| **P5** | Krisp VIVA | Turn-Taking | Hard | High | Commercial |

---

## KEY DOCUMENTATION LINKS

### TTS Providers
- ElevenLabs Docs: https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- ElevenLabs v3 Audio Tags: https://elevenlabs.io/blog/v3-audiotags
- ElevenLabs Voice Settings: https://elevenlabs.io/docs/api-reference/voices/settings/get
- ElevenLabs Conversational Voice Design: https://elevenlabs.io/docs/agents-platform/customization/voice/best-practices/conversational-voice-design
- Azure SSML: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice
- Azure Language Support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- Cartesia Sonic-3: https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
- Amazon Polly SSML: https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html
- Google Cloud SSML: https://docs.cloud.google.com/text-to-speech/docs/ssml

### Turn-Taking / Endpointing
- LiveKit EOU Docs: https://docs.livekit.io/agents/logic/turns/turn-detector/
- LiveKit EOU Blog: https://blog.livekit.io/improved-end-of-turn-model-cuts-voice-ai-interruptions-39/
- Pipecat Smart Turn: https://github.com/pipecat-ai/smart-turn
- Pipecat Smart Turn v3: https://huggingface.co/pipecat-ai/smart-turn-v3
- AssemblyAI Turn Detection: https://assemblyai.com/docs/universal-streaming/turn-detection
- Krisp VIVA: https://krisp.ai/blog/turn-taking-for-voice-ai/

### Emotion Detection
- Hume AI: https://dev.hume.ai/intro
- Hume Expression Measurement: https://dev.hume.ai/docs/expression-measurement/overview
- SenseVoice: https://github.com/FunAudioLLM/SenseVoice

### Voice Platforms (Reference)
- Retell AI Backchannel: https://docs.retellai.com/build/interaction-configuration
- Vapi Speech Config: https://docs.vapi.ai/customization/speech-configuration
- Sierra Latency Engineering: https://sierra.ai/blog/voice-latency

### Audio Libraries
- Howler.js: https://github.com/goldfire/howler.js
- Tone.js: https://tonejs.github.io/
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Freesound: https://freesound.org/

### Academic Papers
- Backchannel Prediction with VAP: https://arxiv.org/html/2410.15929v1
- Turn-Taking + Backchannel with LLM: https://arxiv.org/abs/2401.14717
- NVIDIA PersonaPlex: https://research.nvidia.com/labs/adlr/personaplex/

---

## CANTONESE SUPPORT SUMMARY

| Feature | Cantonese Support | Notes |
|---------|------------------|-------|
| **Azure TTS (current)** | YES -- zh-HK-HiuMaanNeural | Prosody tags work. Voice styles (express-as) do NOT. |
| **ElevenLabs TTS** | Partial -- multilingual v2 supports Chinese/Cantonese | v3 audio tags untested for Cantonese |
| **Cartesia TTS** | Unlikely -- supports "Chinese" (probably Mandarin) | Not confirmed for Cantonese |
| **Deepgram STT (current)** | YES | Good accuracy for Cantonese |
| **SenseVoice (emotion)** | YES -- explicitly supports Cantonese | Best open-source option for Cantonese emotion |
| **LiveKit EOU** | YES -- supports Chinese | Turn detection works for Chinese |
| **Pipecat Smart Turn** | YES -- supports Chinese | Audio-based, language-agnostic features |
| **Hume AI** | Unclear | Expanding language support |
| **Backchanneling** | DIY only | Use Cantonese backchannel words |
| **SSML prosody** | YES (Azure) | rate, pitch, volume work for zh-HK |
