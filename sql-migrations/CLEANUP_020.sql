-- ============================================================================
-- CLEANUP SCRIPT - Remove Partial 020 Migration
-- Run this FIRST if you have errors from a partial migration
-- Then run 020_SAFE_appointment_workflow.sql
-- ============================================================================

-- ============================================================================
-- 1. DROP POLICIES (if they exist)
-- ============================================================================

DROP POLICY IF EXISTS "Service role has full access to change_requests" ON appointment_change_requests;
DROP POLICY IF EXISTS "Service role has full access to change_history" ON appointment_change_history;
DROP POLICY IF EXISTS "Public can view change requests" ON appointment_change_requests;
DROP POLICY IF EXISTS "Public can view change history" ON appointment_change_history;

-- ============================================================================
-- 2. DROP TRIGGERS (if they exist)
-- ============================================================================

DROP TRIGGER IF EXISTS update_change_requests_updated_at ON appointment_change_requests;

-- ============================================================================
-- 3. DROP FUNCTIONS (if they exist)
-- ============================================================================

DROP FUNCTION IF EXISTS create_appointment_change_request(UUID, TEXT, UUID, TEXT, DATE, TIME, TIME, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS manager_review_change_request(UUID, BOOLEAN, TEXT, TEXT);
DROP FUNCTION IF EXISTS client_confirm_change_request(UUID, BOOLEAN, TEXT);

-- ============================================================================
-- 4. DROP INDEXES (if they exist)
-- ============================================================================

DROP INDEX IF EXISTS idx_change_requests_appointment;
DROP INDEX IF EXISTS idx_change_requests_staff;
DROP INDEX IF EXISTS idx_change_requests_status;
DROP INDEX IF EXISTS idx_change_requests_business_unit;
DROP INDEX IF EXISTS idx_change_history_appointment;
DROP INDEX IF EXISTS idx_change_history_request;
DROP INDEX IF EXISTS idx_change_history_changed_at;

-- ============================================================================
-- 5. DROP TABLES (CASCADE to remove dependencies)
-- ============================================================================

-- Drop in correct order (history first, then requests)
DROP TABLE IF EXISTS appointment_change_history CASCADE;
DROP TABLE IF EXISTS appointment_change_requests CASCADE;

-- ============================================================================
-- 6. RESET APPOINTMENT STATUS CONSTRAINT (optional - keep old statuses for now)
-- ============================================================================

-- Drop the constraint if it exists
DO $$ BEGIN
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Re-add basic statuses (without pending_edit/pending_cancellation)
-- We'll add those back when we run 020_SAFE
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
    'rescheduled'
  ));

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================

-- Verify cleanup
SELECT
  'Tables' as type,
  COUNT(*) as remaining
FROM information_schema.tables
WHERE table_name IN ('appointment_change_requests', 'appointment_change_history')

UNION ALL

SELECT
  'Functions' as type,
  COUNT(*) as remaining
FROM information_schema.routines
WHERE routine_name LIKE '%change_request%';

-- Expected result:
-- Tables: 0
-- Functions: 0

-- ============================================================================
-- NEXT STEP: Run 020_SAFE_appointment_workflow.sql
-- ============================================================================
