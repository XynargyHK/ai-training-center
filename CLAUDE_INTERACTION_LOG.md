# CLAUDE INTERACTION LOG - MASTER PROJECT HISTORY

## **CONTEXT OVERVIEW**
This project is a multi-tenant AI-powered customer service training and live chat platform.
- **Business Units**: SkinCoach, Breast Guardian, BrezCode.
- **Master Strategy**: "One AI Brain" (Gemini 2.5-flash) for both agent training and live production chat.

---

## **PART 1: THE CHRONOLOGICAL ERAS (History of Gemini's Work)**

... [EXISTING CONTENT PRESERVED] ...

### **Era 6: The WhatsApp Agentic Era (March 26, 2026 - NEW)**
*   **Goal**: Connect the "One AI Brain" to a real-world WhatsApp number for autonomous B2B sales and support.
*   **Accomplishments**:
    *   **Universal Webhook**: Created `src/app/api/whatsapp/webhook/route.ts` to receive messages via Headless Gateways (Whapi/Maytapi).
    *   **WhatsApp Utility**: Created `src/lib/whatsapp.ts` for sending messages back to customers.
    *   **Safety Trigger**: Implemented a `#AI` / `Sarah` trigger filter to allow testing on personal phone numbers without leaking private chats to the AI.
    *   **Database Config**: Created `sql-migrations/028_add_whatsapp_config.sql` to store per-tenant WhatsApp credentials.
    *   **Humanizer Strategy**: Planned "Simulated Typing" and random delays to mimic human behavior and prevent WhatsApp spam bans.

---

## **PART 2: CURRENT SYSTEM ARCHITECTURE (TECHNICAL)**

... [EXISTING CONTENT PRESERVED] ...

