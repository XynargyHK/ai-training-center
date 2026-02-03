const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Get categories
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, handle')

  console.log('=== CATEGORIES ===')
  if (categories) {
    categories.forEach(c => console.log('  -', c.name, '(' + c.handle + ')'))
  }

  // Get product types
  const { data: types } = await supabase
    .from('product_types')
    .select('id, name, handle, is_addon')

  console.log('\n=== PRODUCT TYPES ===')
  console.log('Base Types:')
  if (types) {
    types.filter(t => t.is_addon === false).forEach(t => console.log('  -', t.name))
  }
  console.log('Add-on Types:')
  if (types) {
    types.filter(t => t.is_addon === true).forEach(t => console.log('  -', t.name))
  }

  // Count products by type
  const { data: products } = await supabase
    .from('products')
    .select('title, product_types(name, is_addon)')
    .is('deleted_at', null)

  console.log('\n=== PRODUCT COUNTS ===')
  const baseProducts = products?.filter(p => p.product_types?.is_addon !== true) || []
  const addonProducts = products?.filter(p => p.product_types?.is_addon === true) || []
  console.log('Base products:', baseProducts.length)
  console.log('Add-on products:', addonProducts.length)

  console.log('\n=== BASE PRODUCTS ===')
  baseProducts.forEach(p => console.log('  -', p.title, '→', p.product_types?.name || 'no type'))

  // Check boosters by category
  const { data: boosters } = await supabase
    .from('products')
    .select('id, title, category_id, product_categories(name, handle)')
    .eq('type_id', types?.find(t => t.is_addon === true)?.id)
    .is('deleted_at', null)

  console.log('\n=== BOOSTERS BY CATEGORY ===')
  const byCategory = {}
  boosters?.forEach(b => {
    const cat = b.product_categories?.handle || 'no-category'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(b.title)
  })

  Object.entries(byCategory).forEach(([cat, prods]) => {
    console.log('\n' + cat.toUpperCase() + ' (' + prods.length + '):')
    prods.forEach(p => console.log('  -', p))
  })
}

check()
