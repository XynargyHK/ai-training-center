# AI Training Center - Master Implementation Plan

## Created: 2025-12-02
## Last Updated: 2025-12-02

---

## OVERVIEW

This document outlines the complete restructure of the AI Training Center to create a unified, efficient AI system with ONE brain that serves both training and production chat.

### Key Principles:
1. **One AI Brain** - Same AI for training and real chat (no separate coach-training)
2. **Dynamic Categories** - Categories come from knowledge base, not hardcoded
3. **Smart Lookup** - Categorize question → targeted parallel lookups → fast response
4. **Generic Platform** - Works for ANY business/industry type
5. **Only Gemini** - No fallback providers, only Google Gemini

---

## BUSINESS STRUCTURE

```
PERSONAL PROFILE (Administrator/Operator)
    ↓
COMPANY PROFILE (Parent Company)
    ↓
BUSINESS UNITS (Different Business Lines)
    ↓
KNOWLEDGE BASE (Products, Services, Policies per Unit)
    ↓
AI TRAINING (Guidelines, Scenarios per Unit)
    ↓
LIVE CHAT (Uses trained AI brain)
```

---

## PHASE 1: Profile System (Foundation)

### Step 1.1: Profile Button in Header
- [ ] Add "Profile" button next to "AI Training Center" headline
- [ ] Icon: user icon
- [ ] Clicking opens Profile modal/page
- **Status:** NOT STARTED

### Step 1.2: Database Migration
- [ ] Create `user_profiles` table
- [ ] Create `companies` table
- [ ] Add `company_id` FK to `business_units` table
- **Status:** NOT STARTED

### Step 1.3: Profile Modal UI
- [ ] Two tabs: [Personal Profile] [Company Profile]
- [ ] Tab switching shows different form
- [ ] Save button at bottom
- [ ] Close (X) button
- **Status:** NOT STARTED

### Step 1.4: Personal Profile Form
Required Fields:
- [ ] Full Legal Name
- [ ] Email Address
- [ ] Phone Number (with country code)
- [ ] Role in Company (Owner / Director / Manager / Administrator / Other)
- [ ] Profile Photo (upload)

Optional Fields:
- [ ] Preferred Name / Nickname
- [ ] Job Title
- [ ] Department
- [ ] Date of Birth
- [ ] Gender
- [ ] Nationality
- [ ] Languages Spoken (multi-select)
- [ ] LinkedIn Profile URL
- [ ] Bio / About Me
- [ ] ID Documents (type, number, upload front/back, expiry)
- [ ] Address (street, city, state, postal, country)
- [ ] Years of Experience
- [ ] Areas of Expertise
- [ ] Certifications (name, org, date, upload)
- [ ] Communication Style preferences
- [ ] Timezone
- [ ] Notification Preferences
- [ ] Emergency Contact

- **Status:** NOT STARTED

### Step 1.5: Company Profile Form
Required Fields:
- [ ] Company Legal Name
- [ ] Company Registration Number
- [ ] Country of Registration
- [ ] Business Registration License (upload)
- [ ] Company Type (Sole Proprietor / Partnership / Private Limited / Public / Non-Profit / Other)
- [ ] Industry Type (dropdown)
- [ ] Year Established
- [ ] Company Email
- [ ] Company Phone
- [ ] Registered Address (street, city, state, postal, country)

Optional Fields:
- [ ] Trading Name
- [ ] Company Website
- [ ] Company Description
- [ ] Number of Employees
- [ ] Annual Revenue Range
- [ ] Tax ID / VAT Number
- [ ] Operating Address
- [ ] Social Media Links (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)

Optional Expandable Sections:
- [ ] Brand Identity (logo, colors, tagline, personality, values)
- [ ] Communication Guidelines (tone, greeting, sign-off, languages)
- [ ] Legal Documents (certificates, licenses)
- [ ] Policies Overview (refunds, returns, warranty, shipping)
- [ ] AI Guidelines (topics to avoid, competitors to never mention, escalation rules)
- [ ] Banking Info

- **Status:** NOT STARTED

### Step 1.6: File Upload Integration
- [ ] Upload to Supabase Storage
- [ ] Store URLs in database
- [ ] Image preview
- [ ] PDF preview
- **Status:** NOT STARTED

### Step 1.7: Profile Completion Check
- [ ] Check if required fields filled
- [ ] Show completion status indicator
- [ ] Optionally block system until complete
- **Status:** NOT STARTED