### **4. WhatsApp Integration (Phase 1 POC)**
*   **Endpoint**: `/api/whatsapp/webhook` (POST)
*   **Logic**: Inbound Message -> Trigger Filter (#AI) -> Gemini 2.5-flash -> Gateway Outbound Send.
*   **Isolation**: Uses `WHATSAPP_TEST_BU_ID` from `.env.local` for the POC; will move to dynamic BU lookup in Phase 2.

---

## **PART 3: COLLABORATION PROTOCOL (GEMINI & CLAUDE)**

### **Rules**
*   **Log-First Rule**: Both agents MUST read this log at the start of every session.
*   **Log-Last Rule**: Both agents MUST update the Task Board here after completing work.
*   **Real-Time Log Rule**: Both agents MUST log meaningful progress AS THEY WORK — not just at the end. Log: key decisions made, blockers hit, bugs found, approaches changed, new tools/keys added. Not every line of code — only things the other agent needs to know.
*   **Parallel Work is SAFE** if tasks touch different files. Check "Files Touched" column before starting.
*   **Push Order**: Claude pushes first → Gemini does `git pull` then pushes. Never simultaneously.
*   **Conflict Check**: Before coding, declare which files you'll touch. If overlap with other agent's active task → stop and report to user.
*   **Dockerfile Rule**: If you add a new SDK initialized at module level, add a dummy `ARG`/`ENV` for its API key in `Dockerfile`. Real values come from Railway at runtime.

### **MASTER TASK BOARD**
| # | Task | Owner | Status | Files Touched |
|---|------|-------|--------|---------------|
| 1 | Voice Call System (Twilio) | Claude | ✅ Done | `api/voice/*`, `scripts/test-voice-call.js` |
| 2 | WhatsApp Webhook (Whapi) | Gemini | ✅ Pushed | `api/whatsapp/webhook/route.ts`, `lib/whatsapp.ts` |
| 3 | Railway Dockerfile Fix | Claude | ✅ Done | `Dockerfile` |
| 4 | WhatsApp UI (BU Settings) | Claude | ⏳ Pending | `components/admin/business-unit-settings.tsx` |
| 5 | WhatsApp DB Migration | Gemini | ⏳ Pending | `sql-migrations/028_add_whatsapp_config.sql` |
| 6 | Voice Call UI (trigger from aistaffs) | Claude | ⏳ Pending | TBD |
| 7 | Test Voice Call end-to-end | Both | ⏳ Pending | `scripts/test-voice-call.js` |
| 8 | Web Voice AI Demo (Vapi clone) | Claude | 🔄 In Progress | `server.js`, `src/app/voice-demo/page.tsx`, `src/app/api/voice/stt/route.ts`, `src/app/api/voice/tts/route.ts` |

---

## **PART 4: CRITICAL BUGS & TASKS**

### **✅ RAILWAY DEPLOYMENT FIXED & LIVE (March 26, 2026)**
*   **Status**: RESOLVED. Production is live and healthy.
*   **Root Cause**: nixpacks was generating a blank ENV name in the auto-Dockerfile, causing Docker parse failure.
*   **Claude's Fix**:
    1. Added a custom `Dockerfile` to bypass nixpacks entirely.
    2. Passed `NEXT_PUBLIC_*` vars as build ARGs (Next.js bakes them in at build time).
    3. Added dummy build-time placeholders for all SDK keys (Supabase, Resend, Stripe, OpenAI, Anthropic, Twilio, Gemini) — they throw on module-level init if missing during `npm run build`.
    4. Fixed TypeScript compile error: duplicate `const businessName` in `src/app/api/voice/gather/route.ts`.
*   **IMPORTANT FOR GEMINI**: When you push new code that adds a new SDK initialized at module level, add a dummy `ARG`/`ENV` for its key in the `Dockerfile`. Real values come from Railway at runtime.

### **🚩 PENDING TASK: WhatsApp SaaS UI**
*   **Goal**: Add a "WhatsApp Integration" section to the Business Unit settings.
*   **Action**: (Claude) Build the UI fields for `whatsapp_phone_number_id` and `whatsapp_access_token`.
*   **Status**: PUSHED. Backend is live. Claude can proceed with the UI.

**MARCH 26, 2026 - GEMINI LOG UPDATED (WhatsApp Pushed to Railway).**

---

## **ERA 7: THE VOICE AI ERA (March 27, 2026 - Claude)**

### **Goal**
Build a real-time browser-based Voice AI demo (Vapi/Retell clone) using Deepgram STT + Gemini + ElevenLabs TTS — all running in the browser, no phone needed.

### **What Was Built**

#### **1. Custom WebSocket Server (`server.js`)**
- Replaced `next dev` with a custom Node.js server that runs Next.js + WebSocket on the same port (3000)
- WebSocket endpoint: `ws://localhost:3000/api/voice/stream?businessUnitId=XXX`
- Full real-time pipeline: Deepgram live STT → Gemini 2.0 Flash → ElevenLabs TTS → browser audio
- **IMPORTANT**: `npm run dev` now runs `node server.js` (not `next dev`). `npm run dev:next` runs plain Next.js if needed.

#### **2. Voice Demo Page (`src/app/voice-demo/page.tsx`)**
- URL: `localhost:3000/voice-demo`
- Click mic button → browser captures audio via MediaRecorder → streams to server → Deepgram transcribes live → Gemini responds → ElevenLabs speaks back
- Barge-in supported: user can interrupt AI mid-speech
- Conversation history shown on screen

#### **3. API Routes (helper, not used by main pipeline)**
- `src/app/api/voice/stt/route.ts` — OpenAI Whisper transcription (batch, not streaming)
- `src/app/api/voice/tts/route.ts` — OpenAI TTS nova voice (batch)

### **New Dependencies Installed**
- `@deepgram/sdk@^3.13.0` — live streaming STT (v3, NOT v5 which is a different product)
- `elevenlabs@1.59.0` — streaming TTS
- `ws@8.20.0` — WebSocket server

### **New Environment Variables Added to `.env.local`**
```
DEEPGRAM_API_KEY=8062835a66bc2ee86a456e483f0063568ba3dbbe
ELEVENLABS_API_KEY=sk_11bce8fe269dc72d43c6cfe1152c02ac8066cd1917df89e7
```

### **CRITICAL NOTES FOR GEMINI**
1. **`npm run dev` changed** — now runs `node server.js` instead of `next dev`. Do NOT revert this.
2. **Deepgram SDK version** — must stay at v3 (`@deepgram/sdk@^3.13.0`). v5 is a completely different Voice Agent product with different APIs.
3. **Deepgram event names in v3**: transcript event is `'Results'` (not `'transcript'`), utterance end is `'UtteranceEnd'` (not `'utteranceEnd'`).
4. **Audio format**: Browser sends WebM/Opus via MediaRecorder. Deepgram auto-detects this — do NOT add `encoding: 'linear16'` or `sample_rate` to Deepgram config.
5. **ElevenLabs voice ID**: Using `EXAVITQu4vr4xnSDxMaL` (Sarah voice), model `eleven_turbo_v2_5`.
6. **AI model for voice**: Uses `gemini-2.0-flash` directly (no thinking mode) for low latency. NOT the standard `/api/ai/chat` endpoint.
7. **Dockerfile**: Add `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY` as ARG/ENV placeholders before deploying to Railway.

### **Current Status**
- Server pipeline works: Deepgram STT ✅, Gemini response ✅, ElevenLabs TTS ✅ (audio sent to client)
- Conversation memory (multi-turn) ✅
- Barge-in ✅
- **PAUSED**: Audio playback not working in Edge browser — root cause is Edge autoplay policy
- Final attempt: switched to DOM `<audio>` element + Blob URL + explicit `mp3_44100_128` format
- Mic/transcription fully working (Deepgram was transcribing "I still cannot hear you")
- Phone integration: NOT done yet — browser demo only

### **CRITICAL NOTES FOR NEXT SESSION (Voice Demo)**
- Server sends audio chunks correctly (confirmed via logs: 49-54 chunks per response)
- Issue is client-side audio playback in Edge — Web Audio API (`decodeAudioData`) is blocked, `new Audio()` without DOM is blocked
- Final code uses: `<audio ref={audioElRef} />` in JSX + `new Blob(chunks, { type: 'audio/mpeg' })` + `URL.createObjectURL` + `audio.play()`
- If still failing in Edge: try Chrome, or add `crossOrigin="anonymous"` to audio element, or check Edge sound permissions
- `npm run dev` = `node server.js` (NOT `next dev`)
- Log file: `/c/tmp/voice-server.log`

**MARCH 27, 2026 - CLAUDE LOG UPDATED (Voice demo paused, moving to WhatsApp UI).**
