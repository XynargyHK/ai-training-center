// Check product addon matches
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Get addon matches
  const { data, error } = await supabase
    .from('product_addon_matches')
    .select('*')
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Total matches found:', data?.length)

  if (data && data.length > 0) {
    console.log('\nSample matches:')
    for (const m of data.slice(0, 5)) {
      // Get product names
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', m.product_id)
        .single()

      const { data: addon } = await supabase
        .from('products')
        .select('title')
        .eq('id', m.addon_id)
        .single()

      console.log(`  ${product?.title || 'Unknown'} + ${addon?.title || 'Unknown'} (Score: ${m.match_score})`)
    }
  }
}

check()
