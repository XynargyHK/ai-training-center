// Add RLS policies for appointments using service role key
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function addRLSPolicies() {
  console.log('\n🔒 Adding RLS Policies...\n')

  const policies = [
    {
      name: 'Enable RLS on appointments',
      sql: 'ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to appointments',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to appointments" ON appointments;
        CREATE POLICY "Allow read access to appointments"
        ON appointments
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    },
    {
      name: 'Enable RLS on appointment_services',
      sql: 'ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to appointment_services',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to appointment_services" ON appointment_services;
        CREATE POLICY "Allow read access to appointment_services"
        ON appointment_services
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    },
    {
      name: 'Enable RLS on real_staff',
      sql: 'ALTER TABLE real_staff ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to real_staff',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to real_staff" ON real_staff;
        CREATE POLICY "Allow read access to real_staff"
        ON real_staff
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    },
    {
      name: 'Enable RLS on treatment_rooms',
      sql: 'ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to treatment_rooms',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to treatment_rooms" ON treatment_rooms;
        CREATE POLICY "Allow read access to treatment_rooms"
        ON treatment_rooms
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    },
    {
      name: 'Enable RLS on business_units',
      sql: 'ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to business_units',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to business_units" ON business_units;
        CREATE POLICY "Allow read access to business_units"
        ON business_units
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    },
    {
      name: 'Enable RLS on outlets',
      sql: 'ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Allow read access to outlets',
      sql: `
        DROP POLICY IF EXISTS "Allow read access to outlets" ON outlets;
        CREATE POLICY "Allow read access to outlets"
        ON outlets
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`📝 ${policy.name}...`)

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      })

      if (error) {
        console.error(`   ❌ Error:`, error.message)
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err.message)
    }
  }

  console.log('\n✅ RLS policies setup complete!')
  console.log('\nTesting access with ANON key...')

  // Test with anon key
  const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const { data: testData, error: testError } = await supabaseAnon
    .from('appointments')
    .select('id, appointment_date, start_time')
    .limit(5)

  if (testError) {
    console.error('❌ Still cannot read with ANON key:', testError.message)
  } else {
    console.log(`✅ ANON key can now read ${testData?.length || 0} appointments`)
  }
}

addRLSPolicies()
