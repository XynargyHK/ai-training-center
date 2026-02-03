-- ============================================================================
-- RLS POLICIES FOR APPOINTMENTS DASHBOARD
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to appointments" ON appointments;
DROP POLICY IF EXISTS "Allow read access to appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow read access to real_staff" ON real_staff;
DROP POLICY IF EXISTS "Allow read access to treatment_rooms" ON treatment_rooms;
DROP POLICY IF EXISTS "Allow read access to business_units" ON business_units;
DROP POLICY IF EXISTS "Allow read access to outlets" ON outlets;

-- Create policies to allow public read access
-- Note: In production, restrict these based on authentication

CREATE POLICY "Allow read access to appointments"
ON appointments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read access to appointment_services"
ON appointment_services
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read access to real_staff"
ON real_staff
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read access to treatment_rooms"
ON treatment_rooms
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read access to business_units"
ON business_units
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read access to outlets"
ON outlets
FOR SELECT
TO anon, authenticated
USING (true);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('appointments', 'appointment_services', 'real_staff', 'treatment_rooms', 'business_units', 'outlets')
ORDER BY tablename, policyname;
