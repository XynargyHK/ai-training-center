# Telephony Provider Cost Comparison for AI Voice Agents
## Outbound PSTN Calls - Research Date: March 2026

---

## EXECUTIVE SUMMARY

For our use case (AI making outbound calls for appointments/bookings via Pipecat), the **recommended setup** is:

### Best Overall: Pipecat Cloud + Telnyx (or keep Twilio)
- **Pipecat Cloud** handles agent hosting ($0.01-0.03/min) + SIP/PSTN transport ($0.018/min)
- **Telnyx** for telephony: ~$0.007/min US outbound (cheapest raw carrier)
- **Twilio** if you want reliability + familiarity (you already have an account): $0.014/min US
- **Total estimated cost per minute (US outbound)**: $0.05-0.12/min depending on STT/LLM/TTS choices

### Why NOT all-in-one platforms (Vapi, Retell, Bland)?
- They charge $0.07-0.33/min with less control over the pipeline
- You already have Pipecat architecture -- no reason to pay a middleman
- All-in-one locks you into their LLM/TTS choices; Pipecat lets you swap freely

---

## 1. RAW TELEPHONY CARRIERS (PSTN only -- you bring your own AI stack)

### A. Daily.co (PSTN via Pipecat Cloud)

| Item | Cost |
|------|------|
| PSTN Dial-in/Dial-out | $0.018/min (includes SIP) |
| SIP-only Dial-in/Dial-out | $0.005/min |
| US Phone Number | ~$2.00/mo |
| HK Phone Number | Available (27 countries supported incl. HK) |
| WebRTC Transport (1:1 voice) | FREE |
| Agent Hosting (Pipecat Cloud) | $0.01-0.03/min active |
| Setup Fees | None |
| Pipecat Integration | Native (built by Daily) |
| Reliability | Good -- WebRTC-focused, newer to PSTN |
| Asia Numbers | HK, Singapore, Malaysia, India, China, Japan |

**Notes:**
- Dial-out requires application/approval (anti-fraud)
- The $0.018/min PSTN rate is the transport layer only -- does not include carrier termination fees
- When using Twilio as telephony provider through Pipecat Cloud, Twilio bills you directly
- Best for: teams already using Pipecat who want integrated billing

### B. Twilio

| Item | Cost |
|------|------|
| **US Outbound (local)** | **$0.014/min** |
| US Outbound (toll-free) | $0.014/min |
| **HK Outbound (local)** | **$0.032/min** |
| HK Outbound (mobile) | $0.049/min |
| Browser/App (WebRTC) | $0.004/min |
| US Local Number | $1.15/mo |
| US Toll-Free Number | $2.15/mo |
| HK Local Number | $6.00/mo |
| HK Toll-Free Number | $25.00/mo |
| Setup Fees | None |
| Pipecat Integration | YES -- official transport (WebSocket-based) |
| Reliability | Industry gold standard, 99.95% SLA |
| Asia Numbers | HK, SG, JP, IN, VN (with regulatory docs) |

**Notes:**
- Most mature platform, largest developer ecosystem
- Volume discounts auto-apply at scale
- Per-second billing available on some plans
- Conference: $0.0018/participant/min, Recording: $0.0025/min
- Answering Machine Detection: $0.0075/call
- You already have a Twilio account (AC34409ae...)

### C. Telnyx

| Item | Cost |
|------|------|
| **US Outbound (local)** | **~$0.007/min** (starts from) |
| US Outbound (general) | $0.002/min + SIP trunk fee |
| HK Outbound | ~$0.01-0.03/min (varies, download rate sheet) |
| HK Local Number | $1.00/mo |
| US Local Number | ~$1.00/mo |
| Setup Fees | None |
| Pipecat Integration | YES -- official transport supported |
| Reliability | 99.999% SLA (5 nines!) |
| Voice Quality | Own private IP backbone, sub-200ms latency |
| Asia Numbers | HK, SG, VN available |
| Customer Satisfaction | 91% (vs Twilio 80%) |

**Notes:**
- Owns its own global telecom infrastructure (not reselling like Twilio)
- Telecom licenses in 30+ countries
- ~50% cheaper than Twilio for US calls
- Per-second billing standard
- Elastic SIP Trunking means all calls treated as "local"
- Best raw carrier option for cost savings

### D. Plivo

