-- ============================================================
-- BRAIN MEMORY TABLES
-- Phase 2: Partitioned memory for AI General Manager
-- ============================================================

-- 1. BRAIN SOUL — Permanent facts about contacts/entities
-- Append-only, versioned, topic-tagged
CREATE TABLE IF NOT EXISTS brain_soul (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,                          -- contact phone/identifier
    business_unit_id UUID REFERENCES business_units(id),
    entity_type TEXT NOT NULL,             -- 'person', 'product', 'preference', 'fact', 'dispute'
    entity_key TEXT NOT NULL,              -- unique key within type (e.g., phone number, product name)
    content TEXT NOT NULL,                 -- the actual fact/knowledge
    source TEXT DEFAULT 'conversation',    -- 'conversation', 'user_explicit', 'system', 'heartbeat'
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,        -- soft delete, previous versions set to false
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast retrieval by user + BU
CREATE INDEX IF NOT EXISTS idx_brain_soul_user_bu ON brain_soul(user_id, business_unit_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_brain_soul_entity ON brain_soul(entity_type, entity_key) WHERE is_active = true;

-- 2. SESSION INSIGHTS — Auto-summary after each conversation
CREATE TABLE IF NOT EXISTS session_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT,                        -- links to chat session or WhatsApp conversation
    user_id TEXT,                           -- contact identifier
    business_unit_id UUID REFERENCES business_units(id),
    channel TEXT NOT NULL DEFAULT 'voice',  -- 'voice', 'whatsapp', 'web', 'phone'
    summary TEXT NOT NULL,                  -- 1-3 sentence summary
    key_topics TEXT[] DEFAULT '{}',         -- array of topic tags
    action_items TEXT[] DEFAULT '{}',       -- things to follow up on
    emotional_tone TEXT DEFAULT 'neutral',  -- 'positive', 'neutral', 'negative', 'stressed'
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_insights_user ON session_insights(user_id, business_unit_id);
CREATE INDEX IF NOT EXISTS idx_session_insights_date ON session_insights(created_at DESC);

-- 3. PENDING INTELLIGENCE — Event queue for Secretary Batcher
CREATE TABLE IF NOT EXISTS pending_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_unit_id UUID REFERENCES business_units(id),
    user_id TEXT,                           -- who this event is about
    event_type TEXT NOT NULL,               -- 'whatsapp_message', 'order', 'payment', 'complaint', 'reminder'
    priority TEXT NOT NULL DEFAULT 'briefing', -- 'immediate', 'briefing', 'background'
    content JSONB NOT NULL,                 -- event payload
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    batch_id TEXT,                          -- groups events into one briefing
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_unprocessed ON pending_intelligence(is_processed, priority) WHERE is_processed = false;
CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_intelligence(user_id, business_unit_id);

-- 4. BRAIN STATE OBJECTS — JSON snapshots for conversation compaction
CREATE TABLE IF NOT EXISTS brain_state_objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT,
    business_unit_id UUID REFERENCES business_units(id),
    version INTEGER DEFAULT 1,
    state JSONB NOT NULL,                   -- {goals, tasks, decisions, user_state, last_topic}
    messages_compacted INTEGER DEFAULT 0,   -- how many messages were summarized
    tokens_before INTEGER,
    tokens_after INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_objects_session ON brain_state_objects(session_id, version DESC);

-- 5. CONTACT LANGUAGE — Per-contact language preference
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS language_detected_from TEXT,
ADD COLUMN IF NOT EXISTS language_confirmed BOOLEAN DEFAULT false;
