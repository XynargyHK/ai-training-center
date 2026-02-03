// Debug products table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debug() {
  // Get raw product data
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Products found:', data?.length)

  if (data && data.length > 0) {
    console.log('\nFirst product keys:', Object.keys(data[0]))
    console.log('\nFirst product:')
    console.log(JSON.stringify(data[0], null, 2))
  }
}

debug()
