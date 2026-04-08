# AI Staffs App — Full Product Roadmap
*Written by Claude on March 26, 2026 — for Gemini to continue building*

---

## THE BIG PICTURE

**aistaffs.app = ONE dashboard that controls everything.**

Every brand. Every AI worker. Every channel. Every voice call. One place.

---

## CONFIRMED ARCHITECTURE

### Stack
- **aistaffs.app** (Railway/Next.js) = Dashboard + control hub
- **Supabase** = All data, task queue, node registry, audit logs, credentials
- **OpenClaw nodes** (local hardware) = Hands — browser automation, clicks
- **Gemini 2.5-flash** = Brain — thinks, writes, decides
- **Twilio** = Phone calls (inbound + outbound)
- **ElevenLabs** = Voice cloning
- **WhatsApp Business API** = Official inbound messaging
- **Meta Business API** = Facebook/Instagram

### What Lives Where
| Feature | Lives At |
|---|---|
| AI phone calls | aistaffs (Railway) — Twilio API |
| WhatsApp Business inbound | aistaffs (Railway) — official API |
| Voice cloning | aistaffs (Railway) — ElevenLabs API |
| Call recordings + transcripts | Supabase storage |
| LinkedIn/WhatsApp Web outbound | OpenClaw local nodes |
| Skills (walk/talk/see) | Local machines only |

---

## FEATURE 1: Fleet Management (BUILD FIRST)

### New Supabase Tables
```sql
-- Node registry
CREATE TABLE openclaw_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'offline', -- online/offline/busy
  last_seen TIMESTAMPTZ,
  capabilities JSONB, -- ["walk","talk","see"]
  assigned_business_unit_id UUID REFERENCES business_units(id),
  token TEXT -- for auth
);

-- Task queue
CREATE TABLE openclaw_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES openclaw_nodes(id),
  business_unit_id UUID REFERENCES business_units(id),
  skill TEXT, -- walk/talk/see/think
  payload JSONB,
  status TEXT DEFAULT 'pending', -- pending/running/done/failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results
CREATE TABLE openclaw_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES openclaw_tasks(id),
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes to Add
- `POST /api/nodes/register` — claw calls on startup
- `POST /api/nodes/heartbeat` — claw calls every 30s
- `GET  /api/nodes/status` — Fleet dashboard reads this
- `POST /api/tasks/create` — create task for a node

### Admin UI: New "Fleet" Tab
```
Fleet Dashboard
├── Node 1 (laptop)    🟢 Online  — SkinCoach
├── Node 2 (old PC)    🟢 Online  — BreastGuardian
└── Node 3 (cloud)     🔴 Offline — unassigned

Active Tasks:
├── "Find 50 spa leads HK" → Node 1 → 23% done
└── "Reply WhatsApp messages" → Node 2 → running
```

---

## FEATURE 2: Channels (Social Media Per Brand)

### New Supabase Table
```sql
CREATE TABLE brand_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id),
  channel_type TEXT, -- whatsapp/telegram/facebook/linkedin/email
  credentials JSONB, -- AES-256 encrypted
  status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Admin UI: New "Channels" Tab
- Per brand: connect WhatsApp, Telegram, Facebook, LinkedIn, Email
- Each shows connected/disconnected status
- Credentials stored encrypted — never shown in plaintext after save

---

## FEATURE 3: Outbox (Approval Gate — MANDATORY)

### New Supabase Table
```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id),
  channel_type TEXT,
  recipient TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending', -- pending/approved/rejected/sent/failed
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Admin UI: New "Outbox" Tab
```
Pending (3) | Approved (47) | Rejected (2) | Failed (1)

