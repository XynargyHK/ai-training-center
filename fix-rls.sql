-- Final RLS Fixes (Consolidated)
-- This file contains the consolidated fixes for infinite recursion and missing columns.

-- 1. Fix Infinite Recursion in users table
DROP POLICY IF EXISTS "Users can view members of their business unit" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own business unit" ON users;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "allow_read_own" ON users;

CREATE POLICY "users_read_self" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Fix Knowledge Base
DROP POLICY IF EXISTS "Users can view their business unit's knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "anon_read_knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "temp public read: knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "knowledge_base_read_policy" ON knowledge_base;

CREATE POLICY "knowledge_base_read_policy" ON knowledge_base
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Fix Canned Messages
DROP POLICY IF EXISTS "anon_read_canned_messages" ON canned_messages;
DROP POLICY IF EXISTS "canned_messages_read_policy" ON canned_messages;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='canned_messages' AND column_name='is_published') THEN
        ALTER TABLE canned_messages ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE POLICY "canned_messages_read_policy" ON canned_messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Fix AI Staff
DROP POLICY IF EXISTS "Users can manage their business unit's AI staff" ON ai_staff;
DROP POLICY IF EXISTS "ai_staff_read_policy" ON ai_staff;

CREATE POLICY "ai_staff_read_policy" ON ai_staff
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Fix Guidelines
DROP POLICY IF EXISTS "anon_read_guidelines" ON guidelines;
DROP POLICY IF EXISTS "temp public read: guidelines" ON guidelines;

CREATE POLICY "guidelines_read_policy" ON guidelines
  FOR SELECT
  TO anon, authenticated
  USING (true);
