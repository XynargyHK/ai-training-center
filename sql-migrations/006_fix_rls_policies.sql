-- ============================================================================
-- Migration 006: Fix RLS Policies to Prevent Infinite Recursion
-- This fixes the "infinite recursion detected in policy" error
-- ============================================================================

-- The issue: If a table has a foreign key to users, and users table has RLS
-- policies that reference other tables, you get infinite recursion.

-- Solution: Use simpler RLS policies that don't create circular references

-- ============================================================================
-- FIX USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create simple, non-recursive policies for users table
CREATE POLICY "Enable read for authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to read (adjust as needed)

CREATE POLICY "Enable update for users based on email"
ON users FOR UPDATE
TO authenticated
USING (auth.email() = email);  -- Users can only update their own record

-- ============================================================================
-- ENSURE AI_STAFF HAS PROPER RLS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read for authenticated users" ON ai_staff;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON ai_staff;

-- Create simple RLS policy for ai_staff
CREATE POLICY "Enable all operations for authenticated users"
ON ai_staff FOR ALL
TO authenticated
USING (true);  -- Allow all authenticated users (adjust as needed)

-- ============================================================================
-- ENSURE TRAINING_SESSIONS HAS PROPER RLS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read for authenticated users" ON training_sessions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON training_sessions;

-- Create simple RLS policy for training_sessions
CREATE POLICY "Enable all operations for authenticated users"
ON training_sessions FOR ALL
TO authenticated
USING (true);  -- Allow all authenticated users (adjust as needed)

-- ============================================================================
-- ENSURE TRAINING_SCENARIOS HAS PROPER RLS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read for authenticated users" ON training_scenarios;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON training_scenarios;

-- Create simple RLS policy for training_scenarios
CREATE POLICY "Enable all operations for authenticated users"
ON training_scenarios FOR ALL
TO authenticated
USING (true);  -- Allow all authenticated users (adjust as needed)

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '✅ RLS policies fixed - infinite recursion issue resolved!' AS status;
SELECT '⚠️  Note: These policies allow all authenticated users. Adjust based on your security requirements.' AS warning;
