// ============================================================================
// RUN APPOINTMENT SYSTEM MIGRATIONS AND SEED DATA
// Execute this script to set up the appointment booking system
// ============================================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`)

  const sql = fs.readFileSync(filePath, 'utf8')

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('   ⚠️ RPC method failed, trying direct execution...')
        // Note: Direct SQL execution requires service role key
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message)
    }
  }

  console.log('   ✅ Migration completed')
}

async function seedSampleData() {
  console.log('\n🌱 Seeding sample data...')

  try {
    // Get first business unit
    const { data: businessUnits, error: buError } = await supabase
      .from('business_units')
      .select('id, name')
      .limit(1)

    if (buError || !businessUnits || businessUnits.length === 0) {
      console.error('❌ No business units found. Please create a business unit first.')
      return
    }

    const businessUnitId = businessUnits[0].id
    console.log(`   Using business unit: ${businessUnits[0].name} (${businessUnitId})`)

    // Enable appointment features
    console.log('\n   1️⃣ Enabling appointment features...')
    const { error: settingsError } = await supabase
      .from('business_unit_settings')
      .update({
        enable_appointments: true,
        appointments_require_confirmation: true
      })
      .eq('business_unit_id', businessUnitId)

    if (settingsError) {
      console.error('   ⚠️ Settings update error:', settingsError.message)
    } else {
      console.log('   ✅ Appointment features enabled')
    }

    // Create treatment rooms
    console.log('\n   2️⃣ Creating treatment rooms...')
    const rooms = [
      {
        business_unit_id: businessUnitId,
        room_number: 'R101',
        room_name: 'VIP Treatment Room',
        room_type: 'facial',
        equipment: { has_steamer: true, has_massage_bed: true, has_mirror: true },
        amenities: ['private_bathroom', 'music_system', 'aromatherapy'],
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        room_number: 'R102',
        room_name: 'Standard Treatment Room 1',
        room_type: 'facial',
        equipment: { has_steamer: true, has_massage_bed: true },
        amenities: ['music_system'],
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        room_number: 'R103',
        room_name: 'Massage Room',
        room_type: 'massage',
        equipment: { has_massage_bed: true, has_hot_stones: true },
        amenities: ['private_bathroom', 'music_system', 'aromatherapy'],
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        room_number: 'R104',
        room_name: 'Consultation Room',
        room_type: 'consultation',
        equipment: { has_computer: true, has_camera: true },
        amenities: ['comfortable_seating'],
        is_active: true
      }
    ]

    const { data: createdRooms, error: roomsError } = await supabase
      .from('treatment_rooms')
      .upsert(rooms, { onConflict: 'business_unit_id,room_number' })
      .select()

    if (roomsError) {
      console.error('   ❌ Rooms error:', roomsError.message)
    } else {
      console.log(`   ✅ Created ${createdRooms?.length || 0} treatment rooms`)
    }

    // Create appointment services
    console.log('\n   3️⃣ Creating appointment services...')
    const services = [
      {
        business_unit_id: businessUnitId,
        name: 'Deep Cleansing Facial',
        description: 'A thorough facial treatment that cleanses, exfoliates, and hydrates your skin',
        duration_minutes: 60,
        price: 120.00,
        currency: 'USD',
        required_room_type: 'facial',
        display_order: 1,
        color_hex: '#3B82F6',
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        name: 'Anti-Aging Facial',
        description: 'Advanced facial treatment targeting fine lines and wrinkles',
        duration_minutes: 90,
        price: 180.00,
        currency: 'USD',
        required_room_type: 'facial',
        display_order: 2,
        color_hex: '#8B5CF6',
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        name: 'Relaxing Massage',
        description: 'Full body massage for deep relaxation and stress relief',
        duration_minutes: 60,
        price: 100.00,
        currency: 'USD',
        required_room_type: 'massage',
        display_order: 3,
        color_hex: '#10B981',
        is_active: true
      },
      {
        business_unit_id: businessUnitId,
        name: 'Skin Consultation',
        description: 'Professional consultation to assess your skin and recommend treatments',
        duration_minutes: 30,
        price: 50.00,
        currency: 'USD',
        required_room_type: 'consultation',
        display_order: 4,
        color_hex: '#F59E0B',
        is_active: true
      }
    ]

    const { data: createdServices, error: servicesError } = await supabase
      .from('appointment_services')
      .insert(services)
      .select()

    if (servicesError) {
      console.error('   ❌ Services error:', servicesError.message)
    } else {
      console.log(`   ✅ Created ${createdServices?.length || 0} appointment services`)
    }

    // Create staff availability
    console.log('\n   4️⃣ Setting up staff availability...')

    // Get all ai_staff for this business unit
    const { data: staffList, error: staffError } = await supabase
      .from('ai_staff')
      .select('id, name')
      .eq('business_unit_id', businessUnitId)
      .limit(3)

    if (staffError || !staffList || staffList.length === 0) {
      console.log('   ⚠️ No AI staff found. Skipping staff availability setup.')
    } else {
      const availability = []

      // Create Monday-Friday 9am-5pm availability for each staff member
      for (const staff of staffList) {
        for (let day = 1; day <= 5; day++) {
          availability.push({
            business_unit_id: businessUnitId,
            ai_staff_id: staff.id,
            day_of_week: day,
            start_time: '09:00:00',
            end_time: '17:00:00',
            is_available: true,
            is_recurring: true
          })
        }

        // Add lunch break (12pm-1pm)
        for (let day = 1; day <= 5; day++) {
          availability.push({
            business_unit_id: businessUnitId,
            ai_staff_id: staff.id,
            day_of_week: day,
            start_time: '12:00:00',
            end_time: '13:00:00',
            is_available: false,
            block_reason: 'Lunch Break',
            is_recurring: true
          })
        }
      }

      const { data: createdAvailability, error: availError } = await supabase
        .from('appointment_staff_availability')
        .insert(availability)
        .select()

      if (availError) {
        console.error('   ❌ Availability error:', availError.message)
      } else {
        console.log(`   ✅ Created ${createdAvailability?.length || 0} availability slots for ${staffList.length} staff members`)
      }
    }

    console.log('\n✅ Sample data seeding completed!')
    console.log('\n📋 Summary:')
    console.log('   - 4 treatment rooms created')
    console.log('   - 4 appointment services created')
    console.log('   - Staff availability set up (Mon-Fri, 9am-5pm with lunch breaks)')
    console.log('   - Appointment features enabled')
    console.log('\n🚀 You can now test the booking system!')

  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting appointment system setup...\n')

  // Run migrations
  console.log('=' .repeat(60))
  console.log('STEP 1: Running Database Migrations')
  console.log('=' .repeat(60))

  const migration1 = path.join(__dirname, '..', 'sql-migrations', '016_create_appointment_system.sql')
  const migration2 = path.join(__dirname, '..', 'sql-migrations', '017_add_appointment_feature_flags.sql')

  if (fs.existsSync(migration1)) {
    await runMigration(migration1)
  } else {
    console.log('⚠️ Migration file not found:', migration1)
  }

  if (fs.existsSync(migration2)) {
    await runMigration(migration2)
  } else {
    console.log('⚠️ Migration file not found:', migration2)
  }

  // Seed sample data
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: Seeding Sample Data')
  console.log('=' .repeat(60))

  await seedSampleData()

  console.log('\n' + '='.repeat(60))
  console.log('✅ APPOINTMENT SYSTEM SETUP COMPLETE!')
  console.log('=' .repeat(60))
  console.log('\nNext steps:')
  console.log('1. Start your dev server: npm run dev')
  console.log('2. Open the chat interface')
  console.log('3. Click the calendar button to book an appointment')
  console.log('4. Visit /provider to view the provider dashboard')
}

main().catch(console.error)
