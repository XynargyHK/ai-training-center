-- ============================================================================
-- Migration 008: Allow Anonymous Access (Development Only)
-- This allows the app to work without authentication during development
-- ============================================================================

-- ============================================================================
-- OPTION 1: Disable RLS (Simplest for Development)
-- ============================================================================

ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_scenarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE canned_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_units DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '✅ RLS disabled for development - all tables now accessible!' AS status;
SELECT '⚠️  WARNING: This is for development only! Re-enable RLS before production!' AS warning;
