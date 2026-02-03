// Test the exact query the dashboard uses
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardQuery() {
  console.log('\n🔍 Testing booking dashboard query...\n')

  // Get business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.error('❌ Business unit not found')
    return
  }

  const businessUnitId = bu.id
  console.log('Business Unit ID:', businessUnitId)

  // Get Emily's ID
  const { data: emily } = await supabase
    .from('real_staff')
    .select('id')
    .ilike('name', '%Emily%')
    .single()

  if (!emily) {
    console.error('❌ Emily not found')
    return
  }

  const filterStaffId = emily.id
  console.log('Emily ID:', filterStaffId)

  // Calculate today's date range (what the dashboard shows by default)
  const today = new Date()
  const dateFrom = new Date(today)
  dateFrom.setHours(0, 0, 0, 0)
  const dateTo = new Date(today)
  dateTo.setHours(23, 59, 59, 999)

  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]

  console.log('\n📅 Query for TODAY:')
  console.log('Date range:', dateFromStr, 'to', dateToStr)

  // Query exactly as dashboard does
  let query = supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(*),
      staff:real_staff(id, name, email, staff_type, avatar_url),
      room:treatment_rooms(*)
    `)
    .eq('business_unit_id', businessUnitId)
    .gte('appointment_date', dateFromStr)
    .lte('appointment_date', dateToStr)
    .eq('real_staff_id', filterStaffId)

  const { data: todayApts, error: todayError } = await query
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (todayError) {
    console.error('❌ Error:', todayError)
  } else {
    console.log('✅ Found', todayApts?.length || 0, 'appointments for TODAY')
  }

  // Now query for TOMORROW
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFrom = new Date(tomorrow)
  tomorrowFrom.setHours(0, 0, 0, 0)
  const tomorrowTo = new Date(tomorrow)
  tomorrowTo.setHours(23, 59, 59, 999)

  const tomorrowFromStr = tomorrowFrom.toISOString().split('T')[0]
  const tomorrowToStr = tomorrowTo.toISOString().split('T')[0]

  console.log('\n📅 Query for TOMORROW:')
  console.log('Date range:', tomorrowFromStr, 'to', tomorrowToStr)

  query = supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(*),
      staff:real_staff(id, name, email, staff_type, avatar_url),
      room:treatment_rooms(*)
    `)
    .eq('business_unit_id', businessUnitId)
    .gte('appointment_date', tomorrowFromStr)
    .lte('appointment_date', tomorrowToStr)
    .eq('real_staff_id', filterStaffId)

  const { data: tomorrowApts, error: tomorrowError } = await query
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (tomorrowError) {
    console.error('❌ Error:', tomorrowError)
  } else {
    console.log('✅ Found', tomorrowApts?.length || 0, 'appointments for TOMORROW')
    if (tomorrowApts && tomorrowApts.length > 0) {
      console.log('\nAppointments:')
      tomorrowApts.forEach((apt, i) => {
        console.log(`${i + 1}. ${apt.appointment_date} ${apt.start_time}-${apt.end_time}`)
        console.log(`   Service: ${apt.service?.name}`)
        console.log(`   Status: ${apt.status}`)
      })
    }
  }
}

testDashboardQuery()
