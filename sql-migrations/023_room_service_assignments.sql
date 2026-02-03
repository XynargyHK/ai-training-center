-- ============================================
-- ROOM-SERVICE ASSIGNMENTS
-- ============================================
-- Allows assigning specific services to specific rooms
-- Example: VIP room can handle facial + massage, consultation room only handles consultations

-- Step 1: Create room_services junction table
CREATE TABLE IF NOT EXISTS room_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES treatment_rooms(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES appointment_services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, service_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_services_room ON room_services(room_id);
CREATE INDEX IF NOT EXISTS idx_room_services_service ON room_services(service_id);

-- Step 2: RLS Policies
ALTER TABLE room_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access to room_services" ON room_services;
CREATE POLICY "Service role has full access to room_services"
  ON room_services FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view room_services" ON room_services;
CREATE POLICY "Users can view room_services"
  ON room_services FOR SELECT TO anon, authenticated
  USING (true);

-- Step 3: Function to check if room can handle service
CREATE OR REPLACE FUNCTION room_can_handle_service(
  p_room_id UUID,
  p_service_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_assignment BOOLEAN;
  v_assignment_count INTEGER;
BEGIN
  -- Check if this room has any service assignments
  SELECT COUNT(*) INTO v_assignment_count
  FROM room_services
  WHERE room_id = p_room_id;

  -- If no assignments exist, room can handle any service (backward compatible)
  IF v_assignment_count = 0 THEN
    RETURN TRUE;
  END IF;

  -- If assignments exist, check if this specific service is assigned
  SELECT EXISTS (
    SELECT 1
    FROM room_services
    WHERE room_id = p_room_id
      AND service_id = p_service_id
  ) INTO v_has_assignment;

  RETURN v_has_assignment;
END;
$$;

-- Step 4: Update auto_assign_room function to consider service compatibility
-- Drop all versions of the function by querying pg_proc
DO $$
DECLARE
  func_oid OID;
BEGIN
  -- Find and drop all versions of auto_assign_room
  FOR func_oid IN
    SELECT oid FROM pg_proc WHERE proname = 'auto_assign_room'
  LOOP
    EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

-- Create new version with service_id parameter
CREATE OR REPLACE FUNCTION auto_assign_room(
  p_outlet_id UUID,
  p_service_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- Find a room that is:
  -- 1. At the specified outlet
  -- 2. Active
  -- 3. Can handle the requested service
  -- 4. Not booked during the requested time slot
  SELECT tr.id INTO v_room_id
  FROM treatment_rooms tr
  WHERE tr.outlet_id = p_outlet_id
    AND tr.is_active = true
    AND room_can_handle_service(tr.id, p_service_id) = true
    AND NOT EXISTS (
      -- Check for conflicting appointments
      SELECT 1
      FROM appointments a
      WHERE a.room_id = tr.id
        AND a.appointment_date = p_appointment_date
        AND a.status NOT IN ('cancelled', 'completed')
        AND (
          -- Exclude the current appointment if editing
          (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
        )
        AND (
          -- Check for time overlap
          (a.start_time, a.end_time) OVERLAPS (p_start_time, p_end_time)
        )
    )
  ORDER BY tr.room_number
  LIMIT 1;

  RETURN v_room_id;
END;
$$;

-- Step 5: Comments
COMMENT ON TABLE room_services IS 'Junction table linking rooms to services they can handle';
COMMENT ON FUNCTION room_can_handle_service IS 'Returns true if room can handle the service (considers assignments, defaults to true if no assignments)';
COMMENT ON FUNCTION auto_assign_room IS 'Automatically assigns an available room that can handle the service at the specified outlet for the given time slot';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Room-service assignments table created';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '✓ Service compatibility checking enabled';
  RAISE NOTICE '✓ Auto-assign function updated to consider service compatibility';
  RAISE NOTICE 'Rooms with no service assignments can handle any service (backward compatible)';
  RAISE NOTICE 'Assign services to rooms via the admin interface';
END $$;
