// Check RLS policies on appointments table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create both clients
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS Policies...\n')

  // Get business unit
  const { data: bu } = await supabaseService
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  const businessUnitId = bu.id

  // Get Emily
  const { data: emily } = await supabaseService
    .from('real_staff')
    .select('id')
    .ilike('name', '%Emily%')
    .single()

  const filterStaffId = emily.id

  console.log('Business Unit ID:', businessUnitId)
  console.log('Emily ID:', filterStaffId)

  // Calculate week range
  const selectedDate = new Date()
  let dateFrom = new Date(selectedDate)
  let dateTo = new Date(selectedDate)
  const dayOfWeek = dateFrom.getDay()
  dateFrom.setDate(dateFrom.getDate() - dayOfWeek)
  dateTo.setDate(dateFrom.getDate() + 6)
  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]

  console.log('Week range:', dateFromStr, 'to', dateToStr)

  // Test 1: Query with SERVICE ROLE KEY (bypasses RLS)
  console.log('\n=== TEST 1: Query with SERVICE ROLE KEY (bypasses RLS) ===')
  const { data: serviceData, error: serviceError } = await supabaseService
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
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (serviceError) {
    console.error('❌ Error:', serviceError)
  } else {
    console.log(`✅ Found ${serviceData?.length || 0} appointments with SERVICE KEY`)
  }

  // Test 2: Query with ANON KEY (subject to RLS)
  console.log('\n=== TEST 2: Query with ANON KEY (subject to RLS) ===')
  const { data: anonData, error: anonError } = await supabaseAnon
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
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (anonError) {
    console.error('❌ Error:', anonError)
    console.error('   Message:', anonError.message)
    console.error('   Details:', anonError.details)
    console.error('   Hint:', anonError.hint)
  } else {
    console.log(`✅ Found ${anonData?.length || 0} appointments with ANON KEY`)
    if (anonData && anonData.length > 0) {
      console.log('\nAppointments returned:')
      anonData.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.appointment_date} ${apt.start_time}`)
      })
    }
  }

  // Check RLS policies
  console.log('\n=== Checking RLS Policy Configuration ===')
  const { data: policies, error: policiesError } = await supabaseService
    .rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'appointments'
        ORDER BY policyname;
      `
    })
    .single()

  if (policiesError) {
    console.log('⚠️  Cannot query policies directly (function may not exist)')
    console.log('   Trying alternative method...')

    // Try direct table query
    const { data: rlsStatus } = await supabaseService
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'appointments')
      .single()

    console.log('   RLS Status:', rlsStatus)
  } else {
    console.log('Policies:', policies)
  }

  console.log('\n💡 DIAGNOSIS:')
  if (serviceError && anonError) {
    console.log('❌ Both queries failed - there may be a database connection issue')
  } else if (!serviceError && anonError) {
    console.log('❌ ANON KEY query failed but SERVICE KEY works')
    console.log('   → This means RLS is blocking the browser!')
    console.log('   → Need to add RLS policy to allow public read access to appointments')
  } else if (!serviceError && !anonError) {
    if ((serviceData?.length || 0) !== (anonData?.length || 0)) {
      console.log('⚠️  Different results between SERVICE and ANON keys')
      console.log(`   → SERVICE KEY: ${serviceData?.length || 0} appointments`)
      console.log(`   → ANON KEY: ${anonData?.length || 0} appointments`)
      console.log('   → RLS may be filtering some rows')
    } else {
      console.log('✅ Both queries work and return same results')
      console.log('   → RLS is configured correctly')
    }
  }
}

checkRLSPolicies()
