// Check product types distribution
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Find booster type IDs
  const { data: types } = await supabase
    .from('product_types')
    .select('id, name')
    .ilike('handle', 'booster')

  console.log('Booster type IDs:', types)

  // Count products by type
  const { data: products } = await supabase
    .from('products')
    .select('id, title, product_type_id, product_types(name, handle)')

  const byType = {}
  ;(products || []).forEach(p => {
    const typeName = p.product_types?.name || 'unknown'
    byType[typeName] = (byType[typeName] || 0) + 1
  })
  console.log('\nProducts by type:', byType)

  // Show some boosters
  const boosterTypeIds = (types || []).map(t => t.id)
  if (boosterTypeIds.length > 0) {
    const { data: boosters } = await supabase
      .from('products')
      .select('id, title')
      .in('product_type_id', boosterTypeIds)
      .limit(5)

    console.log('\nSample boosters:')
    ;(boosters || []).forEach(b => {
      console.log('  -', b.title)
    })
  }
}

check()
