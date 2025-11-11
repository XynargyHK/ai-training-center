-- ============================================================================
-- Migration 009: Proper RLS Policies (Temporary Public Read Access)
--
-- Strategy:
-- - Enable RLS on all tables
-- - Allow SELECT (read) for anon role (temporary, until auth is added)
-- - No INSERT/UPDATE/DELETE policies for anon (server API with service key handles writes)
-- - When auth is added later, replace these with authenticated user policies
-- ============================================================================

-- Re-enable RLS on all tables first
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop all existing policies to start fresh
-- ============================================================================

DROP POLICY IF EXISTS "public read: training_sessions" ON training_sessions;
DROP POLICY IF EXISTS "public read: training_scenarios" ON training_scenarios;
DROP POLICY IF EXISTS "public read: ai_staff" ON ai_staff;
DROP POLICY IF EXISTS "public read: faq_library" ON faq_library;
DROP POLICY IF EXISTS "public read: canned_messages" ON canned_messages;
DROP POLICY IF EXISTS "public read: categories" ON categories;
DROP POLICY IF EXISTS "public read: knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "public read: guidelines" ON guidelines;
DROP POLICY IF EXISTS "public read: training_data" ON training_data;
DROP POLICY IF EXISTS "public read: business_units" ON business_units;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON training_sessions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON training_scenarios;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON ai_staff;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON training_sessions;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON training_scenarios;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON ai_staff;

-- ============================================================================
-- Create temporary read-only policies for anon role
-- These allow the UI to read data without authentication
-- All writes go through API routes with service role key
-- ============================================================================

-- Training Sessions (read-only)
CREATE POLICY "temp public read: training_sessions"
ON training_sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- Training Scenarios (read-only)
CREATE POLICY "temp public read: training_scenarios"
ON training_scenarios
FOR SELECT
TO anon, authenticated
USING (true);

-- AI Staff / Coaches (read-only)
CREATE POLICY "temp public read: ai_staff"
ON ai_staff
FOR SELECT
TO anon, authenticated
USING (true);

-- FAQ Library (read-only)
CREATE POLICY "temp public read: faq_library"
ON faq_library
FOR SELECT
TO anon, authenticated
USING (true);

-- Canned Messages (read-only)
CREATE POLICY "temp public read: canned_messages"
ON canned_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- Categories (read-only)
CREATE POLICY "temp public read: categories"
ON categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Knowledge Base (read-only)
CREATE POLICY "temp public read: knowledge_base"
ON knowledge_base
FOR SELECT
TO anon, authenticated
USING (true);

-- Guidelines (read-only)
CREATE POLICY "temp public read: guidelines"
ON guidelines
FOR SELECT
TO anon, authenticated
USING (true);

-- Training Data (read-only)
CREATE POLICY "temp public read: training_data"
ON training_data
FOR SELECT
TO anon, authenticated
USING (true);

-- Business Units (read-only)
CREATE POLICY "temp public read: business_units"
ON business_units
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '✅ RLS enabled with proper read-only policies!' AS status;
SELECT '📖 Clients can read via anon key, writes go through API with service key' AS architecture;
SELECT '🔒 No INSERT/UPDATE/DELETE policies for anon - server API handles all writes' AS security;
SELECT '⏰ When adding auth: replace "anon" with "authenticated" and add ownership checks' AS future;
