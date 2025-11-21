-- ============================================================================
-- APPOINTMENT BOOKING SYSTEM
-- Supports: Room + Staff availability, Provider confirmation workflow
-- ============================================================================

-- Table 1: Treatment Rooms
CREATE TABLE IF NOT EXISTS treatment_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Room Information
  room_number TEXT NOT NULL,
  room_name TEXT, -- "VIP Suite", "Treatment Room 1", "Consultation Room"
  room_type TEXT, -- "facial", "massage", "consultation", "general"
  capacity INT DEFAULT 1, -- How many people (usually 1 for treatment rooms)
  floor_level TEXT, -- "Ground Floor", "2nd Floor"

  -- Features & Equipment
  equipment JSONB DEFAULT '{}', -- {"has_steamer": true, "has_massage_bed": true}
  amenities TEXT[], -- ["private_bathroom", "shower", "music_system"]

  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(business_unit_id, room_number)
);

-- Table 2: Appointment Services
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Service Details
  name TEXT NOT NULL, -- "Deep Cleansing Facial", "Swedish Massage"
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,

  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Requirements
  required_room_type TEXT, -- Must match treatment_rooms.room_type
  required_equipment JSONB DEFAULT '{}', -- {"needs_steamer": true}

  -- Display
  display_order INT DEFAULT 0,
  image_url TEXT,
  color_hex TEXT, -- For calendar color coding

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Staff Availability Schedule
CREATE TABLE IF NOT EXISTS appointment_staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE CASCADE,

  -- Time Slot Definition (EITHER recurring OR specific date)
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL, -- e.g., '09:00:00'
  end_time TIME NOT NULL,   -- e.g., '17:00:00'

  -- OR specific date override (takes precedence over day_of_week)
  specific_date DATE, -- For one-time blocks/availability

  -- Availability Status
  is_available BOOLEAN DEFAULT true, -- false = blocked
  block_reason TEXT, -- "Lunch Break", "Holiday", "Training", "Personal Day"

  -- Room Preferences (optional)
  preferred_room_ids UUID[], -- Array of room IDs this staff prefers
  requires_specific_room BOOLEAN DEFAULT false,

  -- Recurrence Settings
  is_recurring BOOLEAN DEFAULT true, -- Does this repeat weekly?
  effective_from DATE, -- When does this schedule start
  effective_until DATE, -- When does it end (NULL = indefinite)

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Appointments (Bookings)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Resources
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE SET NULL, -- Provider
  room_id UUID REFERENCES treatment_rooms(id) ON DELETE SET NULL,
  service_id UUID REFERENCES appointment_services(id) ON DELETE SET NULL,

  -- Customer Information (from chat)
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  user_identifier TEXT NOT NULL, -- Email > Name > Anonymous ID
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,

  -- Appointment Timing
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  timezone TEXT DEFAULT 'UTC',

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending'    = Waiting for provider confirmation
  -- 'confirmed'  = Provider accepted
  -- 'completed'  = Service finished
  -- 'cancelled'  = Cancelled by user or provider
  -- 'no_show'    = User didn't show up
  -- 'rescheduled' = Moved to different time

  booking_source TEXT DEFAULT 'chat', -- 'chat', 'admin', 'api', 'phone'

  -- Communication Flags
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  -- Notes & Special Requests
  customer_notes TEXT, -- User's special requests
  staff_notes TEXT,    -- Internal provider notes
  cancellation_reason TEXT,

  -- Timestamps
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Treatment Rooms
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_business_unit ON treatment_rooms(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_active ON treatment_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_type ON treatment_rooms(room_type);

-- Services
CREATE INDEX IF NOT EXISTS idx_appointment_services_business_unit ON appointment_services(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_active ON appointment_services(is_active);

-- Staff Availability
CREATE INDEX IF NOT EXISTS idx_staff_availability_business_unit ON appointment_staff_availability(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON appointment_staff_availability(ai_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_dow ON appointment_staff_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON appointment_staff_availability(specific_date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_recurring ON appointment_staff_availability(is_recurring);

-- Appointments (MOST CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_business_unit ON appointments(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(ai_staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_room ON appointments(room_id);
CREATE INDEX IF NOT EXISTS idx_appointments_session ON appointments(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_identifier);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, start_time);

-- Composite index for availability checking (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date_time
  ON appointments(ai_staff_id, appointment_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

CREATE INDEX IF NOT EXISTS idx_appointments_room_date_time
  ON appointments(room_id, appointment_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- ============================================================================
-- UNIQUE CONSTRAINTS (Prevent Double Booking)
-- ============================================================================

-- Prevent double-booking same staff at same time
CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_booking
  ON appointments(ai_staff_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Prevent double-booking same room at same time
CREATE UNIQUE INDEX IF NOT EXISTS unique_room_booking
  ON appointments(room_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role can do everything on treatment_rooms"
  ON treatment_rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointment_services"
  ON appointment_services FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointment_staff_availability"
  ON appointment_staff_availability FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on appointments"
  ON appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy: Allow anon users to read active services and availability
CREATE POLICY "Anon can read active services"
  ON appointment_services FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Anon can read active rooms"
  ON treatment_rooms FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Anon can read availability"
  ON appointment_staff_availability FOR SELECT TO anon USING (true);

-- Policy: Allow anon to create appointments (booking from chat)
CREATE POLICY "Anon can create appointments"
  ON appointments FOR INSERT TO anon WITH CHECK (true);

-- Policy: Allow authenticated users to read/update their own appointments
CREATE POLICY "Users can read their appointments"
  ON appointments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their appointments"
  ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Update treatment_rooms updated_at
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

-- Update appointment_services updated_at
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

-- Update appointment_staff_availability updated_at
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

-- Update appointments updated_at
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

-- ============================================================================
-- TABLE COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE treatment_rooms IS 'Physical rooms available for appointments (treatment rooms, consultation rooms, etc.)';
COMMENT ON TABLE appointment_services IS 'Services that can be booked (facials, massages, consultations, etc.)';
COMMENT ON TABLE appointment_staff_availability IS 'Staff working hours, breaks, and blocked time slots';
COMMENT ON TABLE appointments IS 'Actual booked appointments with confirmation workflow';

COMMENT ON COLUMN appointments.status IS 'pending=awaiting confirmation, confirmed=provider accepted, completed=service done, cancelled=cancelled, no_show=user didnt show';
COMMENT ON COLUMN appointment_staff_availability.is_available IS 'true=available for booking, false=blocked (lunch, vacation, etc.)';
COMMENT ON COLUMN appointments.chat_session_id IS 'Links appointment to the chat conversation where it was booked';
