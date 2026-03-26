-- Voice call logs (turn-by-turn conversation)
CREATE TABLE IF NOT EXISTS voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  business_unit_id UUID REFERENCES business_units(id),
  from_number TEXT,
  to_number TEXT,
  user_speech TEXT,
  ai_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full call summary (one row per call)
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT UNIQUE NOT NULL,
  business_unit_id UUID REFERENCES business_units(id),
  direction TEXT DEFAULT 'inbound', -- inbound / outbound
  from_number TEXT,
  to_number TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  mood TEXT, -- happy / neutral / concerned
  flags JSONB DEFAULT '[]',
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Twilio number to business_units so we can route calls to the right brand
ALTER TABLE business_units ADD COLUMN IF NOT EXISTS twilio_number TEXT;

-- Index for fast lookup by call SID
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_sid ON voice_call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_calls_business_unit ON voice_calls(business_unit_id);
