-- Disable Row Level Security to allow data access
-- This will allow the application to read data from these tables

-- Disable RLS on all training-related tables
ALTER TABLE faq_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE canned_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_conversations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable read access for all users" ON faq_library;
DROP POLICY IF EXISTS "Enable read access for all users" ON canned_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON knowledge_base;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;

-- Create simple permissive policies (if you want to re-enable RLS later)
-- These are commented out - uncomment if you want to use RLS with open access

-- CREATE POLICY "Allow all access" ON faq_library FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON canned_messages FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON knowledge_base FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON categories FOR ALL USING (true);
