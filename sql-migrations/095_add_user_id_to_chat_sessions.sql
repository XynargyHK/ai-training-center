-- ============================================
-- Migration 095: Add user_id to chat_sessions
-- ============================================
-- Links chat sessions to authenticated Supabase users for the progressive profiling system

-- Add user_id column
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

COMMENT ON COLUMN chat_sessions.user_id IS 'Links chat session to authenticated Supabase user for account page history';
