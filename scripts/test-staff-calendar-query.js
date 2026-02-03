// Test what the staff calendar sees when filtering by Emily
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testStaffCalendarQuery() {
  console.log('\n📅 Testing Staff Calendar Query...\n')

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
    .select('id, name')
    .ilike('name', '%Emily%')
    .single()

  if (!emily) {
    console.error('❌ Emily not found')
    return
  }

  const filterStaffId = emily.id
  console.log('Emily ID:', filterStaffId)
  console.log('Emily Name:', emily.name)

  // Test 1: Get ALL Emily's appointments (no date filter)
  console.log('\n=== TEST 1: All Emily appointments (no date filter) ===')
  const { data: allApts, error: allError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(name),
      staff:real_staff(name),
      room:treatment_rooms(room_name, room_number)
    `)
    .eq('business_unit_id', businessUnitId)
    .eq('real_staff_id', filterStaffId)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (allError) {
    console.error('❌ Error:', allError)
  } else {
    console.log(`✅ Found ${allApts?.length || 0} total appointments`)
    if (allApts && allApts.length > 0) {
      allApts.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.status}`)
      })
    }
  }

  // Test 2: Today only (default dashboard view)
  console.log('\n=== TEST 2: Today only (default day view) ===')
  const today = new Date()
  const dateFrom = new Date(today)
  dateFrom.setHours(0, 0, 0, 0)
  const dateTo = new Date(today)
  dateTo.setHours(23, 59, 59, 999)

  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]

  console.log('Date range:', dateFromStr, 'to', dateToStr)

  const { data: todayApts, error: todayError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(name),
      staff:real_staff(name),
      room:treatment_rooms(room_name, room_number)
    `)
    .eq('business_unit_id', businessUnitId)
    .eq('real_staff_id', filterStaffId)
    .gte('appointment_date', dateFromStr)
    .lte('appointment_date', dateToStr)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (todayError) {
    console.error('❌ Error:', todayError)
  } else {
    console.log(`✅ Found ${todayApts?.length || 0} appointments for TODAY`)
    if (todayApts && todayApts.length > 0) {
      todayApts.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.status}`)
      })
    }
  }

  // Test 3: This week (week view)
  console.log('\n=== TEST 3: This week (week view) ===')
  const weekStart = new Date(today)
  const dayOfWeek = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const weekFromStr = weekStart.toISOString().split('T')[0]
  const weekToStr = weekEnd.toISOString().split('T')[0]

  console.log('Date range:', weekFromStr, 'to', weekToStr)

  const { data: weekApts, error: weekError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:appointment_services(name),
      staff:real_staff(name),
      room:treatment_rooms(room_name, room_number)
    `)
    .eq('business_unit_id', businessUnitId)
    .eq('real_staff_id', filterStaffId)
    .gte('appointment_date', weekFromStr)
    .lte('appointment_date', weekToStr)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (weekError) {
    console.error('❌ Error:', weekError)
  } else {
    console.log(`✅ Found ${weekApts?.length || 0} appointments for THIS WEEK`)
    if (weekApts && weekApts.length > 0) {
      weekApts.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.status}`)
      })
    }
  }

  console.log('\n💡 DIAGNOSIS:')
  console.log('The dashboard defaults to "day" view, showing only TODAY\'s appointments.')
  console.log('If appointments are on different dates, you need to:')
  console.log('  1. Change to "week" or "month" view')
  console.log('  2. Navigate to the correct date')
  console.log('  3. Or show all appointments regardless of date filter')
}

testStaffCalendarQuery()
