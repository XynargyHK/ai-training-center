-- Migration: Add conversation analysis columns to chat_sessions
-- Purpose: Store AI-generated keywords and flag levels for admin CS center
-- Date: 2026-02-09

-- Add analysis columns
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS flag_level TEXT DEFAULT 'none';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add index for searching keywords
CREATE INDEX IF NOT EXISTS idx_chat_sessions_keywords ON chat_sessions USING GIN (keywords);

-- Add index for filtering by flag level
CREATE INDEX IF NOT EXISTS idx_chat_sessions_flag_level ON chat_sessions (flag_level) WHERE flag_level != 'none';

-- Comment on columns
COMMENT ON COLUMN chat_sessions.keywords IS 'AI-generated topic/sentiment tags (3-5 keywords)';
COMMENT ON COLUMN chat_sessions.flag_level IS 'Alert level: none, warning, alert';
COMMENT ON COLUMN chat_sessions.flag_reason IS 'Reason for flag (complaint, anger, refund request, etc.)';
COMMENT ON COLUMN chat_sessions.analyzed_at IS 'Timestamp when AI analysis was performed';
