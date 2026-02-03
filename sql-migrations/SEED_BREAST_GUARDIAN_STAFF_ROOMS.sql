-- ============================================================================
-- SEED BREAST GUARDIAN WITH STAFF, OUTLETS AND ROOMS
-- ============================================================================

DO $$
DECLARE
  v_business_unit_id UUID;
  v_outlet_main_id UUID;
  v_staff_1_id UUID;
  v_staff_2_id UUID;
  v_staff_3_id UUID;
  v_service_1_id UUID;
  v_service_2_id UUID;
  v_service_3_id UUID;
BEGIN
  -- Get Breast Guardian business unit
  SELECT id INTO v_business_unit_id FROM business_units WHERE slug = 'breast-guardian';

  IF v_business_unit_id IS NULL THEN
    RAISE EXCEPTION 'Breast Guardian business unit not found';
  END IF;

  RAISE NOTICE 'Using business unit: Breast Guardian (ID: %)', v_business_unit_id;

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
  -- 2. CREATE OUTLET
  -- ============================================================================

  INSERT INTO outlets (
    business_unit_id, name, address_line1, city, country, is_active
  ) VALUES (
    v_business_unit_id,
    'Breast Guardian - Main Clinic',
    '123 Medical Plaza',
    'Hong Kong',
    'Hong Kong',
    true
  ) RETURNING id INTO v_outlet_main_id;

  RAISE NOTICE '✓ Created outlet: Breast Guardian - Main Clinic (ID: %)', v_outlet_main_id;

  -- ============================================================================
  -- 3. CREATE REAL STAFF
  -- ============================================================================

  -- Doctor 1
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Dr. Sarah Wong',
    'dr.wong@breastguardian.com',
    '+852-6123-4567',
    'doctor',
    ARRAY['breast_health', 'mammography', 'ultrasound'],
    15,
    'Senior breast health specialist with extensive experience in early detection',
    true
  ) RETURNING id INTO v_staff_1_id;

  RAISE NOTICE '✓ Created doctor: Dr. Sarah Wong (ID: %)', v_staff_1_id;

  -- Doctor 2
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Dr. Emily Chen',
    'dr.chen@breastguardian.com',
    '+852-6123-4568',
    'doctor',
    ARRAY['breast_health', 'diagnostics', 'consultation'],
    10,
    'Breast health consultant specializing in preventive care',
    true
  ) RETURNING id INTO v_staff_2_id;

  RAISE NOTICE '✓ Created doctor: Dr. Emily Chen (ID: %)', v_staff_2_id;

  -- Nurse Practitioner
  INSERT INTO real_staff (
    business_unit_id, name, email, phone, staff_type,
    specialization, years_of_experience, bio, is_active
  ) VALUES (
    v_business_unit_id,
    'Nurse Lisa Tam',
    'nurse.tam@breastguardian.com',
    '+852-6123-4569',
    'nurse',
    ARRAY['breast_health', 'patient_care', 'screening'],
    8,
    'Experienced nurse practitioner specializing in breast health screening',
    true
  ) RETURNING id INTO v_staff_3_id;

  RAISE NOTICE '✓ Created nurse: Nurse Lisa Tam (ID: %)', v_staff_3_id;

  -- ============================================================================
  -- 4. CREATE TREATMENT ROOMS
  -- ============================================================================

  INSERT INTO treatment_rooms (
    business_unit_id, outlet_id, room_number, room_name, room_type,
    equipment, amenities, is_active
  ) VALUES
    (v_business_unit_id, v_outlet_main_id, 'BG-101', 'Consultation Room 1', 'consultation',
     '{"has_computer": true, "has_examination_bed": true, "has_ultrasound": false}'::jsonb,
     ARRAY['private', 'comfortable_seating'], true),

    (v_business_unit_id, v_outlet_main_id, 'BG-102', 'Consultation Room 2', 'consultation',
     '{"has_computer": true, "has_examination_bed": true, "has_ultrasound": false}'::jsonb,
     ARRAY['private', 'comfortable_seating'], true),

    (v_business_unit_id, v_outlet_main_id, 'BG-201', 'Ultrasound Suite', 'ultrasound',
     '{"has_computer": true, "has_examination_bed": true, "has_ultrasound": true, "has_mammography": false}'::jsonb,
     ARRAY['private', 'medical_equipment'], true),

    (v_business_unit_id, v_outlet_main_id, 'BG-202', 'Screening Room', 'screening',
     '{"has_computer": true, "has_examination_bed": true, "has_mammography": true}'::jsonb,
     ARRAY['private', 'medical_equipment', 'changing_area'], true);

  RAISE NOTICE '✓ Created 4 treatment rooms';

  -- ============================================================================
  -- 5. CREATE APPOINTMENT SERVICES
  -- ============================================================================

  INSERT INTO appointment_services (
    business_unit_id, name, description, duration_minutes,
    price, currency, required_room_type, display_order, color_hex, is_active
  ) VALUES
    (v_business_unit_id, 'Breast Health Consultation',
     'Comprehensive consultation with a breast health specialist to discuss concerns and screening options.',
     30, 150.00, 'HKD', 'consultation', 1, '#10B981', true)
    RETURNING id INTO v_service_1_id;

  INSERT INTO appointment_services (
    business_unit_id, name, description, duration_minutes,
    price, currency, required_room_type, display_order, color_hex, is_active
  ) VALUES
    (v_business_unit_id, 'Breast Ultrasound Screening',
     'Advanced ultrasound screening for breast health assessment and early detection.',
     45, 800.00, 'HKD', 'ultrasound', 2, '#3B82F6', true)
    RETURNING id INTO v_service_2_id;

  INSERT INTO appointment_services (
    business_unit_id, name, description, duration_minutes,
    price, currency, required_room_type, display_order, color_hex, is_active
  ) VALUES
    (v_business_unit_id, 'Follow-up Consultation',
     'Follow-up appointment to review screening results and discuss next steps.',
     20, 100.00, 'HKD', 'consultation', 3, '#F59E0B', true)
    RETURNING id INTO v_service_3_id;

  RAISE NOTICE '✓ Created 3 appointment services';

  -- ============================================================================
  -- 6. ASSIGN STAFF TO SERVICES
  -- ============================================================================

  -- Consultation service - all staff can perform
  INSERT INTO service_staff_assignments (business_unit_id, service_id, staff_id, is_active)
  VALUES
    (v_business_unit_id, v_service_1_id, v_staff_1_id, true),
    (v_business_unit_id, v_service_1_id, v_staff_2_id, true),
    (v_business_unit_id, v_service_1_id, v_staff_3_id, true);

  -- Ultrasound - only doctors
  INSERT INTO service_staff_assignments (business_unit_id, service_id, staff_id, is_active)
  VALUES
    (v_business_unit_id, v_service_2_id, v_staff_1_id, true),
    (v_business_unit_id, v_service_2_id, v_staff_2_id, true);

  -- Follow-up - all staff
  INSERT INTO service_staff_assignments (business_unit_id, service_id, staff_id, is_active)
  VALUES
    (v_business_unit_id, v_service_3_id, v_staff_1_id, true),
    (v_business_unit_id, v_service_3_id, v_staff_2_id, true),
    (v_business_unit_id, v_service_3_id, v_staff_3_id, true);

  RAISE NOTICE '✓ Created service-staff assignments';

  -- ============================================================================
  -- 7. ASSIGN SERVICES TO ROOMS (room compatibility)
  -- ============================================================================

  -- Consultation rooms can handle consultation and follow-up services
  INSERT INTO room_service_assignments (room_id, service_id)
  SELECT r.id, s.id
  FROM treatment_rooms r
  CROSS JOIN appointment_services s
  WHERE r.business_unit_id = v_business_unit_id
    AND r.room_type = 'consultation'
    AND s.id IN (v_service_1_id, v_service_3_id);

  -- Ultrasound suite for ultrasound service
  INSERT INTO room_service_assignments (room_id, service_id)
  SELECT r.id, v_service_2_id
  FROM treatment_rooms r
  WHERE r.business_unit_id = v_business_unit_id
    AND r.room_type = 'ultrasound';

  RAISE NOTICE '✓ Created room-service assignments';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BREAST GUARDIAN FULLY SEEDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Business Unit: Breast Guardian';
  RAISE NOTICE '';
  RAISE NOTICE 'Staff Created:';
  RAISE NOTICE '  • Dr. Sarah Wong (Doctor)';
  RAISE NOTICE '  • Dr. Emily Chen (Doctor)';
  RAISE NOTICE '  • Nurse Lisa Tam (Nurse)';
  RAISE NOTICE '';
  RAISE NOTICE 'Outlet:';
  RAISE NOTICE '  • Breast Guardian - Main Clinic';
  RAISE NOTICE '';
  RAISE NOTICE 'Rooms (4):';
  RAISE NOTICE '  • BG-101 - Consultation Room 1';
  RAISE NOTICE '  • BG-102 - Consultation Room 2';
  RAISE NOTICE '  • BG-201 - Ultrasound Suite';
  RAISE NOTICE '  • BG-202 - Screening Room';
  RAISE NOTICE '';
  RAISE NOTICE 'Services (3):';
  RAISE NOTICE '  • Breast Health Consultation (30 min)';
  RAISE NOTICE '  • Breast Ultrasound Screening (45 min)';
  RAISE NOTICE '  • Follow-up Consultation (20 min)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;
