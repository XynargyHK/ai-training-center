// Auto-confirm all pending appointments
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function autoConfirmAppointments() {
  console.log('\n✅ Auto-confirming all pending appointments...\n')

  // Update all pending appointments to confirmed
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
    .eq('status', 'pending')
    .select('id, appointment_date, start_time, user_name')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No pending appointments to confirm')
    return
  }

  console.log(`✅ Confirmed ${data.length} appointment(s):\n`)
  data.forEach((apt, i) => {
    console.log(`${i + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.user_name}`)
  })

  console.log('\n✅ All appointments are now auto-confirmed!')
  console.log('New bookings will also be auto-confirmed by default.')
}

autoConfirmAppointments()
