/**
 * Update all products to published status
 * And for boosters, keep only 2ml variant pricing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateProducts() {
  console.log('Starting product updates...\n')

  // 1. Update all products to published status
  console.log('1. Updating all products to published status...')
  const { data: updatedProducts, error: statusError } = await supabase
    .from('products')
    .update({ status: 'published' })
    .is('deleted_at', null)
    .select('id, title')

  if (statusError) {
    console.error('Error updating status:', statusError)
  } else {
    console.log(`   Updated ${updatedProducts.length} products to published\n`)
  }

  // 2. Get all booster products (products with type that has is_addon = true)
  console.log('2. Finding booster products to clean up pricing...')
  const { data: boosters, error: boosterError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      product_type_id,
      product_types(id, name, is_addon),
      product_variants(
        id,
        title,
        sku,
        product_variant_prices(id, amount, currency_code)
      )
    `)
    .is('deleted_at', null)

  if (boosterError) {
    console.error('Error fetching boosters:', boosterError)
    return
  }

  // Filter to only addon products
  const addonProducts = boosters.filter(p => p.product_types?.is_addon === true)
  console.log(`   Found ${addonProducts.length} addon/booster products\n`)

  // 3. For each booster, keep only 2ml variant
  console.log('3. Cleaning up booster variants (keeping only 2ml)...')

  for (const product of addonProducts) {
    if (!product.product_variants || product.product_variants.length === 0) {
      continue
    }

    console.log(`   Processing: ${product.title}`)
    console.log(`   - Has ${product.product_variants.length} variants`)

    // Find 2ml variant
    const variant2ml = product.product_variants.find(v =>
      v.title?.toLowerCase().includes('2ml') ||
      v.sku?.toLowerCase().includes('2ml')
    )

    // Get non-2ml variants to delete
    const variantsToDelete = product.product_variants.filter(v =>
      !v.title?.toLowerCase().includes('2ml') &&
      !v.sku?.toLowerCase().includes('2ml')
    )

    if (variantsToDelete.length > 0) {
      console.log(`   - Deleting ${variantsToDelete.length} non-2ml variants`)

      for (const variant of variantsToDelete) {
        // Delete variant prices first
        if (variant.product_variant_prices?.length > 0) {
          const priceIds = variant.product_variant_prices.map(p => p.id)
          await supabase
            .from('product_variant_prices')
            .delete()
            .in('id', priceIds)
        }

        // Delete variant
        await supabase
          .from('product_variants')
          .delete()
          .eq('id', variant.id)
      }
    }

    if (variant2ml) {
      console.log(`   - Kept 2ml variant: ${variant2ml.title}`)
    } else if (product.product_variants.length === 1) {
      console.log(`   - Only 1 variant, kept as is`)
    } else {
      console.log(`   - No 2ml variant found, kept all`)
    }

    console.log('')
  }

  console.log('Done!')
}

updateProducts().catch(console.error)
