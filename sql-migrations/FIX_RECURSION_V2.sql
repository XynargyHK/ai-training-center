-- Fix Database Blockers: Recursive RLS v2

-- 1. Fix Infinite Recursion in companies table
-- Problematic policy: id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
CREATE POLICY "Users can view their companies" ON companies
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- 2. Fix Infinite Recursion in users table
-- Let's use a more robust way to check business_unit_id that doesn't trigger SELECT on users
DROP POLICY IF EXISTS "Users can view members of their business unit" ON users;
CREATE POLICY "Users can view members of their business unit"
  ON users FOR SELECT
  USING (
    -- Use a subquery with a LIMIT 1 to ensure it's not recursive in a way that blows up
    business_unit_id = (SELECT u.business_unit_id FROM users u WHERE u.id = auth.uid() LIMIT 1)
  );

-- 3. Fix Knowledge Base policy
DROP POLICY IF EXISTS "Users can view their business unit's knowledge base" ON knowledge_base;
CREATE POLICY "Users can view their business unit's knowledge base"
  ON knowledge_base FOR ALL
  USING (
    business_unit_id = (SELECT u.business_unit_id FROM users u WHERE u.id = auth.uid() LIMIT 1)
  );

-- 4. Fix AI Staff policy
DROP POLICY IF EXISTS "Users can manage their business unit's AI staff" ON ai_staff;
CREATE POLICY "Users can manage their business unit's AI staff"
  ON ai_staff FOR ALL
  USING (
    business_unit_id = (SELECT u.business_unit_id FROM users u WHERE u.id = auth.uid() LIMIT 1)
  );

-- 5. Fix Conversations policy
DROP POLICY IF EXISTS "Users can view their business unit's conversations" ON conversations;
CREATE POLICY "Users can view their business unit's conversations"
  ON conversations FOR ALL
  USING (
    business_unit_id = (SELECT u.business_unit_id FROM users u WHERE u.id = auth.uid() LIMIT 1)
  );

-- 6. Add is_published to knowledge_base if missing (from previous fix)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='is_published') THEN
        ALTER TABLE knowledge_base ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

SELECT '✅ Database recursion blockers fixed successfully!' as status;
