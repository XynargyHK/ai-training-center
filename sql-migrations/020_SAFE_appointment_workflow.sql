-- ============================================================================
-- APPOINTMENT EDIT/CANCEL WORKFLOW - SAFE VERSION
-- This version drops existing policies before creating them
-- ============================================================================

-- ============================================================================
-- 1. UPDATE APPOINTMENT STATUSES
-- ============================================================================

-- Drop existing constraint if it exists
DO $$ BEGIN
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new statuses: pending_edit, pending_cancellation
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
    'rescheduled',
    'pending_edit',
    'pending_cancellation'
  ));

-- ============================================================================
-- 2. APPOINTMENT CHANGE REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('edit', 'cancel')),
  requested_by_staff_id UUID NOT NULL REFERENCES real_staff(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),

  -- For edit requests - proposed changes
  proposed_date DATE,
  proposed_start_time TIME,
  proposed_end_time TIME,
  proposed_staff_id UUID REFERENCES real_staff(id),
  proposed_room_id UUID REFERENCES treatment_rooms(id),

  -- Request reason
  reason TEXT NOT NULL,
  staff_notes TEXT,

  -- Approval status
  status TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (status IN (
    'pending_manager_approval',
    'manager_approved',
    'manager_rejected',
    'pending_client_confirmation',
    'client_confirmed',
    'client_rejected',
    'completed',
    'cancelled'
  )),

  -- Manager approval
  manager_approved_at TIMESTAMPTZ,
  manager_approved_by TEXT,
  manager_notes TEXT,

  -- Client confirmation
  client_confirmed_at TIMESTAMPTZ,
  client_response TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. APPOINTMENT CHANGE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  change_request_id UUID REFERENCES appointment_change_requests(id) ON DELETE SET NULL,

  -- What changed
  change_type TEXT NOT NULL CHECK (change_type IN (
    'created',
    'confirmed',
    'rescheduled',
    'cancelled',
    'completed',
    'no_show',
    'status_changed',
    'details_updated'
  )),

  -- Who made the change
  changed_by_type TEXT CHECK (changed_by_type IN ('staff', 'manager', 'client', 'system')),
  changed_by_identifier TEXT,

  -- Old and new values (JSON)
  old_values JSONB,
  new_values JSONB,

  -- Change reason
  reason TEXT,
  notes TEXT,

  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Change requests indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_appointment
  ON appointment_change_requests(appointment_id);

CREATE INDEX IF NOT EXISTS idx_change_requests_staff
  ON appointment_change_requests(requested_by_staff_id);

CREATE INDEX IF NOT EXISTS idx_change_requests_status
  ON appointment_change_requests(status) WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_change_requests_business_unit
  ON appointment_change_requests(business_unit_id);

-- Change history indexes
CREATE INDEX IF NOT EXISTS idx_change_history_appointment
  ON appointment_change_history(appointment_id);

CREATE INDEX IF NOT EXISTS idx_change_history_request
  ON appointment_change_history(change_request_id);

