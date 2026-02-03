const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listBoosters() {
  // Get all products with their types
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('id, title, product_type_id, metadata, product_types(name, is_addon)')
    .is('deleted_at', null)
    .order('title')

  console.log('=== ALL PRODUCTS BY TYPE ===')
  console.log('Total:', allProducts?.length)

  // Separate base products and addons
  const baseProducts = allProducts?.filter(p => p.product_types?.is_addon !== true) || []
  const addonProducts = allProducts?.filter(p => p.product_types?.is_addon === true || p.metadata?.is_addon === true) || []

  console.log('Base products:', baseProducts.length)
  console.log('Add-ons (boosters):', addonProducts.length)

  if (addonProducts.length === 0) {
    // Check metadata for is_addon
    const metadataAddons = allProducts?.filter(p => p.metadata?.is_addon === true) || []
    console.log('\nMetadata-based addons:', metadataAddons.length)
    metadataAddons.forEach(p => console.log('  -', p.title))
  }

  // Use the addon products we found
  const boosters = addonProducts.length > 0 ? addonProducts : []
  console.log('\nUsing', boosters.length, 'boosters')

  if (allError) {
    console.error('Error:', allError)
    return
  }

  // Get category mappings
  const { data: mappings } = await supabase
    .from('product_category_mapping')
    .select('product_id, product_categories(name, handle)')

  const catByProduct = {}
  mappings?.forEach(m => {
    if (!catByProduct[m.product_id]) catByProduct[m.product_id] = []
    if (m.product_categories) catByProduct[m.product_id].push(m.product_categories.handle)
  })

  // Get categories list
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, handle')

  console.log('\n=== ALL ' + boosters.length + ' BOOSTERS ===\n')
  boosters.forEach((b, i) => {
    const cats = catByProduct[b.id] || []
    const catStr = cats.length > 0 ? cats.join(', ') : 'NO CATEGORY'
    console.log((i + 1) + '. ' + b.title)
    console.log('   Category: ' + catStr)
    if (b.hero_benefit) {
      console.log('   Benefit: ' + b.hero_benefit.substring(0, 60) + '...')
    }
    console.log('')
  })

  // Count by category
  const counts = { face: 0, eye: 0, body: 0, scalp: 0, none: 0 }
  boosters.forEach(b => {
    const cats = catByProduct[b.id] || []
    if (cats.length === 0) {
      counts.none++
    } else {
      cats.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
    }
  })
  console.log('=== SUMMARY ===')
  console.log('Face:', counts.face)
  console.log('Eye:', counts.eye)
  console.log('Body:', counts.body)
  console.log('Scalp:', counts.scalp)
  console.log('No category:', counts.none)
}

listBoosters()
