/**
 * Check booster category mappings
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Get boosters with their category mappings
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      title,
      metadata,
      product_types(is_addon),
      product_category_mapping(
        id,
        product_categories(id, name, handle)
      )
    `)
    .is('deleted_at', null)
    .order('title')

  const boosters = products?.filter(p =>
    p.product_types?.is_addon === true || p.metadata?.is_addon === true
  ) || []

  console.log('Booster Category Mappings:\n')
  console.log('# | Booster | Face | Eye | Body | Scalp')
  console.log('--|---------|------|-----|------|------')

  boosters.forEach((b, i) => {
    const cats = b.product_category_mapping?.map(m => m.product_categories?.handle) || []
    const face = cats.includes('face') ? '✓' : ''
    const eye = cats.includes('eye') ? '✓' : ''
    const body = cats.includes('body') ? '✓' : ''
    const scalp = cats.includes('scalp') ? '✓' : ''
    console.log(`${i+1} | ${b.title.substring(0, 30)} | ${face} | ${eye} | ${body} | ${scalp}`)
  })

  console.log(`\nTotal: ${boosters.length} boosters`)
}

main()
