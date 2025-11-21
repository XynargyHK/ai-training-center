-- ============================================================================
-- ADD REAL STAFF TABLE (Beauticians, Doctors, Nurses)
-- Separate from AI Staff - these are actual human service providers
-- ============================================================================

CREATE TABLE IF NOT EXISTS real_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Staff Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  staff_type TEXT, -- 'beautician', 'doctor', 'nurse', 'massage_therapist', etc.

  -- Professional Details
  specialization TEXT[], -- ['facials', 'anti-aging', 'acne_treatment']
  certifications TEXT[],
  years_of_experience INT,
  bio TEXT,

  -- Display
  avatar_url TEXT,
  display_order INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  hire_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_real_staff_business_unit ON real_staff(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_real_staff_active ON real_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_real_staff_type ON real_staff(staff_type);

-- Enable RLS
ALTER TABLE real_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can do everything on real_staff" ON real_staff;
DROP POLICY IF EXISTS "Anon can read active real staff" ON real_staff;
DROP POLICY IF EXISTS "Authenticated can read real staff" ON real_staff;

-- Create RLS policies
CREATE POLICY "Service role can do everything on real_staff"
  ON real_staff FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read active real staff"
  ON real_staff FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Authenticated can read real staff"
  ON real_staff FOR SELECT TO authenticated USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_real_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_real_staff_timestamp ON real_staff;
CREATE TRIGGER update_real_staff_timestamp
  BEFORE UPDATE ON real_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_real_staff_updated_at();

-- Update appointment_staff_availability to reference real_staff instead of ai_staff
ALTER TABLE appointment_staff_availability
  DROP COLUMN IF EXISTS ai_staff_id,
  ADD COLUMN IF NOT EXISTS real_staff_id UUID REFERENCES real_staff(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS idx_staff_availability_staff;
CREATE INDEX IF NOT EXISTS idx_staff_availability_real_staff ON appointment_staff_availability(real_staff_id);

-- Update appointments to reference real_staff instead of ai_staff
ALTER TABLE appointments
  DROP COLUMN IF EXISTS ai_staff_id,
  ADD COLUMN IF NOT EXISTS real_staff_id UUID REFERENCES real_staff(id) ON DELETE SET NULL;

-- Update index
DROP INDEX IF EXISTS idx_appointments_staff;
CREATE INDEX IF NOT EXISTS idx_appointments_real_staff ON appointments(real_staff_id);

-- Update unique constraint
DROP INDEX IF EXISTS unique_staff_booking;
CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_booking
  ON appointments(real_staff_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Comments
COMMENT ON TABLE real_staff IS 'Real human staff (beauticians, doctors, nurses) who perform services - separate from AI chat assistants';
COMMENT ON COLUMN appointment_staff_availability.real_staff_id IS 'Links to actual human staff, not AI chat staff';
COMMENT ON COLUMN appointments.real_staff_id IS 'The real human staff member assigned to this appointment';
