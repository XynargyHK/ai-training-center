-- ============================================================================
-- SEED SAMPLE APPOINTMENT DATA
-- Run this AFTER COMBINED_APPOINTMENT_SETUP.sql
-- Replace 'YOUR_BUSINESS_UNIT_ID' with your actual business unit ID
-- ============================================================================

-- NOTE: Get your business_unit_id by running:
-- SELECT id, name FROM business_units LIMIT 5;

-- ============================================================================
-- 1. ENABLE APPOINTMENT FEATURES
-- ============================================================================

UPDATE business_unit_settings
SET
  enable_appointments = true,
  appointments_require_confirmation = true
WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';

-- ============================================================================
-- 2. CREATE TREATMENT ROOMS
-- ============================================================================

INSERT INTO treatment_rooms (business_unit_id, room_number, room_name, room_type, equipment, amenities, is_active)
VALUES
  ('YOUR_BUSINESS_UNIT_ID', 'R101', 'VIP Treatment Room', 'facial',
   '{"has_steamer": true, "has_massage_bed": true, "has_mirror": true}'::jsonb,
   ARRAY['private_bathroom', 'music_system', 'aromatherapy'],
   true),

  ('YOUR_BUSINESS_UNIT_ID', 'R102', 'Standard Treatment Room 1', 'facial',
   '{"has_steamer": true, "has_massage_bed": true}'::jsonb,
   ARRAY['music_system'],
   true),

  ('YOUR_BUSINESS_UNIT_ID', 'R103', 'Massage Room', 'massage',
   '{"has_massage_bed": true, "has_hot_stones": true}'::jsonb,
   ARRAY['private_bathroom', 'music_system', 'aromatherapy'],
   true),

  ('YOUR_BUSINESS_UNIT_ID', 'R104', 'Consultation Room', 'consultation',
   '{"has_computer": true, "has_camera": true}'::jsonb,
   ARRAY['comfortable_seating'],
   true)
ON CONFLICT (business_unit_id, room_number) DO NOTHING;

-- ============================================================================
-- 3. CREATE APPOINTMENT SERVICES
-- ============================================================================

INSERT INTO appointment_services (business_unit_id, name, description, duration_minutes, price, currency, required_room_type, display_order, color_hex, is_active)
VALUES
  ('YOUR_BUSINESS_UNIT_ID', 'Deep Cleansing Facial',
   'A thorough facial treatment that cleanses, exfoliates, and hydrates your skin',
   60, 120.00, 'USD', 'facial', 1, '#3B82F6', true),

  ('YOUR_BUSINESS_UNIT_ID', 'Anti-Aging Facial',
   'Advanced facial treatment targeting fine lines and wrinkles',
   90, 180.00, 'USD', 'facial', 2, '#8B5CF6', true),

  ('YOUR_BUSINESS_UNIT_ID', 'Relaxing Massage',
   'Full body massage for deep relaxation and stress relief',
   60, 100.00, 'USD', 'massage', 3, '#10B981', true),

  ('YOUR_BUSINESS_UNIT_ID', 'Skin Consultation',
   'Professional consultation to assess your skin and recommend treatments',
   30, 50.00, 'USD', 'consultation', 4, '#F59E0B', true);

-- ============================================================================
-- 4. CREATE STAFF AVAILABILITY
-- Replace 'YOUR_STAFF_ID_1', 'YOUR_STAFF_ID_2' with actual ai_staff IDs
-- Get staff IDs by running: SELECT id, name FROM ai_staff WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';
-- ============================================================================

-- Staff 1: Monday-Friday 9am-5pm
INSERT INTO appointment_staff_availability (business_unit_id, ai_staff_id, day_of_week, start_time, end_time, is_available, is_recurring)
VALUES
  -- Working hours
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 1, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 2, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 3, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 4, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 5, '09:00', '17:00', true, true),

  -- Lunch breaks
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 1, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 2, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 3, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 4, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_1', 5, '12:00', '13:00', false, true);

-- Staff 2: Monday-Friday 9am-5pm
INSERT INTO appointment_staff_availability (business_unit_id, ai_staff_id, day_of_week, start_time, end_time, is_available, is_recurring)
VALUES
  -- Working hours
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 1, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 2, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 3, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 4, '09:00', '17:00', true, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 5, '09:00', '17:00', true, true),

  -- Lunch breaks
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 1, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 2, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 3, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 4, '12:00', '13:00', false, true),
  ('YOUR_BUSINESS_UNIT_ID', 'YOUR_STAFF_ID_2', 5, '12:00', '13:00', false, true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify rooms were created
SELECT COUNT(*) as room_count FROM treatment_rooms WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';

-- Verify services were created
SELECT COUNT(*) as service_count FROM appointment_services WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';

-- Verify staff availability was created
SELECT COUNT(*) as availability_count FROM appointment_staff_availability WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';

-- Verify feature flags were enabled
SELECT enable_appointments, appointments_require_confirmation
FROM business_unit_settings
WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';
