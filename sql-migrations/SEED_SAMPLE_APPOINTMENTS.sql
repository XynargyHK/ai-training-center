-- ============================================
-- SEED SAMPLE APPOINTMENTS FOR DEMO
-- ============================================
-- This creates sample appointments to demonstrate the booking calendar
-- Shows various statuses and different times throughout the week

-- Get IDs for reference
DO $$
DECLARE
  v_business_unit_id UUID;
  v_service_facial_id UUID;
  v_service_massage_id UUID;
  v_service_consultation_id UUID;
  v_staff_sarah_id UUID;
  v_staff_mike_id UUID;
  v_staff_emma_id UUID;
  v_room_101_id UUID;
  v_room_102_id UUID;
  v_room_103_id UUID;
BEGIN
  -- Get business unit
  SELECT id INTO v_business_unit_id
  FROM business_units
  WHERE slug = 'skincoach'
  LIMIT 1;

  -- Get or create services
  INSERT INTO appointment_services (name, description, business_unit_id, price)
  VALUES
    ('Facial Treatment', 'Deep cleansing facial with moisturizing treatment', v_business_unit_id, 89.00),
    ('Relaxing Massage', '60-minute full body relaxation massage', v_business_unit_id, 120.00),
    ('Skin Consultation', 'Initial consultation with skin analysis', v_business_unit_id, 45.00)
  ON CONFLICT (business_unit_id, name) DO UPDATE
    SET price = EXCLUDED.price
  RETURNING id INTO v_service_facial_id;

  -- Get service IDs
  SELECT id INTO v_service_facial_id FROM appointment_services WHERE name = 'Facial Treatment' AND business_unit_id = v_business_unit_id;
  SELECT id INTO v_service_massage_id FROM appointment_services WHERE name = 'Relaxing Massage' AND business_unit_id = v_business_unit_id;
  SELECT id INTO v_service_consultation_id FROM appointment_services WHERE name = 'Skin Consultation' AND business_unit_id = v_business_unit_id;

  -- Get or create staff
  INSERT INTO real_staff (name, email, business_unit_id, staff_type, is_active)
  VALUES
    ('Sarah Johnson', 'sarah@skincoach.com', v_business_unit_id, 'therapist', true),
    ('Mike Chen', 'mike@skincoach.com', v_business_unit_id, 'therapist', true),
    ('Emma Wilson', 'emma@skincoach.com', v_business_unit_id, 'consultant', true)
  ON CONFLICT (business_unit_id, email) DO UPDATE
    SET is_active = true
  RETURNING id INTO v_staff_sarah_id;

  -- Get staff IDs
  SELECT id INTO v_staff_sarah_id FROM real_staff WHERE email = 'sarah@skincoach.com' AND business_unit_id = v_business_unit_id;
  SELECT id INTO v_staff_mike_id FROM real_staff WHERE email = 'mike@skincoach.com' AND business_unit_id = v_business_unit_id;
  SELECT id INTO v_staff_emma_id FROM real_staff WHERE email = 'emma@skincoach.com' AND business_unit_id = v_business_unit_id;

  -- Get room IDs (assume they exist from seed data)
  SELECT id INTO v_room_101_id FROM treatment_rooms WHERE room_number = '101' AND business_unit_id = v_business_unit_id LIMIT 1;
  SELECT id INTO v_room_102_id FROM treatment_rooms WHERE room_number = '102' AND business_unit_id = v_business_unit_id LIMIT 1;
  SELECT id INTO v_room_103_id FROM treatment_rooms WHERE room_number = '103' AND business_unit_id = v_business_unit_id LIMIT 1;

  -- Create service-staff assignments
  INSERT INTO service_staff_assignments (service_id, staff_id, business_unit_id, is_active)
  VALUES
    (v_service_facial_id, v_staff_sarah_id, v_business_unit_id, true),
    (v_service_massage_id, v_staff_mike_id, v_business_unit_id, true),
    (v_service_consultation_id, v_staff_emma_id, v_business_unit_id, true),
    (v_service_facial_id, v_staff_emma_id, v_business_unit_id, true)
  ON CONFLICT (service_id, staff_id) DO NOTHING;

  -- Delete existing sample appointments to avoid duplicates
  DELETE FROM appointments
  WHERE user_identifier LIKE 'demo_%'
    AND business_unit_id = v_business_unit_id;

  -- Insert sample appointments for this week
  -- Monday appointments
  INSERT INTO appointments (
    business_unit_id,
    service_id,
    real_staff_id,
    room_id,
    appointment_date,
    start_time,
    end_time,
    user_identifier,
    user_name,
    user_email,
    user_phone,
    status,
    customer_notes
  ) VALUES
  -- Monday 9 AM - Sarah - Confirmed
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- This Monday
    '09:00:00',
    '10:00:00',
    'demo_client_001',
    'Jennifer Smith',
    'jennifer.smith@email.com',
    '+1-555-0101',
    'confirmed',
    'First time client, sensitive skin'
  ),
  -- Monday 10 AM - Mike - Confirmed
  (
    v_business_unit_id,
    v_service_massage_id,
    v_staff_mike_id,
    v_room_102_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1,
    '10:00:00',
    '11:00:00',
    'demo_client_002',
    'Robert Johnson',
    'robert.j@email.com',
    '+1-555-0102',
    'confirmed',
    'Prefers deep tissue massage'
  ),
  -- Monday 11 AM - Emma - Pending
  (
    v_business_unit_id,
    v_service_consultation_id,
    v_staff_emma_id,
    v_room_103_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1,
    '11:00:00',
    '12:00:00',
    'demo_client_003',
    'Maria Garcia',
    'maria.garcia@email.com',
    '+1-555-0103',
    'pending',
    'Interested in anti-aging treatments'
  ),
  -- Monday 2 PM - Sarah - Confirmed
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1,
    '14:00:00',
    '15:00:00',
    'demo_client_004',
    'Lisa Anderson',
    'lisa.a@email.com',
    '+1-555-0104',
    'confirmed',
    'Regular client'
  ),

  -- Tuesday appointments
  -- Tuesday 9 AM - Mike - Confirmed
  (
    v_business_unit_id,
    v_service_massage_id,
    v_staff_mike_id,
    v_room_102_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- This Tuesday
    '09:00:00',
    '10:00:00',
    'demo_client_005',
    'David Lee',
    'david.lee@email.com',
    '+1-555-0105',
    'confirmed',
    NULL
  ),
  -- Tuesday 10 AM - Emma - Confirmed
  (
    v_business_unit_id,
    v_service_consultation_id,
    v_staff_emma_id,
    v_room_103_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2,
    '10:00:00',
    '11:00:00',
    'demo_client_006',
    'Sarah Brown',
    'sarah.b@email.com',
    '+1-555-0106',
    'confirmed',
    'Acne concerns'
  ),
  -- Tuesday 3 PM - Sarah - Pending
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2,
    '15:00:00',
    '16:00:00',
    'demo_client_007',
    'Michelle Wang',
    'michelle.wang@email.com',
    '+1-555-0107',
    'pending',
    'Bride-to-be, wedding in 2 weeks'
  ),

  -- Wednesday appointments
  -- Wednesday 9 AM - Sarah - Confirmed
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- This Wednesday
    '09:00:00',
    '10:00:00',
    'demo_client_008',
    'Amanda Martinez',
    'amanda.m@email.com',
    '+1-555-0108',
    'confirmed',
    'Hydration facial'
  ),
  -- Wednesday 10 AM - Mike - Confirmed
  (
    v_business_unit_id,
    v_service_massage_id,
    v_staff_mike_id,
    v_room_102_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3,
    '10:00:00',
    '11:00:00',
    'demo_client_009',
    'James Wilson',
    'james.w@email.com',
    '+1-555-0109',
    'confirmed',
    'Sports massage'
  ),
  -- Wednesday 11 AM - Emma - Confirmed
  (
    v_business_unit_id,
    v_service_consultation_id,
    v_staff_emma_id,
    v_room_103_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3,
    '11:00:00',
    '12:00:00',
    'demo_client_010',
    'Emily Chen',
    'emily.chen@email.com',
    '+1-555-0110',
    'confirmed',
    'Rosacea treatment consultation'
  ),

  -- Thursday appointments
  -- Thursday 2 PM - Sarah - Pending
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 4, -- This Thursday
    '14:00:00',
    '15:00:00',
    'demo_client_011',
    'Jessica Taylor',
    'jessica.t@email.com',
    '+1-555-0111',
    'pending',
    'Gift certificate booking'
  ),
  -- Thursday 3 PM - Mike - Confirmed
  (
    v_business_unit_id,
    v_service_massage_id,
    v_staff_mike_id,
    v_room_102_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 4,
    '15:00:00',
    '16:00:00',
    'demo_client_012',
    'Michael Brown',
    'michael.b@email.com',
    '+1-555-0112',
    'confirmed',
    'Back pain relief'
  ),

  -- Friday appointments
  -- Friday 9 AM - Sarah - Confirmed
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5, -- This Friday
    '09:00:00',
    '10:00:00',
    'demo_client_013',
    'Nicole Davis',
    'nicole.d@email.com',
    '+1-555-0113',
    'confirmed',
    'Monthly maintenance facial'
  ),
  -- Friday 10 AM - Emma - Confirmed
  (
    v_business_unit_id,
    v_service_consultation_id,
    v_staff_emma_id,
    v_room_103_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5,
    '10:00:00',
    '11:00:00',
    'demo_client_014',
    'Rachel Kim',
    'rachel.kim@email.com',
    '+1-555-0114',
    'confirmed',
    'Pigmentation issues'
  ),
  -- Friday 11 AM - Mike - Confirmed
  (
    v_business_unit_id,
    v_service_massage_id,
    v_staff_mike_id,
    v_room_102_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5,
    '11:00:00',
    '12:00:00',
    'demo_client_015',
    'Christopher Lee',
    'chris.lee@email.com',
    '+1-555-0115',
    'confirmed',
    'Stress relief massage'
  ),
  -- Friday 2 PM - Sarah - Pending
  (
    v_business_unit_id,
    v_service_facial_id,
    v_staff_sarah_id,
    v_room_101_id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5,
    '14:00:00',
    '15:00:00',
    'demo_client_016',
    'Sophia Rodriguez',
    'sophia.r@email.com',
    '+1-555-0116',
    'pending',
    'First time, nervous about treatments'
  );

  RAISE NOTICE 'Sample appointments created successfully!';
  RAISE NOTICE 'Services: Facial Treatment, Relaxing Massage, Skin Consultation';
  RAISE NOTICE 'Staff: Sarah Johnson, Mike Chen, Emma Wilson';
  RAISE NOTICE 'Appointments created for this week (Monday-Friday)';
END $$;
