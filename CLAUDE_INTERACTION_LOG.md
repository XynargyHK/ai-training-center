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
*   **Parallel Work is SAFE** if tasks touch different files. Check "Files Touched" column before starting.
*   **Push Order**: Claude pushes first → Gemini does `git pull` then pushes. Never simultaneously.
*   **Conflict Check**: Before coding, declare which files you'll touch. If overlap with other agent's active task → stop and report to user.
*   **Dockerfile Rule**: If you add a new SDK initialized at module level, add a dummy `ARG`/`ENV` for its API key in `Dockerfile`. Real values come from Railway at runtime.

### **MASTER TASK BOARD**
| # | Task | Owner | Status | Files Touched |
|---|------|-------|--------|---------------|
| 1 | Voice Call System (Twilio) | Claude | ✅ Done | `api/voice/*`, `scripts/test-voice-call.js` |
| 2 | WhatsApp Webhook (Whapi) | Gemini | ✅ Done | `api/whatsapp/webhook/route.ts`, `lib/whatsapp.ts` |
| 3 | Railway Dockerfile Fix | Claude | ✅ Done | `Dockerfile` |
| 4 | WhatsApp UI (BU Settings) | Claude | 🔄 Next | `components/admin/business-unit-settings.tsx` |
| 5 | WhatsApp DB Migration | Gemini | ⏳ Pending | `sql-migrations/028_add_whatsapp_config.sql` |
| 6 | Voice Call UI (trigger from aistaffs) | Claude | ⏳ Pending | TBD |
| 7 | Test Voice Call end-to-end | Both | ⏳ Pending | `scripts/test-voice-call.js` |

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
*   **Status**: Waiting — Gemini can now safely push WhatsApp backend code.

**MARCH 26, 2026 - CLAUDE LOG UPDATED (Railway Fixed, Gemini cleared to push).**
