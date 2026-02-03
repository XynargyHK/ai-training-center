-- ============================================================================
-- MIGRATION 024: Add RLS Policies for Appointments
-- Purpose: Allow browser clients to read appointments and related data
-- ============================================================================

-- Enable RLS on appointments table (if not already enabled)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all appointments (for staff dashboard)
-- In production, you'd want to restrict this based on user role/authentication
CREATE POLICY "Allow read access to appointments"
ON appointments
FOR SELECT
TO public
USING (true);

-- Enable RLS on related tables if not already enabled
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;

-- Allow reading appointment services
CREATE POLICY "Allow read access to appointment_services"
ON appointment_services
FOR SELECT
TO public
USING (true);

-- Allow reading staff
CREATE POLICY "Allow read access to real_staff"
ON real_staff
FOR SELECT
TO public
USING (true);

-- Allow reading treatment rooms
CREATE POLICY "Allow read access to treatment_rooms"
ON treatment_rooms
FOR SELECT
TO public
USING (true);

-- Enable RLS on business_units if not already enabled
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

-- Allow reading business units
CREATE POLICY "Allow read access to business_units"
ON business_units
FOR SELECT
TO public
USING (true);

-- Enable RLS on outlets if not already enabled
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Allow reading outlets
CREATE POLICY "Allow read access to outlets"
ON outlets
FOR SELECT
TO public
USING (true);

-- Note: For production, you should restrict these policies based on:
-- 1. User authentication (auth.uid())
-- 2. Staff role (only staff can see appointments)
-- 3. Business unit membership
--
-- Example production policy:
-- CREATE POLICY "Staff can read appointments in their business unit"
-- ON appointments
-- FOR SELECT
-- TO authenticated
-- USING (
--   business_unit_id IN (
--     SELECT business_unit_id FROM real_staff WHERE id = auth.uid()
--   )
-- );
