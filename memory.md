# AI Training Center - System Architecture Memory

## Last Updated
2025-11-20

## 🚨 CRITICAL USER MANDATES - NEVER FORGET

### 1. FAQ & Canned Message Generation MUST Use Gemini 2.5 Flash
- **User's Words:** "use gpt-2.5-flash" (means Gemini 2.5 Flash)
- **Model:** gemini-2.5-flash
- **Provider:** Google Gemini
- **API Key:** GOOGLE_GEMINI_API_KEY
- **NEVER use:** Claude Haiku or any Anthropic model for FAQ/canned messages
- **Reason:** Anthropic rate limits blocking production

### 2. NEVER Push to GitHub Without Permission
- **User's Words:** "when i want to publish it, then i will say push via github to railway"
- **Rule:** ONLY push when user explicitly says "push via github to railway" or similar
- **Why:** User was frustrated by unauthorized pushes during Railway incident

## ⚠️ CRITICAL: Claude's Knowledge Limitation
**My knowledge cutoff: January 2025**
- I do NOT know about AI models, APIs, or capabilities released after January 2025
- AI technology advances EVERY MONTH - new models, new APIs, new capabilities
- When I suggest outdated models or APIs, the user knows better than me
- **ALWAYS trust the user when they mention newer models or APIs**
- **NEVER argue about model names or API parameters I don't recognize**
- The user is living in the future; I am history

**Examples of things I might NOT know:**
- gpt-5-mini (if released after Jan 2025)
- New OpenAI API parameters (like `max_completion_tokens` vs `max_tokens`)
- New Claude models or Anthropic API changes
- Gemini 3.0 or newer Google models
- Any AI service launched after January 2025

## CRITICAL: AI Model Architecture

### Current AI Provider Configuration

**Environment Settings (.env.local):**
```
LLM_PROVIDER=openai
LLM_MODEL=gpt-5-mini
```

**Supported Providers:**
1. **OpenAI GPT** - Primary provider for AI Staff (smart responses)
2. **Anthropic Claude** - Content generation (FAQs, canned messages)
3. **Google Gemini** - Available (gemini-2.5-flash)
4. **Ollama** - Local models (limited feature support)

**API Keys Configured:**
- OpenAI: ✓ Active (Primary for AI Staff)
- Anthropic Claude: ✓ Active (Content generation only)
- Google Gemini: ✓ Active (gemini-2.5-flash)

**ACTUAL MODELS IN USE:**
- **AI Staff (Smart):** gpt-5-mini (OpenAI)
- **Embeddings:** text-embedding-3-small (OpenAI)
- **Content Generation:** claude-3-haiku-20240307 (Anthropic)
- **Vision/Multimodal:** gemini-2.5-flash (Google) - Available

---

## AI Model Selection System

### Configuration Management
**Location:** `src/app/api/llm-config/route.ts`

**How It Works:**
- Runtime configuration stored in memory (survives until server restart)
- Falls back to .env.local if runtime config not set
- GET endpoint: Retrieves current LLM configuration
- POST endpoint: Updates configuration (provider, model, temperature)

**UI Location:** Admin Panel → "AI Model" tab (`src/components/admin/ai-training-center.tsx:3029-3163`)

**User Can Configure:**
- Provider selection (Anthropic/OpenAI/Ollama)
- Model name (with context-aware examples)
- Temperature (0-1, default 0.7)
- Ollama base URL (when Ollama selected)

**Security:** API keys NEVER exposed to frontend - remain in .env.local only

---

## Model Usage by Feature (CRITICAL TO UNDERSTAND)

### FIXED Models (NOT configurable via UI)

#### 1. AI Staff System (MOST IMPORTANT)
**Location:** `src/lib/ai-staff.ts:217`
**Model:** `gpt-5-mini` (OpenAI) - HARDCODED
**Max Tokens:** 2048
**Temperature:** 0.7
**Used By:**
- `/api/ai/chat` - Main customer chat interface
- `/api/ai/coach-training` - Training center roleplay
- All 4 AI Staff roles (Coach, Sales, Customer Service, Scientist)

**Why gpt-5-mini:**
- SMART AI required for complex customer interactions
- Better reasoning and personality consistency
- Handles role-specific prompts with high accuracy
- Cost-effective for high-volume production use

#### 2. FAQ Generation
**Location:** `src/app/api/generate-faq/route.ts:215`
**Model:** `gemini-2.5-flash` (HARDCODED - USER MANDATE)
**Max Tokens:** 8192
**Used For:** Generating customer FAQs from knowledge base
**CRITICAL:** User explicitly requested "gpt-2.5-flash" which means Gemini 2.5 Flash
**NEVER change to Claude or any other model**