### Step 1.8: Connect to Existing System
- [ ] Link companies to business_units
- [ ] Update business unit selector
- **Status:** NOT STARTED

---

## PHASE 2: Knowledge Base Restructure

### Step 2.1: Knowledge Base Page UI
- [ ] Products tab with list/grid view
- [ ] Services tab with list/grid view
- [ ] Policies tab
- [ ] Business Info tab (inherited from company profile)
- [ ] Upload buttons (Excel, PDF, Manual)
- **Status:** NOT STARTED

### Step 2.2: Smart Upload - Excel/CSV
- [ ] File upload component
- [ ] AI auto-detects content type (Products? Services?)
- [ ] AI maps columns to database fields
- [ ] Preview & edit mapping UI
- [ ] Confirm & import to database
- [ ] Auto-tag with categories
- **Status:** NOT STARTED

### Step 2.3: Smart Upload - PDF/Documents
- [ ] PDF text extraction
- [ ] AI parses into structured data
- [ ] Extract images
- [ ] Preview & confirm UI
- [ ] Import to database
- **Status:** NOT STARTED

### Step 2.4: Auto-Generate Categories
- [ ] Analyze uploaded content
- [ ] Generate categories dynamically
- [ ] Tag each entry with category
- [ ] Admin can edit/merge categories
- **Status:** NOT STARTED

### Step 2.5: Knowledge Index + Embeddings
- [ ] Unified `knowledge_index` table
- [ ] Auto-generate searchable text
- [ ] Auto-generate vector embeddings
- [ ] Update on content changes
- **Status:** NOT STARTED

---

## PHASE 3: AI System Consolidation (ONE BRAIN)

### Step 3.1: Merge AI APIs
- [ ] Keep `/api/ai/chat` as THE ONLY AI brain
- [ ] Keep `/api/ai/customer-brain` for training (fake customer)
- [ ] DELETE `/api/ai/coach-training` (redundant)
- **Status:** NOT STARTED

### Step 3.2: Smart Categorizer
- [ ] Create categorizer function
- [ ] Read categories from database (not hardcoded)
- [ ] Match user question to categories using keywords
- [ ] Return relevant category IDs
- **Status:** NOT STARTED

### Step 3.3: Targeted Lookup (Parallel)
- [ ] Query knowledge base by category (parallel)
- [ ] Query guidelines by category (parallel)
- [ ] Query user data if logged in (parallel)
- [ ] Query conversation history (parallel)
- [ ] Combine results quickly
- **Status:** NOT STARTED

### Step 3.4: Update `/api/ai/chat`
- [ ] Implement: Categorize → Lookup → Respond flow
- [ ] Same API for training AND real chat
- [ ] Load guidelines from database
- [ ] Load knowledge from database
- [ ] Support user context
- **Status:** NOT STARTED

### Step 3.5: Update Roleplay Training
- [ ] Change from `/api/ai/coach-training` → `/api/ai/chat`
- [ ] Same brain for practice and production
- [ ] Training feedback saves to guidelines table with category
- **Status:** NOT STARTED

### Step 3.6: Delete Redundant APIs
- [ ] Remove `/api/ai/coach-training`
- [ ] Ensure only Gemini (no Anthropic/OpenAI fallbacks) - DONE
- **Status:** PARTIALLY DONE (fallbacks removed, coach-training not deleted yet)

---

## PHASE 4: Training System

### Step 4.1: Training Scenarios
- [ ] Scenarios based on categories from knowledge base
- [ ] Customer types (angry, confused, price-sensitive, tech-savvy, enthusiastic)
- [ ] Objectives per scenario
- [ ] Per business unit
- **Status:** NOT STARTED

### Step 4.2: Training Flow
- [ ] AI Customer asks questions (via `/api/ai/customer-brain`)
- [ ] AI Staff responds (via `/api/ai/chat` - same brain as production)
- [ ] Trainer gives feedback
- [ ] Feedback saved as guidelines with category
- **Status:** NOT STARTED

### Step 4.3: Guidelines Management
- [ ] Default guidelines (system-provided)
- [ ] Trained guidelines (from feedback)
- [ ] Per category
- [ ] Per business unit
- [ ] Edit/delete guidelines UI
- **Status:** NOT STARTED

---

## PHASE 5: Live Chat System

