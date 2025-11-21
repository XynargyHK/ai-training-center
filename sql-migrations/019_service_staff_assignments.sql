-- ============================================================================
-- SERVICE-STAFF ASSIGNMENTS TABLE
-- Many-to-many relationship between services and real staff
-- Allows one staff to be assigned to multiple services
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES appointment_services(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES real_staff(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT, -- Who assigned this (admin/manager email)
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique assignments
  UNIQUE(service_id, staff_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_staff_assignments_service
  ON service_staff_assignments(service_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_staff_assignments_staff
  ON service_staff_assignments(staff_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_staff_assignments_business_unit
  ON service_staff_assignments(business_unit_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE service_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to service_staff_assignments"
  ON service_staff_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access (for displaying assigned staff)
CREATE POLICY "Public can view active service staff assignments"
  ON service_staff_assignments
  FOR SELECT
  TO public
  USING (is_active = true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_service_staff_assignments_updated_at
  BEFORE UPDATE ON service_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Get staff assigned to a service
-- ============================================================================

CREATE OR REPLACE FUNCTION get_staff_for_service(p_service_id UUID)
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  staff_email TEXT,
  staff_type TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.name,
    rs.email,
    rs.staff_type,
    rs.avatar_url
  FROM real_staff rs
  INNER JOIN service_staff_assignments ssa
    ON rs.id = ssa.staff_id
  WHERE ssa.service_id = p_service_id
    AND ssa.is_active = true
    AND rs.is_active = true
  ORDER BY rs.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER FUNCTION: Get services assigned to a staff member
-- ============================================================================

CREATE OR REPLACE FUNCTION get_services_for_staff(p_staff_id UUID)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  description TEXT,
  duration_minutes INT,
  price DECIMAL(10,2),
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aps.id,
    aps.name,
    aps.description,
    aps.duration_minutes,
    aps.price,
    aps.currency
  FROM appointment_services aps
  INNER JOIN service_staff_assignments ssa
    ON aps.id = ssa.service_id
  WHERE ssa.staff_id = p_staff_id
    AND ssa.is_active = true
    AND aps.is_active = true
  ORDER BY aps.display_order, aps.name;
END;
$$ LANGUAGE plpgsql STABLE;
