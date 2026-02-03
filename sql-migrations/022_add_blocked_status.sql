-- ============================================
-- ADD 'BLOCKED' STATUS TO APPOINTMENTS
-- ============================================
-- Allows staff to block time in their schedule

-- Check if the status type includes 'blocked'
DO $$
BEGIN
  -- If using an enum type, we need to add 'blocked' to it
  -- If using CHECK constraint, we need to update it

  -- First, check if there's a CHECK constraint on status
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    -- Drop and recreate the check constraint to include 'blocked'
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'pending_edit', 'pending_cancellation', 'blocked'));
  END IF;

  RAISE NOTICE 'Added "blocked" status to appointments';
END $$;

-- Update RLS policies to handle blocked appointments
-- Service role can manage all blocked times (including viewing in calendar)
DROP POLICY IF EXISTS "Service role can manage blocked appointments" ON appointments;
CREATE POLICY "Service role can manage blocked appointments"
  ON appointments FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON COLUMN appointments.status IS 'Appointment status: pending, confirmed, completed, cancelled, pending_edit, pending_cancellation, or blocked (for time blocking)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Added "blocked" status to appointments';
  RAISE NOTICE '✓ Updated RLS policies for blocked time';
  RAISE NOTICE '';
  RAISE NOTICE 'Staff can now block time in their schedules!';
END $$;
