// Check Emily's schedule
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmilySchedule() {
  console.log('\n👩 Checking Emily Rodriguez schedule...\n')

  // Get Emily's staff record
  const { data: emily, error: emilyError } = await supabase
    .from('real_staff')
    .select('*')
    .ilike('name', '%Emily%')
    .single()

  if (emilyError || !emily) {
    console.error('❌ Emily not found:', emilyError)
    return
  }

  console.log(`✅ Emily Rodriguez:`)
  console.log(`   ID: ${emily.id}`)
  console.log(`   Name: ${emily.name}`)
  console.log(`   Active: ${emily.is_active}`)
  console.log(`   Business Unit: ${emily.business_unit_id}\n`)

  // Get all appointments for Emily
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(name),
      room:treatment_rooms(room_name, room_number)
    `)
    .eq('real_staff_id', emily.id)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (aptError) {
    console.error('❌ Error fetching appointments:', aptError)
    return
  }

  if (!appointments || appointments.length === 0) {
    console.log('❌ No appointments found for Emily')
    console.log('\n🔍 Checking if there are ANY appointments with Emily\'s ID in the database...\n')

    // Raw query to check
    const { data: rawCheck } = await supabase
      .from('appointments')
      .select('id, real_staff_id, appointment_date, start_time')
      .eq('real_staff_id', emily.id)

    console.log('Raw query result:', rawCheck)
    return
  }

  console.log(`📅 Found ${appointments.length} appointment(s) for Emily:\n`)

  appointments.forEach((apt, i) => {
    console.log(`${i + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.end_time}`)
    console.log(`   Service: ${apt.service?.name || 'N/A'}`)
    console.log(`   Room: ${apt.room?.room_name || apt.room?.room_number || 'N/A'}`)
    console.log(`   Duration: ${apt.duration_minutes} min`)
    console.log(`   Status: ${apt.status}`)
    console.log(`   User: ${apt.user_name || apt.user_identifier}`)
    console.log('')
  })
}

checkEmilySchedule()
