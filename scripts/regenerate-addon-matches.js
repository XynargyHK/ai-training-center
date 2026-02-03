// Regenerate product addon matches
// Links boosters to base products (creams, serums, etc.)
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Booster type handles
const BOOSTER_TYPES = ['booster']
// Base product type handles
const BASE_PRODUCT_TYPES = ['cream', 'serum', 'lotion', 'cleanser', 'toner', 'mask', 'oil', 'shampoo']

async function regenerate() {
  console.log('Regenerating product addon matches...\n')

  // 1. Get all product types
  const { data: productTypes } = await supabase
    .from('product_types')
    .select('id, name, handle')

  console.log('Product types found:', productTypes?.length || 0)

  // Get booster type IDs
  const boosterTypeIds = (productTypes || [])
    .filter(t => BOOSTER_TYPES.includes(t.handle))
    .map(t => t.id)

  // Get base product type IDs
  const baseTypeIds = (productTypes || [])
    .filter(t => BASE_PRODUCT_TYPES.includes(t.handle))
    .map(t => t.id)

  console.log('Booster type IDs:', boosterTypeIds.length)
  console.log('Base product type IDs:', baseTypeIds.length)

  // 2. Get all boosters
  const { data: boosters } = await supabase
    .from('products')
    .select('id, title, product_type_id')
    .in('product_type_id', boosterTypeIds)
    .eq('status', 'published')

  console.log('\nBoosters found:', boosters?.length || 0)

  // 3. Get all base products
  const { data: baseProducts } = await supabase
    .from('products')
    .select('id, title, product_type_id')
    .in('product_type_id', baseTypeIds)
    .eq('status', 'published')

  console.log('Base products found:', baseProducts?.length || 0)

  if (!boosters?.length || !baseProducts?.length) {
    console.log('\nNo products to match. Exiting.')
    return
  }

  // 4. Clear existing addon matches
  console.log('\nClearing existing addon matches...')
  const { error: deleteError } = await supabase
    .from('product_addon_matches')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.error('Error deleting:', deleteError)
    return
  }

  // 5. Create new matches - each base product gets all boosters
  console.log('Creating new matches...')
  const matches = []

  for (const base of baseProducts) {
    for (let i = 0; i < boosters.length; i++) {
      const booster = boosters[i]
      matches.push({
        product_id: base.id,
        addon_product_id: booster.id,
        display_order: i
      })
    }
  }

  console.log(`Total matches to create: ${matches.length}`)

  // Insert in batches
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize)
    const { error } = await supabase
      .from('product_addon_matches')
      .insert(batch)

    if (error) {
      console.error('Error inserting batch:', error)
    } else {
      inserted += batch.length
      process.stdout.write(`\rInserted: ${inserted}/${matches.length}`)
    }
  }

  console.log('\n\nDone! Created', inserted, 'addon matches.')
  console.log('Each base product now has', boosters.length, 'booster options.')
}

regenerate()