[Message to John Lee via WhatsApp]
"Hi John, following up on our kitchen equipment..."
[EDIT] [APPROVE] [REJECT]
```

**Rule: Nothing goes to social media without APPROVE click.**

---

## FEATURE 4: AI Phone Calls via Twilio

### How It Works
1. Customer calls Twilio number assigned to brand
2. Twilio webhooks to `/api/voice/inbound`
3. aistaffs uses Gemini to generate response
4. Google TTS converts to audio
5. Twilio speaks it to caller
6. Loop until call ends

### Outbound Call Flow
1. Scheduled job creates call via Twilio API
2. Person answers
3. Same Gemini + TTS loop

### New Supabase Table
```sql
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id),
  direction TEXT, -- inbound/outbound
  from_number TEXT,
  to_number TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  mood TEXT, -- happy/neutral/concerned
  flags JSONB, -- [{type: 'health_concern', text: '...'}]
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cost
- Per minute: ~$0.025 USD total (Twilio + STT + Gemini + TTS)
- Charge brands: HK$500-2000/month

---

## FEATURE 5: AI Elderly Companion ("心伴")

### Core Flow
```
Scheduled daily outbound call
→ AI greets elderly person warmly
→ Natural conversation in 廣東話/English/普通話
→ Remembers previous conversations
→ Flags health concerns
→ Summary sent to family dashboard
```

### Personality Types (configurable per brand/user)
- 😊 Warm & caring (default)
- 😂 Comedian — generates original Cantonese jokes
- 🧘 Calm & mindful
- 💼 Professional

### AI Comedian Notes
- Generate original jokes using comedy structure/techniques
- Do NOT scrape comedian content (copyright)
- Specialise in 諧音 (Cantonese wordplay), cold jokes
- Remember what made person laugh, adapt style

### Safety System (non-negotiable)
- 🔴 Crisis keywords → immediate SMS/call alert to family
- 🟡 Health concern → logged, shown in family dashboard
- 🟢 Normal → stored, available to review

### Family Dashboard Features
- Daily mood indicator
- Call topics summary
- Flagged concerns with action buttons
- Quote of the day from elderly person
- [Listen] [Reply via AI] [Book doctor] buttons
- Weekly digest email

### Pricing
```
Direct HK$98/month
Family HK$198/month
Care home HK$2000/month
Corporate HR HK$5000/month
```

---

## FEATURE 6: Voice Clone / Digital Memory

### Use Cases
1. Remember loved ones who passed
2. Dad clone for kids (answers in dad's voice)
3. Grandparent language teacher
4. Personal life coach from your journals
5. Long distance relationship fill-in

### Tech
- ElevenLabs API for voice cloning
- Person being cloned must give written consent
- Listener must know they're talking to AI

### Ethical Framing
```
Not: "pretend to be son"
Yes: "sent by son, powered by AI"
"媽咪，我係你個仔個AI助手，佢叫我代佢問候你"
```

---

## FEATURE 7: AI Counsellor / Mental Wellness

### Rules (non-negotiable)
- Always discloses as AI
- Cannot diagnose
- Crisis → escalate to human/hotline immediately
- All sessions logged + auditable

### Pricing
```
Free: 3 min (lead gen)
Basic HK$98/month: unlimited text
Standard HK$198/month: text + voice
Premium HK$398/month: + human escalation
```

---

## BUILD ORDER

```
Week 1-2:  Fleet Management
Week 3-4:  Channels + Outbox
Week 5-6:  WhatsApp Business API (BrezCode pilot)
Week 7-8:  AI Phone Calls — Twilio (BrezCode support)
Week 9-10: 心伴 Elderly Companion MVP
Week 11+:  Voice cloning + Counsellor
```

---

## CURRENT STATE (March 26, 2026)

### OpenClaw Local Node
- Installed natively via npm
- Running at: `http://127.0.0.1:18789/#token=mytoken123`
- Token: `mytoken123`
- Config: `C:/Users/Denny/.openclaw/openclaw.json`
- Agent model: NOT YET CONFIGURED
- Next step: add agent model config to openclaw.json

### Existing aistaffs Features (Already Built)
- Multi-tenant business units (SkinCoach, BreastGuardian, BrezCode)
- Landing page editor (block-based)
- AI chatbot (Gemini 2.5-flash)
- Knowledge base + FAQ
- Booking system
- Multi-language (EN, ZH-CN, ZH-TW, VI)
- Supabase backend

### Known Bugs Still Pending
1. HK/en invisible blocks in editor (ID: 5f481ca6...)
2. US/en old data structure (needs migration)
3. aistaffs.app DNS → Railway