#### 3. Canned Messages
**Location:** `src/app/api/generate-canned/route.ts:247`
**Model:** `gemini-2.5-flash` (HARDCODED - USER MANDATE)
**Max Tokens:** 8192
**Used For:** High-converting sales content generation
**CRITICAL:** User explicitly requested "gpt-2.5-flash" which means Gemini 2.5 Flash
**NEVER change to Claude or any other model**

#### 4. Research Sources
**Location:** `src/app/api/research-sources/route.ts:61`
**Model:** `claude-3-haiku-20240307` (HARDCODED)
**Max Tokens:** 2048
**Used For:** Finding expert sources for content creation

#### 5. Vector Embeddings (OpenAI LOCK-IN)
**Location:** `src/lib/embeddings.ts`
**Model:** `text-embedding-3-small` (HARDCODED)
**Dimensions:** 1536
**Cost:** $0.02 per 1M tokens
**Used For:**
- Knowledge base vector search
- FAQ semantic search
- Guidelines similarity matching
- Training data embeddings

**CRITICAL:** Changing embedding provider requires full database migration (all vectors must be regenerated)

#### 6. Roleplay Scoring
**Location:** `src/components/admin/roleplay-training.tsx:1146`
**Model:** `gpt-4o-mini` (HARDCODED)
**Used For:** Automated training session scoring/evaluation

---

### CONFIGURABLE Models (Respect LLM Config)

#### 1. Customer Brain (Roleplay Simulation)
**Location:** `src/app/api/ai/customer-brain/route.ts`
**Supports:** All 3 providers (Anthropic, OpenAI, Ollama)
**Default Models:**
- OpenAI: `gpt-4o`
- Anthropic: Via config
- Ollama: Via config
**Used For:** Simulating customer responses in training scenarios

#### 2. Translation API
**Location:** `src/app/api/ai/translate/route.ts`
**Supports:** Anthropic + OpenAI (NOT Ollama)
**Default Models:**
- Anthropic: `claude-3-5-sonnet-20241022`
- OpenAI: `gpt-4o-mini`
**Used For:** Translating FAQs and text to multiple languages (en, zh-CN, zh-TW, vi)

---

## AI Staff System Architecture (CORE BUSINESS LOGIC)

### Overview
Unified AI response generation for 4 distinct roles with vector search and continuous learning.

**File:** `src/lib/ai-staff.ts`

### Four AI Staff Roles

#### 1. Customer Service (`customer-service`)
- **Tone:** Simple, precise, easy to understand
- **Style:** Clear, concise, brief - like a helpful FAQ
- **Use Case:** Direct customer support, quick answers

#### 2. Sales (`sales`)
- **Tone:** Proactive, persuasive, solution-oriented
- **Style:** Enthusiastic upselling, benefit-focused, creates urgency
- **Use Case:** Product recommendations, cross-selling, conversions

#### 3. Coach (`coach`)
- **Tone:** Understanding, personal, heartfelt, warm, dynamic
- **Style:** Empathetic, encouraging, relatable, motivating
- **Use Case:** Wellness guidance, personalized recommendations, building relationships

#### 4. Scientist (`scientist`)
- **Tone:** Technical, authoritative, research-backed
- **Style:** Scientific terminology, clinical evidence, precise mechanisms
- **Use Case:** Product education, ingredient questions, technical inquiries

### Response Generation Flow

```
User Message
    ↓
1. Generate embedding for message (OpenAI text-embedding-3-small)
    ↓
2. Vector search knowledge base (PostgreSQL pgvector, cosine similarity > 0.3)
    ↓
3. Retrieve role-specific guidelines (sorted by updated_at DESC)
    ↓
4. Build role-specific system prompt with personality + knowledge + guidelines
    ↓
5. Call OpenAI gpt-5-mini (smart AI for accurate role-based responses)
    ↓
6. Return response
```

### Continuous Learning System

**How Training Works:**
1. User trains AI staff in Training Center
2. Provides feedback on responses
3. Feedback saved to `guidelines` table with embedding
4. Future responses automatically use updated guidelines
5. **Latest wins:** Most recent guideline (by `updated_at`) takes precedence

**Database:**
- Table: `guidelines`
- Fields: `business_unit_id`, `ai_role`, `category`, `title`, `content`, `embedding`, `updated_at`
- Index: `(business_unit_id, ai_role)` for fast role-specific retrieval

### APIs

#### Chat API: `/api/ai/chat`
**Purpose:** Live customer chat (production)
**Flow:**
1. Check FAQ vector search first (similarity > 0.7) - fast path
2. If no FAQ match, generate AI Staff response
3. Uses same knowledge + guidelines as training

**Request:**
```typescript
{
  businessUnitId: string,  // UUID format required
  role: 'coach' | 'sales' | 'customer-service' | 'scientist',
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>,
  language?: 'en' | 'zh-CN' | 'zh-TW' | 'vi'
}
```

