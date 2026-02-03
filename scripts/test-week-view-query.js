// Test the exact query the week view uses
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testWeekViewQuery() {
  console.log('\n📅 Testing Week View Query (simulating browser)...\n')

  // Get business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  const businessUnitId = bu.id
  console.log('Business Unit ID:', businessUnitId)

  // Get Emily's ID
  const { data: emily } = await supabase
    .from('real_staff')
    .select('id, name')
    .ilike('name', '%Emily%')
    .single()

  const filterStaffId = emily.id
  console.log('Emily ID:', filterStaffId)
  console.log('Emily Name:', emily.name)

  // Simulate what the browser does
  const selectedDate = new Date() // Today in browser's timezone
  console.log('\nBrowser selectedDate:', selectedDate.toString())
  console.log('Browser selectedDate ISO:', selectedDate.toISOString())

  // Calculate week range (same logic as page.tsx)
  let dateFrom = new Date(selectedDate)
  let dateTo = new Date(selectedDate)

  const dayOfWeek = dateFrom.getDay()
  dateFrom.setDate(dateFrom.getDate() - dayOfWeek)
  dateTo.setDate(dateFrom.getDate() + 6)

  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]

  console.log('\nWeek range calculation:')
  console.log('  dayOfWeek:', dayOfWeek)
  console.log('  dateFrom:', dateFromStr)
  console.log('  dateTo:', dateToStr)

  // Exact query from page.tsx
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

  // Apply staff filter
  if (filterStaffId) {
    query = query.eq('real_staff_id', filterStaffId)
  }

  const { data, error } = await query
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('\n❌ Error:', error)
  } else {
    console.log(`\n✅ Found ${data?.length || 0} appointments for WEEK VIEW`)
    if (data && data.length > 0) {
      console.log('\nAppointments:')
      data.forEach((apt, i) => {
        console.log(`\n${i + 1}. ${apt.appointment_date} ${apt.start_time}`)
        console.log(`   Service: ${apt.service?.name}`)
        console.log(`   Client: ${apt.user_name}`)
        console.log(`   Status: ${apt.status}`)
        console.log(`   Staff: ${apt.staff?.name}`)
      })
    }
  }

  // Test getAppointmentsForSlot function
  console.log('\n📍 Testing getAppointmentsForSlot logic...')

  // Generate week days (same as page.tsx)
  const start = new Date(selectedDate)
  start.setDate(start.getDate() - start.getDay())
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    weekDays.push(day)
  }

  console.log('\nWeek days:')
  weekDays.forEach((day, i) => {
    console.log(`  ${i}: ${day.toISOString().split('T')[0]} (${day.toLocaleDateString('en-US', { weekday: 'short' })})`)
  })

  // Check 09:00 slot on 2025-11-24
  console.log('\n🔍 Checking appointments for Mon 2025-11-24 at 09:00...')
  const targetDay = weekDays.find(d => d.toISOString().split('T')[0] === '2025-11-24')
  if (targetDay && data) {
    const dateStr = targetDay.toISOString().split('T')[0]
    const time = '09:00'
    const matchingApts = data.filter(apt => {
      if (apt.appointment_date !== dateStr) return false
      const startHour = apt.start_time.substring(0, 5)
      return startHour === time
    })
    console.log(`Found ${matchingApts.length} appointment(s) at this slot`)
    matchingApts.forEach(apt => {
      console.log(`  - ${apt.service?.name} for ${apt.user_name}`)
    })
  }
}

testWeekViewQuery()
