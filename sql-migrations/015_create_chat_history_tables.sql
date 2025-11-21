-- Create chat_sessions table to track user chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE SET NULL,
  user_identifier TEXT, -- Can be email, user ID, or anonymous session ID
  user_ip TEXT,
  user_agent TEXT,
  language TEXT DEFAULT 'en',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_messages INT DEFAULT 0,
  has_red_flags BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table to store individual messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  image_url TEXT, -- URL to image in Supabase Storage
  has_image BOOLEAN DEFAULT FALSE,
  ai_model TEXT, -- Which AI model generated the response
  ai_provider TEXT, -- anthropic, openai, google
  tokens_used INT,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  sentiment TEXT, -- positive, negative, neutral
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_business_unit ON chat_sessions(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_flagged ON chat_sessions(has_red_flags);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started ON chat_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_flagged ON chat_messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can do everything on chat_sessions"
  ON chat_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on chat_messages"
  ON chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own sessions
CREATE POLICY "Users can read their own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (true); -- Can be restricted to user_identifier if needed

CREATE POLICY "Users can read their own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

-- Create function to increment message count
CREATE OR REPLACE FUNCTION increment_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET total_messages = total_messages + 1
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment message count
DROP TRIGGER IF EXISTS increment_message_count ON chat_messages;
CREATE TRIGGER increment_message_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_message_count();

COMMENT ON TABLE chat_sessions IS 'Stores chat sessions for tracking and compliance';
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages with images';
COMMENT ON COLUMN chat_sessions.has_red_flags IS 'True if session contains flagged content';
COMMENT ON COLUMN chat_messages.is_flagged IS 'True if message is flagged for review';
