-- ============================================
-- OUTLETS/LOCATIONS AND ROOM RESTRUCTURE
-- ============================================
-- Creates outlets table for multiple physical locations
-- Restructures rooms to belong to outlets
-- Adds auto-assignment logic for rooms

-- Step 1: Create outlets/locations table
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'USA',
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_unit_id, name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_outlets_business_unit ON outlets(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_outlets_active ON outlets(is_active);

-- Step 2: Add outlet_id to treatment_rooms
-- First, check if column exists and add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treatment_rooms' AND column_name = 'outlet_id'
  ) THEN
    ALTER TABLE treatment_rooms ADD COLUMN outlet_id UUID;
  END IF;
END $$;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'treatment_rooms_outlet_id_fkey'
  ) THEN
    ALTER TABLE treatment_rooms
    ADD CONSTRAINT treatment_rooms_outlet_id_fkey
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_outlet ON treatment_rooms(outlet_id);

-- Step 3: Add outlet_id to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_appointments_outlet ON appointments(outlet_id);

-- Step 4: RLS Policies for outlets
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access to outlets" ON outlets;
CREATE POLICY "Service role has full access to outlets"
  ON outlets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view active outlets" ON outlets;
CREATE POLICY "Users can view active outlets"
  ON outlets FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Step 5: Function to auto-assign available room at outlet
CREATE OR REPLACE FUNCTION auto_assign_room(
  p_outlet_id UUID,
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
  -- 3. Not booked during the requested time slot
  SELECT tr.id INTO v_room_id
  FROM treatment_rooms tr
  WHERE tr.outlet_id = p_outlet_id
    AND tr.is_active = true
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

-- Step 6: Function to get outlet address display
CREATE OR REPLACE FUNCTION get_outlet_address(p_outlet_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_address TEXT;
BEGIN
  SELECT
    CONCAT_WS(', ',
      address_line1,
      NULLIF(address_line2, ''),
      city,
      NULLIF(state_province, ''),
      NULLIF(postal_code, '')
    )
  INTO v_address
  FROM outlets
  WHERE id = p_outlet_id;

  RETURN v_address;
END;
$$;

-- Step 7: Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_outlets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_outlets_updated_at ON outlets;
CREATE TRIGGER trigger_update_outlets_updated_at
  BEFORE UPDATE ON outlets
  FOR EACH ROW
  EXECUTE FUNCTION update_outlets_updated_at();

-- Step 8: Migrate existing data
-- Create a default outlet for existing business units
DO $$
DECLARE
  v_bu_record RECORD;
  v_outlet_id UUID;
BEGIN
  FOR v_bu_record IN SELECT id, name FROM business_units
  LOOP
    -- Create default outlet for this business unit
    INSERT INTO outlets (business_unit_id, name, address_line1, city, country, is_active)
    VALUES (
      v_bu_record.id,
      v_bu_record.name || ' - Main Location',
      'Main Office', -- Default address, should be updated
      'City', -- Default city, should be updated
      'USA',
      true
    )
    ON CONFLICT (business_unit_id, name) DO NOTHING
    RETURNING id INTO v_outlet_id;

    -- Update existing rooms to belong to this outlet
    IF v_outlet_id IS NOT NULL THEN
      UPDATE treatment_rooms
      SET outlet_id = v_outlet_id
      WHERE business_unit_id = v_bu_record.id
        AND outlet_id IS NULL;
    END IF;
  END LOOP;

  RAISE NOTICE 'Default outlets created and rooms migrated';
END $$;

-- Step 9: Comments for documentation
COMMENT ON TABLE outlets IS 'Physical locations/outlets for each business unit';
COMMENT ON COLUMN outlets.display_order IS 'Order for displaying outlets to customers';
COMMENT ON FUNCTION auto_assign_room IS 'Automatically assigns an available room at the specified outlet for the given time slot';
COMMENT ON FUNCTION get_outlet_address IS 'Returns formatted address string for an outlet';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Outlets table created';
  RAISE NOTICE '✓ Treatment rooms linked to outlets';
  RAISE NOTICE '✓ Appointments linked to outlets';
  RAISE NOTICE '✓ Auto-assign room function created';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '✓ Existing data migrated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update outlet addresses via admin interface';
  RAISE NOTICE '2. Add more outlets if needed';
  RAISE NOTICE '3. Assign rooms to specific outlets';
END $$;