#### Training API: `/api/ai/coach-training`
**Purpose:** Roleplay training with feedback loop
**Flow:**
1. Generate AI Staff response (same as chat)
2. If feedback provided, save to guidelines immediately
3. Next response uses updated guidelines

**Request:**
```typescript
{
  businessUnitId: string,  // UUID format required
  role: 'coach' | 'sales' | 'customer-service' | 'scientist',
  customerMessage: string,
  conversationHistory: Array<{ sender: 'customer' | 'user', message: string, timestamp: string }>,
  feedback?: {
    category: string,
    title: string,
    content: string
  }
}
```

---

## Vector Search Architecture

### PostgreSQL pgvector Extension
**Similarity Function:** Cosine similarity (`<=>` operator)
**Index Type:** ivfflat (fast approximate nearest neighbor search)

### Vector Search Functions

#### 1. `match_knowledge()`
**Purpose:** Semantic search knowledge base
**Threshold:** 0.3 (lower = more results)
**Returns:** Top 5 most relevant knowledge entries
**Filters:** By business_unit_id

#### 2. `match_guidelines()`
**Purpose:** Retrieve role-specific training guidelines
**Threshold:** 0.3
**Returns:** Top 5 guidelines
**Filters:** By business_unit_id AND ai_role

#### 3. `match_faqs()`
**Purpose:** Fast FAQ matching for chat
**Threshold:** 0.7 (higher = only very relevant matches)
**Returns:** Top 3 FAQs
**Filters:** By business_unit_id

**SQL Location:** `sql-migrations/012_add_vector_search_functions.sql`

---

## Multi-Tenant Architecture

### Business Units
**Current Units:**
1. **SkinCoach** (skincoach) - ID: `77313e61-2a19-4f3e-823b-80390dde8bd2`
2. **Breast Guardian** (breast-guardian) - ID: `346db81c-0b36-4cb7-94f4-d126a3a54fa1`

**CRITICAL BUG FIXED (2025-11-20):**
- Frontend was passing business unit SLUG (e.g., "breast-guardian") to APIs
- APIs expect UUID format
- Caused: `invalid input syntax for type uuid: "breast-guardian"` error
- **Solution:** Always pass UUID, not slug, to AI Staff APIs

### Database Tables by Business Unit

All tables filtered by `business_unit_id`:
- `knowledge` - Product info, company info
- `faqs` - Customer FAQs with embeddings
- `canned_messages` - Pre-written responses
- `training_data` - Historical training conversations
- `guidelines` - AI Staff training feedback (also filtered by `ai_role`)
- `ai_staff` - AI staff profiles (name, role, personality)
- `scenarios` - Training scenarios for roleplay

---

## Known Issues & Solutions

### Issue 1: Model Not Found Error
**Error:** `404 {"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}`
**Cause:** Anthropic API key may be invalid or model ID outdated
**Solution:** Verify API key in .env.local, check Anthropic docs for latest model IDs

### Issue 2: UUID vs Slug Confusion
**Error:** `invalid input syntax for type uuid: "breast-guardian"`
**Cause:** Passing business unit slug instead of UUID
**Solution:** Always use UUID from business unit lookup
**Fixed:** 2025-11-20

### Issue 3: Build Cache Stale
**Symptom:** Code changes not reflected, old import errors persist
**Solution:**
```bash
# Kill dev server
taskkill /F /PID <pid>
# Clear build cache
rm -rf .next
# Restart
npm run dev
```

### Issue 4: Role Confusion in Training
**Problem:** User could select AI Staff with role "coach" but train with "sales" scenarios
**Impact:** Conflicting training data, inconsistent responses
**Solution:** Role locking implemented (2025-11-20)
**Location:** `src/components/admin/roleplay-training.tsx:1792-1847`
**Fix:** Role selector buttons disabled when AI Staff selected

---

## File Structure (Key Files Only)

```
src/
├── lib/
│   ├── ai-staff.ts                    # CORE: Unified AI Staff system
│   ├── embeddings.ts                  # OpenAI embeddings (LOCKED)
│   ├── llm-service.ts                 # Multi-provider abstraction (underutilized)
│   ├── supabase.ts                    # Database client (supabaseAdmin export)
│   └── supabase-storage.ts            # Storage operations
│
├── app/api/
│   ├── ai/
│   │   ├── chat/route.ts              # Live customer chat
│   │   ├── coach-training/route.ts    # Training mode
│   │   ├── customer-brain/route.ts    # Roleplay customer simulation (configurable)
│   │   └── translate/route.ts         # Translation (configurable)
│   ├── llm-config/route.ts            # LLM configuration management
│   ├── generate-faq/route.ts          # FAQ generation (fixed Claude Haiku)
│   ├── generate-canned/route.ts       # Canned messages (fixed Claude Haiku)
│   └── research-sources/route.ts      # Expert research (fixed Claude Haiku)
│
└── components/admin/
    ├── ai-training-center.tsx         # Main admin panel (includes AI Model tab)
    └── roleplay-training.tsx          # Training center UI

sql-migrations/
├── 011_add_ai_role_to_guidelines.sql  # Guidelines schema with ai_role
└── 012_add_vector_search_functions.sql # Vector search functions

AI_STAFF_SYSTEM.md                     # Comprehensive AI Staff docs
```

