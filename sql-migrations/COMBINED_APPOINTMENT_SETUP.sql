-- ============================================================================
-- COMBINED APPOINTMENT SYSTEM SETUP
-- Run this entire file in Supabase SQL Editor to set up the appointment system
-- ============================================================================

-- PART 1: CREATE TABLES
-- ============================================================================

-- Table 1: Treatment Rooms
CREATE TABLE IF NOT EXISTS treatment_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  room_number TEXT NOT NULL,
  room_name TEXT,
  room_type TEXT,
  capacity INT DEFAULT 1,
  floor_level TEXT,

  equipment JSONB DEFAULT '{}',
  amenities TEXT[],

  is_active BOOLEAN DEFAULT true,
  maintenance_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_unit_id, room_number)
);

-- Table 2: Appointment Services
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,

  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  required_room_type TEXT,
  required_equipment JSONB DEFAULT '{}',

  display_order INT DEFAULT 0,
  image_url TEXT,
  color_hex TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Staff Availability Schedule
CREATE TABLE IF NOT EXISTS appointment_staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE CASCADE,

  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  specific_date DATE,

  is_available BOOLEAN DEFAULT true,
  block_reason TEXT,

  preferred_room_ids UUID[],
  requires_specific_room BOOLEAN DEFAULT false,

  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Appointments (Bookings)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE SET NULL,
  room_id UUID REFERENCES treatment_rooms(id) ON DELETE SET NULL,
  service_id UUID REFERENCES appointment_services(id) ON DELETE SET NULL,

  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  user_identifier TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,

  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  timezone TEXT DEFAULT 'UTC',

  status TEXT NOT NULL DEFAULT 'pending',
  booking_source TEXT DEFAULT 'chat',

  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  customer_notes TEXT,
  staff_notes TEXT,
  cancellation_reason TEXT,

  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PART 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_treatment_rooms_business_unit ON treatment_rooms(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_active ON treatment_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_type ON treatment_rooms(room_type);

CREATE INDEX IF NOT EXISTS idx_appointment_services_business_unit ON appointment_services(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_active ON appointment_services(is_active);

CREATE INDEX IF NOT EXISTS idx_staff_availability_business_unit ON appointment_staff_availability(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON appointment_staff_availability(ai_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_dow ON appointment_staff_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON appointment_staff_availability(specific_date);

CREATE INDEX IF NOT EXISTS idx_appointments_business_unit ON appointments(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(ai_staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_room ON appointments(room_id);
CREATE INDEX IF NOT EXISTS idx_appointments_session ON appointments(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_identifier);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_staff_date_time
  ON appointments(ai_staff_id, appointment_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

CREATE INDEX IF NOT EXISTS idx_appointments_room_date_time
  ON appointments(room_id, appointment_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- PART 3: CREATE UNIQUE CONSTRAINTS
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_booking
  ON appointments(ai_staff_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

CREATE UNIQUE INDEX IF NOT EXISTS unique_room_booking
  ON appointments(room_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- PART 4: ENABLE RLS
-- ============================================================================

ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- PART 5: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Service role can do everything on treatment_rooms" ON treatment_rooms;
DROP POLICY IF EXISTS "Service role can do everything on appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Service role can do everything on appointment_staff_availability" ON appointment_staff_availability;
DROP POLICY IF EXISTS "Service role can do everything on appointments" ON appointments;
DROP POLICY IF EXISTS "Anon can read active services" ON appointment_services;
DROP POLICY IF EXISTS "Anon can read active rooms" ON treatment_rooms;
DROP POLICY IF EXISTS "Anon can read availability" ON appointment_staff_availability;
DROP POLICY IF EXISTS "Anon can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can read their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their appointments" ON appointments;

-- Create policies
CREATE POLICY "Service role can do everything on treatment_rooms"
  ON treatment_rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointment_services"
  ON appointment_services FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointment_staff_availability"
  ON appointment_staff_availability FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointments"
  ON appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read active services"
  ON appointment_services FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Anon can read active rooms"
  ON treatment_rooms FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Anon can read availability"
  ON appointment_staff_availability FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can create appointments"
  ON appointments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Users can read their appointments"
  ON appointments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their appointments"
  ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- PART 6: CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_treatment_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_treatment_rooms_timestamp ON treatment_rooms;
CREATE TRIGGER update_treatment_rooms_timestamp
  BEFORE UPDATE ON treatment_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_rooms_updated_at();

CREATE OR REPLACE FUNCTION update_appointment_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_appointment_services_timestamp ON appointment_services;
CREATE TRIGGER update_appointment_services_timestamp
  BEFORE UPDATE ON appointment_services
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_services_updated_at();

CREATE OR REPLACE FUNCTION update_staff_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_staff_availability_timestamp ON appointment_staff_availability;
CREATE TRIGGER update_staff_availability_timestamp
  BEFORE UPDATE ON appointment_staff_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_availability_updated_at();

CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_appointments_timestamp ON appointments;
CREATE TRIGGER update_appointments_timestamp
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- PART 7: ADD FEATURE FLAGS TO BUSINESS_UNIT_SETTINGS
-- ============================================================================

ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS enable_appointments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointments_require_confirmation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS appointments_allow_room_selection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointments_send_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS appointments_booking_window_days INT DEFAULT 30;

ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS appointments_business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "18:00", "enabled": true},
  "friday": {"open": "09:00", "close": "18:00", "enabled": true},
  "saturday": {"open": "10:00", "close": "16:00", "enabled": true},
  "sunday": {"open": "10:00", "close": "16:00", "enabled": false}
}';

ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS appointments_ui_config JSONB DEFAULT '{
  "calendar_view": "week",
  "slot_duration_minutes": 60,
  "show_provider_photos": true,
  "show_prices": true,
  "require_phone": false,
  "require_email": true,
  "allow_cancellation_hours_before": 24
}';

-- ============================================================================
-- SETUP COMPLETE!
-- Next: Run the seed data script or manually insert sample data
-- ============================================================================
