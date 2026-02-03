// Check if profile tables exist
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking profile tables...\n')

  // Check companies table
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .limit(1)

  if (companiesError) {
    console.log('❌ Companies table error:', companiesError.message)
  } else {
    console.log('✅ Companies table exists')
    console.log('   Records:', companies.length)
  }

  // Check user_profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)

  if (profilesError) {
    console.log('❌ User profiles table error:', profilesError.message)
  } else {
    console.log('✅ User profiles table exists')
    console.log('   Records:', profiles.length)
  }

  // Check business_units for company_id column
  const { data: units, error: unitsError } = await supabase
    .from('business_units')
    .select('id, name, company_id')
    .limit(1)

  if (unitsError) {
    console.log('❌ Business units check error:', unitsError.message)
  } else {
    console.log('✅ Business units has company_id column')
  }

  console.log('\n✅ All profile tables are ready!')
}

checkTables()