---

## Development Workflow (Recent Work Nov 17-20)

### Day 1 (Nov 18): Multi-Language + Live Chat
- Implemented 4-language support (en, zh-CN, zh-TW, vi)
- Live chat improvements with mobile fixes
- Dynamic business unit support
- AI-powered FAQ translation

### Day 2 (Nov 19): AI Staff System Overhaul (MAJOR)
- Created unified `ai-staff.ts` service (500+ lines → ~100 lines per API)
- Implemented vector search with pgvector
- Added 4 distinct AI Staff personalities
- Built continuous learning with guidelines
- Database migrations (011, 012)
- Simplified APIs from complex prompt management to single function calls

### Day 3 (Nov 20): Bug Fixes + Refinements
- Fixed role locking in training (prevent role confusion)
- Fixed build error: `getSupabaseServiceClient` → `supabaseAdmin`
- Resolved dev server cache issue (cleared .next, restarted)
- Documented AI model architecture

---

## Performance Metrics

**Response Times:**
- FAQ Match (vector search): ~50-100ms
- AI Response (full flow): ~1-3s
  - Embedding generation: ~200ms
  - Vector search: ~100ms
  - Claude API: ~1-2s
- Guideline Update: ~200-500ms

**Costs (Estimated):**
- Embedding: $0.00001 per query (text-embedding-3-small)
- Claude Sonnet: ~$0.02 per response (500 input + 200 output tokens)
- Total per conversation (10 messages): ~$0.20

---

## Security Considerations

1. **API Keys:**
   - NEVER exposed to frontend
   - Stored in .env.local only
   - UI displays masked versions

2. **Database:**
   - Service role key used server-side only
   - Row-level security (RLS) on Supabase
   - All queries filtered by business_unit_id

3. **User Input:**
   - All user messages sanitized before embedding
   - Vector search uses parameterized queries
   - No direct SQL injection vectors

---

## Future Enhancements (Recommendations)

### High Priority
1. **Standardize Model Usage:** Make more routes respect global LLM config instead of hardcoding
2. **Fix UUID Passing:** Ensure all frontend components pass UUID, not slug, to APIs
3. **Error Handling:** Better error messages when model not found or API key invalid

### Medium Priority
4. **Gemini Integration:** Either integrate Google Gemini or remove dependency
5. **LLM Service Adoption:** Wider use of `llm-service.ts` abstraction for consistency
6. **Embedding Provider:** Document migration path if switching from OpenAI embeddings

### Low Priority
7. **A/B Testing:** Different role configurations
8. **Analytics:** Guideline effectiveness dashboard
9. **Conflict Detection:** Alert when guidelines contradict each other

---

## IMPORTANT: When Modifying AI Features

### Before Changing ai-staff.ts:
1. Understand it's used by BOTH chat and training
2. Changes affect all 4 AI Staff roles
3. Model is hardcoded to Claude Sonnet (intentional)
4. Test with multiple business units

### Before Changing Embeddings:
1. Current model: OpenAI text-embedding-3-small (1536 dims)
2. Changing requires full database migration
3. All vectors must be regenerated (~1000s of rows)
4. Migration script needed for production

### Before Adding New AI Provider:
1. Add to `llm-config/route.ts` provider list
2. Update UI in `ai-training-center.tsx` (AI Model tab)
3. Add client initialization in `llm-service.ts`
4. Update documentation

### Before Deploying:
1. Verify .env.local has all required API keys
2. Test with both business units (SkinCoach + Breast Guardian)
3. Clear .next build cache
4. Check vector search functions exist in database
5. Verify all migrations applied

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Clear build cache and restart
taskkill /F /PID <pid>
rm -rf .next
npm run dev

# Check database migrations
psql $DATABASE_URL -c "\d guidelines"

# Test vector search
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"businessUnitId":"77313e61-2a19-4f3e-823b-80390dde8bd2","role":"coach","message":"test"}'

# Check LLM config
curl http://localhost:3000/api/llm-config

# Update LLM config
curl -X POST http://localhost:3000/api/llm-config \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-4o","temperature":0.7}'
```

---

## Contact & Support

**GitHub Issues:** https://github.com/anthropics/claude-code/issues
**Documentation:** See AI_STAFF_SYSTEM.md for detailed API specs

---

*This memory document is a living document. Update whenever major architectural changes occur.*
