// Script to check SkinCoach data status
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  console.log('SkinCoach Data Status:')
  console.log('='.repeat(50))

  // Get skin_concerns attribute
  const { data: attribute } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('handle', 'skin_concerns')
    .single()

  // Skin concerns (now from product_attribute_options)
  const { data: concerns } = await supabase
    .from('product_attribute_options')
    .select('id, name, product_categories(handle)')
    .eq('attribute_id', attribute?.id)
  console.log('Skin Concerns:', concerns?.length || 0, 'records')

  // Product-Concern mappings (now from product_attribute_values)
  const { data: mappings } = await supabase
    .from('product_attribute_values')
    .select('*')
    .eq('attribute_id', attribute?.id)
  console.log('Product-Concern Mappings:', mappings?.length || 0, 'records')

  // Products (boosters) - via product_types join
  const { data: boosterTypes } = await supabase.from('product_types').select('id').ilike('handle', 'booster')
  const boosterTypeIds = (boosterTypes || []).map(t => t.id)
  const { data: boosters } = await supabase.from('products').select('id, title').in('product_type_id', boosterTypeIds)
  console.log('Boosters (products):', boosters?.length || 0, 'products')

  // Product addon matches
  const { data: addons } = await supabase.from('product_addon_matches').select('*')
  console.log('Product Addon Matches:', addons?.length || 0, 'records')

  // Customer profiles
  const { data: profiles } = await supabase.from('customer_profiles').select('*')
  console.log('Customer Profiles:', profiles?.length || 0, 'records')

  console.log('')
  console.log('Concerns by Category:')
  const cats = {}
  ;(concerns || []).forEach(c => {
    const category = c.product_categories?.handle || 'uncategorized'
    if (!cats[category]) cats[category] = []
    cats[category].push(c.name)
  })
  Object.keys(cats).forEach(cat => {
    console.log('  ' + cat + ':', cats[cat].join(', '))
  })
}

check()
