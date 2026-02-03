// Check appointments in database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAppointments() {
  console.log('\n📅 Checking appointments...\n')

  // Get SkinCoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.error('❌ SkinCoach business unit not found')
    return
  }

  console.log(`✅ Business Unit: ${bu.name} (${bu.id})\n`)

  // Get all appointments
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(name),
      staff:real_staff(name),
      room:treatment_rooms(room_name, room_number)
    `)
    .eq('business_unit_id', bu.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!appointments || appointments.length === 0) {
    console.log('❌ No appointments found')
    return
  }

  console.log(`Found ${appointments.length} appointment(s):\n`)

  appointments.forEach((apt, i) => {
    console.log(`${i + 1}. ${apt.appointment_date} at ${apt.start_time} - ${apt.end_time}`)
    console.log(`   Service: ${apt.service?.name || 'N/A'}`)
    console.log(`   Staff: ${apt.staff?.name || 'N/A'}`)
    console.log(`   Room: ${apt.room?.room_name || apt.room?.room_number || 'N/A'}`)
    console.log(`   Duration: ${apt.duration_minutes} minutes`)
    console.log(`   Status: ${apt.status}`)
    console.log(`   User: ${apt.user_name || apt.user_identifier}`)
    console.log(`   Created: ${apt.created_at}`)
    console.log('')
  })
}

checkAppointments()