CREATE INDEX IF NOT EXISTS idx_change_history_changed_at
  ON appointment_change_history(changed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE appointment_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_change_history ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES FIRST (to avoid "already exists" errors)
DROP POLICY IF EXISTS "Service role has full access to change_requests" ON appointment_change_requests;
DROP POLICY IF EXISTS "Service role has full access to change_history" ON appointment_change_history;
DROP POLICY IF EXISTS "Public can view change requests" ON appointment_change_requests;
DROP POLICY IF EXISTS "Public can view change history" ON appointment_change_history;

-- Service role full access
CREATE POLICY "Service role has full access to change_requests"
  ON appointment_change_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to change_history"
  ON appointment_change_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read access
CREATE POLICY "Public can view change requests"
  ON appointment_change_requests
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view change history"
  ON appointment_change_history
  FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_change_requests_updated_at ON appointment_change_requests;

-- Create trigger
CREATE TRIGGER update_change_requests_updated_at
  BEFORE UPDATE ON appointment_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create appointment change request
CREATE OR REPLACE FUNCTION create_appointment_change_request(
  p_appointment_id UUID,
  p_request_type TEXT,
  p_staff_id UUID,
  p_reason TEXT,
  p_proposed_date DATE DEFAULT NULL,
  p_proposed_start_time TIME DEFAULT NULL,
  p_proposed_end_time TIME DEFAULT NULL,
  p_proposed_staff_id UUID DEFAULT NULL,
  p_proposed_room_id UUID DEFAULT NULL,
  p_staff_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_business_unit_id UUID;
  v_current_status TEXT;
BEGIN
  -- Get appointment details
  SELECT business_unit_id, status INTO v_business_unit_id, v_current_status
  FROM appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found: %', p_appointment_id;
  END IF;

  -- Only allow requests for confirmed appointments
  IF v_current_status NOT IN ('confirmed', 'pending') THEN
    RAISE EXCEPTION 'Can only request changes for confirmed or pending appointments';
  END IF;

  -- Create the change request
  INSERT INTO appointment_change_requests (
    appointment_id,
    business_unit_id,
    request_type,
    requested_by_staff_id,
    reason,
    proposed_date,
    proposed_start_time,
    proposed_end_time,
    proposed_staff_id,
    proposed_room_id,
    staff_notes
  ) VALUES (
    p_appointment_id,
    v_business_unit_id,
    p_request_type,
    p_staff_id,
    p_reason,
    p_proposed_date,
    p_proposed_start_time,
    p_proposed_end_time,
    p_proposed_staff_id,
    p_proposed_room_id,
    p_staff_notes
  )
  RETURNING id INTO v_request_id;

  -- Update appointment status
  UPDATE appointments
  SET status = CASE
    WHEN p_request_type = 'edit' THEN 'pending_edit'
    WHEN p_request_type = 'cancel' THEN 'pending_cancellation'
  END
  WHERE id = p_appointment_id;

  -- Log the change
  INSERT INTO appointment_change_history (
    appointment_id,
    change_request_id,
    change_type,
    changed_by_type,
    changed_by_identifier,
    reason,
    notes
  ) VALUES (
    p_appointment_id,
    v_request_id,
    'status_changed',
    'staff',
    p_staff_id::TEXT,
    p_reason,
    p_staff_notes
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve/reject change request (manager)
CREATE OR REPLACE FUNCTION manager_review_change_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_manager_identifier TEXT,
  p_manager_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_appointment_id UUID;
  v_request_type TEXT;
  v_current_status TEXT;
BEGIN
  -- Get request details
  SELECT appointment_id, request_type, status
  INTO v_appointment_id, v_request_type, v_current_status
  FROM appointment_change_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found: %', p_request_id;
  END IF;

  IF v_current_status != 'pending_manager_approval' THEN
    RAISE EXCEPTION 'Request is not pending manager approval';
  END IF;

  -- Update request status
  UPDATE appointment_change_requests
  SET
    status = CASE WHEN p_approved THEN 'pending_client_confirmation' ELSE 'manager_rejected' END,
    manager_approved_at = NOW(),
    manager_approved_by = p_manager_identifier,
    manager_notes = p_manager_notes
  WHERE id = p_request_id;

  -- If rejected, revert appointment status
  IF NOT p_approved THEN
    UPDATE appointments
    SET status = 'confirmed'
    WHERE id = v_appointment_id;
  END IF;

  -- Log the change
  INSERT INTO appointment_change_history (
    appointment_id,
    change_request_id,
    change_type,
    changed_by_type,
    changed_by_identifier,
    reason,
    notes
  ) VALUES (
    v_appointment_id,
    p_request_id,
    'status_changed',
    'manager',
    p_manager_identifier,
    CASE WHEN p_approved THEN 'Manager approved change request' ELSE 'Manager rejected change request' END,
    p_manager_notes
  );

  RETURN p_approved;
END;
$$ LANGUAGE plpgsql;

-- Function to handle client confirmation
CREATE OR REPLACE FUNCTION client_confirm_change_request(
  p_request_id UUID,
  p_confirmed BOOLEAN,
  p_client_response TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_appointment_id UUID;
  v_request_type TEXT;
  v_proposed_date DATE;
  v_proposed_start_time TIME;
  v_proposed_end_time TIME;
  v_proposed_staff_id UUID;
  v_proposed_room_id UUID;
BEGIN
  -- Get request details
  SELECT
    appointment_id, request_type,
    proposed_date, proposed_start_time, proposed_end_time,
    proposed_staff_id, proposed_room_id
  INTO
    v_appointment_id, v_request_type,
    v_proposed_date, v_proposed_start_time, v_proposed_end_time,
    v_proposed_staff_id, v_proposed_room_id
  FROM appointment_change_requests
  WHERE id = p_request_id AND status = 'pending_client_confirmation';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found or not pending client confirmation';
  END IF;

  -- Update request status
  UPDATE appointment_change_requests
  SET
    status = CASE WHEN p_confirmed THEN 'completed' ELSE 'client_rejected' END,
    client_confirmed_at = NOW(),
    client_response = p_client_response
  WHERE id = p_request_id;

  IF p_confirmed THEN
    -- Apply the changes
    IF v_request_type = 'cancel' THEN
      UPDATE appointments
      SET
        status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_client_response
      WHERE id = v_appointment_id;

    ELSIF v_request_type = 'edit' THEN
      UPDATE appointments
      SET
        appointment_date = COALESCE(v_proposed_date, appointment_date),
        start_time = COALESCE(v_proposed_start_time, start_time),
        end_time = COALESCE(v_proposed_end_time, end_time),
        real_staff_id = COALESCE(v_proposed_staff_id, real_staff_id),
        room_id = COALESCE(v_proposed_room_id, room_id),
        status = 'confirmed'
      WHERE id = v_appointment_id;
    END IF;

  ELSE
    -- Client rejected - revert to confirmed
    UPDATE appointments
    SET status = 'confirmed'
    WHERE id = v_appointment_id;
  END IF;

  -- Log the change
  INSERT INTO appointment_change_history (
    appointment_id,
    change_request_id,
    change_type,
    changed_by_type,
    changed_by_identifier,
    reason,
    notes
  ) VALUES (
    v_appointment_id,
    p_request_id,
    CASE
      WHEN v_request_type = 'cancel' AND p_confirmed THEN 'cancelled'
      WHEN v_request_type = 'edit' AND p_confirmed THEN 'rescheduled'
      ELSE 'status_changed'
    END,
    'client',
    'client-user',
    CASE WHEN p_confirmed THEN 'Client confirmed change' ELSE 'Client rejected change' END,
    p_client_response
  );

  RETURN p_confirmed;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE appointment_change_requests IS 'Tracks staff requests to edit or cancel appointments with approval workflow';
COMMENT ON TABLE appointment_change_history IS 'Complete audit log of all appointment changes';
COMMENT ON FUNCTION create_appointment_change_request IS 'Staff creates a change request for edit/cancel';
COMMENT ON FUNCTION manager_review_change_request IS 'Manager approves or rejects a change request';
COMMENT ON FUNCTION client_confirm_change_request IS 'Client confirms or rejects the proposed change';
