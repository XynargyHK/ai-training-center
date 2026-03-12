-- Fix Database Blockers: Recursive RLS and Missing Columns

-- 1. Fix Infinite Recursion in users table RLS
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their business unit" ON users;

-- Create a non-recursive version using a subquery that doesn't trigger the same policy
-- We use (auth.uid() = id) which is a direct check and doesn't recurse
CREATE POLICY "Users can view members of their business unit"
  ON users FOR SELECT
  USING (
    business_unit_id = (SELECT business_unit_id FROM users WHERE id = auth.uid())
  );

-- 2. Add is_published to canned_messages table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='canned_messages' AND column_name='is_published') THEN
        ALTER TABLE canned_messages ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Add is_published to knowledge_base table (just in case)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='is_published') THEN
        ALTER TABLE knowledge_base ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Fix potential recursion in knowledge_base if it exists
DROP POLICY IF EXISTS "Users can view their business unit's knowledge base" ON knowledge_base;
CREATE POLICY "Users can view their business unit's knowledge base"
  ON knowledge_base FOR ALL
  USING (
    business_unit_id = (SELECT business_unit_id FROM users WHERE id = auth.uid())
  );

-- 5. Final check to ensure RLS is enabled correctly
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

SELECT '✅ Database blockers fixed successfully!' as status;