### Step 5.1: Chat Widget
- [ ] Uses `/api/ai/chat` (trained brain)
- [ ] Loads knowledge base from database
- [ ] Loads guidelines from database
- [ ] Loads user context (if logged in)
- **Status:** EXISTS (needs update to use new system)

### Step 5.2: Conversation History
- [ ] Save per session
- [ ] Load for context in subsequent messages
- [ ] Per business unit
- **Status:** PARTIALLY EXISTS

### Step 5.3: User Data Integration
- [ ] Load user profile data
- [ ] Load purchase history
- [ ] Load previous interactions
- [ ] Filter relevant to question category
- **Status:** NOT STARTED

---

## DATABASE SCHEMA

### New Tables Needed:

```sql
-- user_profiles (Personal Profile)
-- companies (Company Profile)
-- Update business_units to link to companies
-- products (structured product catalog)
-- services (structured service catalog)
-- product_categories
-- service_categories
-- knowledge_index (unified search index)
```

---

## PROGRESS LOG

### 2025-12-02
- [x] Removed all LLM fallback providers (only Gemini now)
- [x] Updated `/api/ai/customer-brain` - Gemini only
- [x] Updated `/api/ai/coach-training` - Gemini only
- [x] Updated `/api/ai/chat` - Gemini only
- [x] Updated `/api/generate-faq` - Gemini only
- [x] Updated `/api/generate-canned` - Gemini only
- [x] Updated `/api/research-sources` - Gemini only
- [x] Updated `/api/translate-content` - Gemini only
- [x] Updated `/api/ai/translate` - Gemini only
- [x] Updated error messages in roleplay-training.tsx (Anthropic → Gemini)
- [x] Fixed `guidelinesData` undefined error in roleplay-training.tsx
- [x] Fixed `t.room` translation conflict (roomLabel)
- [x] Planned full system restructure
- [x] Created this master plan document

- [x] Phase 1, Step 1.1: Add Profile button to header ✅
- [x] Phase 1, Step 1.3: Create Profile Modal UI with two tabs ✅
- [x] Phase 1, Step 1.4: Build Personal Profile Form ✅
- [x] Phase 1, Step 1.5: Build Company Profile Form ✅
- [x] Added translations for Profile (EN, ZH-CN, ZH-TW, VI) ✅
- [x] Phase 1, Step 1.2: Create database migration ✅
  - Created `sql-migrations/027_create_profile_tables.sql`
  - Tables: `companies`, `user_profiles`
  - Added `company_id` FK to `business_units`
  - RLS policies for both authenticated and anonymous users
- [x] Phase 1, Step 1.6: File Upload Integration ✅
  - Created `/api/profile/upload` API endpoint
  - Uploads to Supabase Storage bucket `profile-uploads`
  - Supports profile photos, company logos, and documents
  - 10MB max file size
- [x] Phase 1, Step 1.7: Profile Completion Check ✅
  - Completion percentage on each tab
  - Overall progress bar in footer
  - Green/yellow indicators based on completion
- [x] Phase 1, Step 1.8: Connect to Existing System ✅
  - Profile API links company to business_units
  - Saves/loads from database with localStorage fallback

### PHASE 1 COMPLETE! ✅

### Next Steps:
- [ ] Phase 2: Knowledge Base Restructure
- [ ] Phase 3: AI System Consolidation (ONE BRAIN)

---

## FILES TO MODIFY

### Phase 1 (COMPLETED):
- `src/components/admin/ai-training-center.tsx` - Add Profile button ✅ DONE
- `src/components/admin/profile-modal.tsx` - NEW FILE ✅ DONE
- `src/lib/translations.ts` - Added profile translations ✅ DONE
- `sql-migrations/027_create_profile_tables.sql` - NEW FILE ✅ DONE
- `src/app/api/profile/route.ts` - NEW FILE ✅ DONE
- `src/app/api/profile/upload/route.ts` - NEW FILE ✅ DONE

### Phase 3:
- `src/app/api/ai/chat/route.ts` - Update with categorizer + targeted lookup
- `src/app/api/ai/coach-training/route.ts` - DELETE
- `src/components/admin/roleplay-training.tsx` - Use /api/ai/chat instead

---

## NOTES

- All AI features now use Google Gemini only
- No fallback to Anthropic or OpenAI
- GOOGLE_GEMINI_API_KEY must be set in .env.local
- Categories are dynamic, generated from knowledge base content
- One AI brain serves both training and production