| Item | Cost |
|------|------|
| **US Outbound (local)** | **$0.010/min** |
| US Outbound (Hawaii) | $0.0125/min |
| US Outbound (Alaska) | $0.085/min |
| US Local Number | $0.50/mo (cheapest!) |
| US Toll-Free Number | $1.00/mo |
| Setup Fees | None |
| Pipecat Integration | YES -- supported transport |
| Reliability | Good, established platform |
| Asia Numbers | Limited info -- check console |

**Notes:**
- Cheapest phone number rental ($0.50/mo local US)
- Billing rounded up to nearest minute (not per-second!)
- Less documentation/community than Twilio
- Good middle-ground between Twilio pricing and Telnyx

### E. Vonage (Nexmo)

| Item | Cost |
|------|------|
| **US Outbound** | **~$0.01/min** |
| International | Varies (€0.414/min default for non-standard) |
| Setup Fees | None |
| Pipecat Integration | No official transport |
| Billing | Per-second (favorable) |
| Asia Numbers | Available in many markets |

**Notes:**
- Per-second billing is a cost advantage for short calls
- Less relevant for our stack since no Pipecat transport
- Now owned by Ericsson -- enterprise focus
- Not recommended for our use case due to lack of Pipecat integration

---

## 2. ALL-IN-ONE AI VOICE AGENT PLATFORMS

These bundle STT + LLM + TTS + Telephony into one service.

### F. Vapi.ai

| Item | Cost |
|------|------|
| Platform Fee | $0.05/min (base) |
| **Real Total Cost** | **$0.18-0.38/min** (with all components) |
| STT (Deepgram) | ~$0.01/min |
| LLM (OpenAI/Claude) | ~$0.02-0.20/min |
| TTS (ElevenLabs) | ~$0.04/min |
| Telephony | ~$0.01/min |
| Plans | Ad-hoc, Agency ($500/mo), Startup ($1000/mo), Enterprise (custom) |
| HIPAA | +$1,000/mo |
| Pipecat Integration | NO -- competing platform |
| HK Support | Via Twilio/Telnyx integration |

**Verdict:** Expensive middleman. You're paying $0.05/min for orchestration that Pipecat does for free. Real costs 3-5x higher than advertised.

### G. Retell AI

| Item | Cost |
|------|------|
| Base Voice Processing | $0.055/min |
| Telephony (US) | $0.015/min |
| TTS (Standard voices) | $0.015/min |
| TTS (ElevenLabs) | $0.040/min |
| LLM (GPT-4.1) | $0.045/min |
| LLM (Gemini 2.5 Flash) | $0.035/min |
| LLM (Claude 4.5 Sonnet) | $0.080/min |
| **Typical Total** | **$0.13-0.31/min** |
| Phone Numbers | $2.00/mo |
| Batch Dialing | $0.005/dial |
| Enterprise (high volume) | As low as $0.05/min |
| Pipecat Integration | NO -- competing platform |

**Verdict:** Better value than Vapi. Transparent component pricing. But still a middleman platform. Enterprise rate of $0.05/min is competitive IF you have volume.

### H. Bland AI

| Item | Cost |
|------|------|
| Start Plan (Free tier) | $0.14/min |
| Build Plan ($299/mo) | $0.12/min |
| Scale Plan ($499/mo) | $0.11/min |
| Failed call minimum | $0.015/attempt |
| Call transfers | $0.025/min |
| SMS | $0.02/message |
| Pipecat Integration | NO -- competing platform |

**Verdict:** Most expensive all-in-one. Rates increased Dec 2025. Not recommended.

### I. Telnyx Conversational AI (Hybrid)

| Item | Cost |
|------|------|
| All-inclusive (STT+TTS+orchestration) | $0.06-0.08/min |
| Open-source LLM on Telnyx GPUs | $0.025/min |
| **Total with open-source LLM** | **~$0.085-0.105/min** |
| Telephony | Added separately (their own rates) |
| Pipecat Integration | YES (raw telephony) / Own platform |

**Verdict:** Best all-in-one value IF you use open-source LLMs. Combines carrier-grade telephony with AI platform. Worth evaluating as alternative to building everything yourself.

---

## 3. COST COMPARISON TABLE (Per-Minute, US Outbound)

