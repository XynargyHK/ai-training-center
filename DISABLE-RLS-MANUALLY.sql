-- RUN THIS SQL IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new

-- 1. Disable RLS on all tables
ALTER TABLE faq_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE canned_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_conversations DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (if any)
DROP POLICY IF EXISTS "Enable read access for all users" ON faq_library;
DROP POLICY IF EXISTS "Enable read access for all users" ON canned_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON knowledge_base;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON faq_library;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON canned_messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON knowledge_base;

-- 3. Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('faq_library', 'canned_messages', 'knowledge_base', 'categories');

-- If rowsecurity = false, RLS is disabled ✅
