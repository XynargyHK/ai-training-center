-- ============================================================================
-- SEED APPOINTMENT SYSTEM WITH DUMMY REAL STAFF AND ROOMS
-- Run this after COMBINED_APPOINTMENT_SETUP.sql and 018_add_real_staff_table.sql
-- ============================================================================

DO $$
DECLARE
  v_business_unit_id UUID;
  v_beautician_1_id UUID;
  v_beautician_2_id UUID;
  v_doctor_id UUID;
  v_room_1_id UUID;
  v_room_2_id UUID;
  v_room_3_id UUID;
  v_room_4_id UUID;
BEGIN
  -- Get first business unit
  SELECT id INTO v_business_unit_id FROM business_units LIMIT 1;

  IF v_business_unit_id IS NULL THEN
    RAISE EXCEPTION 'No business units found. Please create a business unit first.';
  END IF;

  RAISE NOTICE 'Using business unit ID: %', v_business_unit_id;

  -- ============================================================================
  -- 1. ENABLE APPOINTMENT FEATURES
  -- ============================================================================

  UPDATE business_unit_settings
  SET
    enable_appointments = true,
    appointments_require_confirmation = true
  WHERE business_unit_id = v_business_unit_id;

  RAISE NOTICE '✓ Enabled appointment features';

  -- ============================================================================
  -- 2. CREATE DUMMY REAL STAFF (Beauticians, Doctors)
  -- ============================================================================

  -- Beautician 1: Sarah
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Sarah Chen',
    'sarah.chen@clinic.com',
    '+1-555-0101',
    'beautician',
    ARRAY['facials', 'anti-aging', 'skin_treatments'],
    8,
    'Senior beautician specializing in advanced facial treatments and anti-aging procedures',
    true
  ) RETURNING id INTO v_beautician_1_id;

  RAISE NOTICE '✓ Created beautician: Sarah Chen (ID: %)', v_beautician_1_id;

  -- Beautician 2: Emily
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Emily Rodriguez',
    'emily.rodriguez@clinic.com',
    '+1-555-0102',
    'beautician',
    ARRAY['facials', 'acne_treatment', 'chemical_peels'],
    5,
    'Experienced beautician focused on acne treatments and skin rejuvenation',
    true
  ) RETURNING id INTO v_beautician_2_id;

  RAISE NOTICE '✓ Created beautician: Emily Rodriguez (ID: %)', v_beautician_2_id;

  -- Doctor: Dr. Kim
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Dr. Jennifer Kim',
    'dr.kim@clinic.com',
    '+1-555-0103',
    'doctor',
    ARRAY['dermatology', 'cosmetic_procedures', 'laser_treatments'],
    12,
    'Board-certified dermatologist specializing in cosmetic dermatology',
    true
  ) RETURNING id INTO v_doctor_id;

  RAISE NOTICE '✓ Created doctor: Dr. Jennifer Kim (ID: %)', v_doctor_id;

  -- ============================================================================
  -- 3. CREATE TREATMENT ROOMS
  -- ============================================================================

  INSERT INTO treatment_rooms (
    business_unit_id, room_number, room_name, room_type,
    equipment, amenities, is_active
  ) VALUES (
    v_business_unit_id, 'R101', 'VIP Treatment Room', 'facial',
    '{"has_steamer": true, "has_massage_bed": true, "has_mirror": true, "has_equipment_cart": true}'::jsonb,
    ARRAY['private_bathroom', 'music_system', 'aromatherapy', 'adjustable_lighting'],
    true
  ) RETURNING id INTO v_room_1_id;

  INSERT INTO treatment_rooms (
    business_unit_id, room_number, room_name, room_type,
    equipment, amenities, is_active
  ) VALUES (
    v_business_unit_id, 'R102', 'Standard Treatment Room 1', 'facial',
    '{"has_steamer": true, "has_massage_bed": true}'::jsonb,
    ARRAY['music_system'],
    true
  ) RETURNING id INTO v_room_2_id;

  INSERT INTO treatment_rooms (
    business_unit_id, room_number, room_name, room_type,
    equipment, amenities, is_active
  ) VALUES (
    v_business_unit_id, 'R103', 'Massage & Treatment Room', 'massage',
    '{"has_massage_bed": true, "has_hot_stones": true, "has_aromatherapy_diffuser": true}'::jsonb,
    ARRAY['private_bathroom', 'music_system', 'aromatherapy'],
    true
  ) RETURNING id INTO v_room_3_id;

  INSERT INTO treatment_rooms (
    business_unit_id, room_number, room_name, room_type,
    equipment, amenities, is_active
  ) VALUES (
    v_business_unit_id, 'R104', 'Consultation Room', 'consultation',
    '{"has_computer": true, "has_camera": true, "has_examination_light": true}'::jsonb,
    ARRAY['comfortable_seating', 'consultation_desk'],
    true
  ) RETURNING id INTO v_room_4_id;

  RAISE NOTICE '✓ Created 4 treatment rooms';

  -- ============================================================================
  -- 4. CREATE APPOINTMENT SERVICES
  -- ============================================================================

  INSERT INTO appointment_services (
    business_unit_id, name, description, duration_minutes,
    price, currency, required_room_type, display_order, color_hex, is_active
  ) VALUES
    (v_business_unit_id, 'Deep Cleansing Facial',
     'A thorough facial treatment that cleanses, exfoliates, and hydrates your skin. Perfect for all skin types.',
     60, 120.00, 'USD', 'facial', 1, '#3B82F6', true),

    (v_business_unit_id, 'Anti-Aging Facial',
     'Advanced facial treatment targeting fine lines and wrinkles with specialized serums and massage techniques.',
     90, 180.00, 'USD', 'facial', 2, '#8B5CF6', true),

    (v_business_unit_id, 'Acne Treatment Session',
     'Specialized treatment for acne-prone skin including extraction, treatment, and preventive care.',
     75, 150.00, 'USD', 'facial', 3, '#EF4444', true),

    (v_business_unit_id, 'Relaxing Massage',
     'Full body massage for deep relaxation and stress relief using aromatherapy oils.',
     60, 100.00, 'USD', 'massage', 4, '#10B981', true),

    (v_business_unit_id, 'Skin Consultation',
     'Professional consultation to assess your skin condition and recommend personalized treatments.',
     30, 50.00, 'USD', 'consultation', 5, '#F59E0B', true);

  RAISE NOTICE '✓ Created 5 appointment services';

  -- ============================================================================
  -- 5. CREATE STAFF AVAILABILITY SCHEDULES
  -- ============================================================================

  -- Sarah: Monday-Friday 9am-5pm (with lunch break)
  INSERT INTO appointment_staff_availability (
    business_unit_id, real_staff_id, day_of_week, start_time, end_time, is_available, is_recurring
  ) VALUES
    -- Working hours
    (v_business_unit_id, v_beautician_1_id, 1, '09:00', '17:00', true, true),
    (v_business_unit_id, v_beautician_1_id, 2, '09:00', '17:00', true, true),
    (v_business_unit_id, v_beautician_1_id, 3, '09:00', '17:00', true, true),
    (v_business_unit_id, v_beautician_1_id, 4, '09:00', '17:00', true, true),
    (v_business_unit_id, v_beautician_1_id, 5, '09:00', '17:00', true, true),
    -- Lunch breaks
    (v_business_unit_id, v_beautician_1_id, 1, '12:00', '13:00', false, true),
    (v_business_unit_id, v_beautician_1_id, 2, '12:00', '13:00', false, true),
    (v_business_unit_id, v_beautician_1_id, 3, '12:00', '13:00', false, true),
    (v_business_unit_id, v_beautician_1_id, 4, '12:00', '13:00', false, true),
    (v_business_unit_id, v_beautician_1_id, 5, '12:00', '13:00', false, true);

  RAISE NOTICE '✓ Created availability for Sarah Chen';

  -- Emily: Tuesday-Saturday 10am-6pm (with lunch break)
  INSERT INTO appointment_staff_availability (
    business_unit_id, real_staff_id, day_of_week, start_time, end_time, is_available, is_recurring
  ) VALUES
    -- Working hours
    (v_business_unit_id, v_beautician_2_id, 2, '10:00', '18:00', true, true),
    (v_business_unit_id, v_beautician_2_id, 3, '10:00', '18:00', true, true),
    (v_business_unit_id, v_beautician_2_id, 4, '10:00', '18:00', true, true),
    (v_business_unit_id, v_beautician_2_id, 5, '10:00', '18:00', true, true),
    (v_business_unit_id, v_beautician_2_id, 6, '10:00', '18:00', true, true),
    -- Lunch breaks
    (v_business_unit_id, v_beautician_2_id, 2, '13:00', '14:00', false, true),
    (v_business_unit_id, v_beautician_2_id, 3, '13:00', '14:00', false, true),
    (v_business_unit_id, v_beautician_2_id, 4, '13:00', '14:00', false, true),
    (v_business_unit_id, v_beautician_2_id, 5, '13:00', '14:00', false, true),
    (v_business_unit_id, v_beautician_2_id, 6, '13:00', '14:00', false, true);

  RAISE NOTICE '✓ Created availability for Emily Rodriguez';

  -- Dr. Kim: Monday, Wednesday, Friday 9am-3pm (no lunch break - shorter days)
  INSERT INTO appointment_staff_availability (
    business_unit_id, real_staff_id, day_of_week, start_time, end_time, is_available, is_recurring
  ) VALUES
    (v_business_unit_id, v_doctor_id, 1, '09:00', '15:00', true, true),
    (v_business_unit_id, v_doctor_id, 3, '09:00', '15:00', true, true),
    (v_business_unit_id, v_doctor_id, 5, '09:00', '15:00', true, true);

  RAISE NOTICE '✓ Created availability for Dr. Jennifer Kim';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'APPOINTMENT SYSTEM FULLY SEEDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Business Unit: %', v_business_unit_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Real Staff Created:';
  RAISE NOTICE '  • Sarah Chen (Beautician) - Mon-Fri 9am-5pm';
  RAISE NOTICE '  • Emily Rodriguez (Beautician) - Tue-Sat 10am-6pm';
  RAISE NOTICE '  • Dr. Jennifer Kim (Doctor) - Mon/Wed/Fri 9am-3pm';
  RAISE NOTICE '';
  RAISE NOTICE 'Treatment Rooms:';
  RAISE NOTICE '  • R101 - VIP Treatment Room';
  RAISE NOTICE '  • R102 - Standard Treatment Room 1';
  RAISE NOTICE '  • R103 - Massage & Treatment Room';
  RAISE NOTICE '  • R104 - Consultation Room';
  RAISE NOTICE '';
  RAISE NOTICE 'Services: 5 (Facials, Massage, Consultation)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Start dev server: npm run dev';
  RAISE NOTICE '2. Chat with AI staff (Emma, etc.)';
  RAISE NOTICE '3. Click calendar button in chat';
  RAISE NOTICE '4. Book appointment with real staff (Sarah/Emily/Dr.Kim)';
  RAISE NOTICE '5. Visit /provider to see pending appointments';
  RAISE NOTICE '========================================';

END $$;