| Provider | Telephony Only | With Full AI Stack | Monthly Minimum | Pipecat? |
|----------|---------------|-------------------|-----------------|----------|
| **Telnyx (raw)** | **$0.007** | $0.05-0.10* | None | Yes |
| **Plivo** | $0.010 | $0.05-0.10* | None | Yes |
| **Twilio** | $0.014 | $0.06-0.12* | None | Yes |
| **Daily PSTN** | $0.018 | $0.06-0.12* | None | Native |
| **Vonage** | $0.010 | N/A | None | No |
| **Telnyx Conv. AI** | included | $0.085-0.105 | None | Partial |
| **Retell AI** | included | $0.13-0.31 | None | No |
| **Vapi.ai** | included | $0.18-0.38 | None | No |
| **Bland AI** | included | $0.11-0.14 | $0-499/mo | No |

*Raw carrier + your own STT ($0.01) + LLM ($0.02-0.06) + TTS ($0.015-0.04) via Pipecat

---

## 4. HONG KONG CALLING COSTS

| Provider | HK Local | HK Mobile | HK Number/mo |
|----------|----------|-----------|--------------|
| Twilio | $0.032/min | $0.049/min | $6.00/mo |
| Telnyx | ~$0.01-0.03/min | ~$0.02-0.04/min | $1.00/mo |
| Daily | Available | Available | ~$2-6/mo |
| Plivo | Check console | Check console | Check console |

---

## 5. RECOMMENDATION FOR OUR USE CASE

### Scenario: AI outbound calls for appointments/bookings

**Architecture:**
```
Pipecat (on Railway or Pipecat Cloud)
  --> STT: Deepgram ($0.01/min)
  --> LLM: Gemini 2.5 Flash or GPT-4.1-mini ($0.02-0.04/min)
  --> TTS: Cartesia/ElevenLabs ($0.015-0.04/min)
  --> Telephony: Telnyx or Twilio (PSTN dial-out)
```

**Option A: Cheapest (Pipecat + Telnyx)**
- Telnyx US outbound: $0.007/min
- Telnyx HK number: $1/mo
- Pipecat Cloud hosting: $0.01/min
- STT + LLM + TTS: ~$0.05-0.08/min
- **Total: ~$0.067-0.097/min**
- 1000 minutes/month = **$67-97/mo**

**Option B: Reliable + Easy (Pipecat + Twilio)**
- Twilio US outbound: $0.014/min
- Twilio HK number: $6/mo
- Pipecat Cloud hosting: $0.01/min
- STT + LLM + TTS: ~$0.05-0.08/min
- **Total: ~$0.074-0.104/min**
- 1000 minutes/month = **$74-104/mo**

**Option C: Simplest All-in-One (Telnyx Conversational AI)**
- Everything included: ~$0.085-0.105/min
- Add telephony: ~$0.007/min
- **Total: ~$0.092-0.112/min**
- 1000 minutes/month = **$92-112/mo**
- Trade-off: Less control over AI pipeline, but fastest to deploy

### Final Verdict

**Start with Option B (Pipecat + Twilio)** since you already have Twilio. Get it working. Then **migrate telephony to Telnyx** to save ~50% on per-minute carrier costs. The Pipecat transport swap is minimal code change.

Do NOT use Vapi/Retell/Bland -- they're middlemen charging 2-5x markup for orchestration Pipecat already does.

---

## SOURCES & VERIFICATION NEEDED

Prices were researched March 2026 but telephony rates change frequently. Verify before committing:

- [Twilio US Voice Pricing](https://www.twilio.com/en-us/voice/pricing/us)
- [Twilio HK Voice Pricing](https://www.twilio.com/en-us/voice/pricing/hk)
- [Telnyx Voice API Pricing](https://telnyx.com/pricing/voice-api)
- [Telnyx HK Numbers](https://telnyx.com/phone-numbers/hong-kong)
- [Telnyx Conversational AI Pricing](https://telnyx.com/pricing/conversational-ai)
- [Plivo US Voice Pricing](https://www.plivo.com/voice/pricing/us/)
- [Daily/Pipecat Cloud Pricing](https://www.daily.co/pricing/pipecat-cloud/)
- [Retell AI Pricing](https://www.retellai.com/pricing)
- [Vapi.ai Pricing](https://vapi.ai/pricing)
- [Bland AI Billing](https://docs.bland.ai/platform/billing)
- [Vonage Voice Pricing](https://www.vonage.com/communications-apis/voice/pricing/)
- [Pipecat Telephony Docs](https://docs.pipecat.ai/guides/telephony/overview)
